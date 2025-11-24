"""
Chat service handling AI model interactions with streaming support.
Manages OpenAI and Anthropic API calls with vector DB integration.
"""
import json
import asyncio
import logging
from typing import List, Dict, Any, AsyncGenerator
from anthropic import Anthropic
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatService:
    """Handles chat interactions with multiple AI providers"""

    def __init__(self, prompt_manager, vector_db):
        self.prompt_manager = prompt_manager
        self.vector_db = vector_db

        # Initialize API clients
        self.anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def _analyze_intent(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Analyze conversation intent to determine if vector DB lookup is needed.
        Returns dict with 'needs_search' (bool) and 'query' (str or None).
        """
        try:
            # Build conversation summary
            conversation_text = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in messages
                if msg['role'] != 'system'
            ])

            intent_prompt = f"""Analysiere die folgende Konversation und entscheide, ob eine Suche in der Wissensdatenbank nötig ist.

Konversation:
{conversation_text}

Deine Aufgabe:
1. Bestimme, ob das Anliegen des Nutzers klar genug ist für eine Wissensdatenbank-Suche
2. Falls JA: Formuliere eine präzise Suchanfrage basierend auf dem GESAMTEN Kontext der Konversation
3. Falls NEIN: Wenn das Anliegen unklar ist (z.B. nur ein Wort, Unsinn, oder zu vage), gib SKIP zurück

Antworte AUSSCHLIESSLICH in einem dieser Formate:
- "SEARCH: [deine optimierte Suchanfrage hier]" - wenn eine Suche sinnvoll ist
- "SKIP: [kurze Begründung]" - wenn das Anliegen zu unklar ist

Beispiele:
- User: "eSIM" → "SKIP: Anliegen zu vage, Klärungsfrage nötig"
- User: "Wie aktiviere ich meine eSIM?" → "SEARCH: eSIM Aktivierung Anleitung"
- User: "asdfgh" → "SKIP: Keine erkennbare Anfrage"
- Nach Konversation über Internetprobleme, User: "und was kostet das?" → "SEARCH: Kosten Technikerbesuch Internetstörung"
"""

            # Use fast model for intent analysis (gpt-4o-mini)
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": intent_prompt}],
                max_tokens=200,
                temperature=0
            )

            result = response.choices[0].message.content.strip()
            logger.info(f"Intent analysis result: {result}")

            # Parse the result
            if result.startswith("SEARCH:"):
                query = result.replace("SEARCH:", "").strip()
                return {"needs_search": True, "query": query}
            elif result.startswith("SKIP:"):
                reason = result.replace("SKIP:", "").strip()
                return {"needs_search": False, "query": None, "reason": reason}
            else:
                # Fallback: if format is unexpected, skip search
                logger.warning(f"Unexpected intent format: {result}")
                return {"needs_search": False, "query": None, "reason": "Unexpected format"}

        except Exception as e:
            logger.error(f"Intent analysis error: {str(e)}")
            # On error, fall back to no search
            return {"needs_search": False, "query": None, "reason": str(e)}

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str,
        prompt_id: str = "default",
        model_config: Dict[str, Any] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat responses with tool calls and vector DB retrieval.
        Yields Server-Sent Events (SSE) formatted data.
        """
        try:
            logger.info(f"Starting chat stream - model: {model}, prompt: {prompt_id}")
            # Get prompt configuration
            prompt_config = self.prompt_manager.get_prompt(prompt_id)
            if not prompt_config:
                prompt_config = self._get_default_prompt()

            # Analyze intent to determine if vector search is needed
            intent_result = await self._analyze_intent(messages)
            logger.info(f"Intent analysis: {intent_result}")

            context = ""

            # Only perform vector search if intent analysis says it's needed
            if intent_result["needs_search"] and intent_result["query"]:
                search_query = intent_result["query"]

                yield self._format_sse("tool_call_start", {
                    "tool": "vector_search",
                    "query": search_query
                })

                # Force event to be sent before blocking operation
                await asyncio.sleep(0)

                vector_results = self.vector_db.search(search_query, n_results=5)

                yield self._format_sse("tool_call_end", {
                    "tool": "vector_search",
                    "results": vector_results
                })

                # Build context from vector results
                context = self._build_context(vector_results)
            else:
                # Skip vector search - intent was unclear or not relevant
                logger.info(f"Skipping vector search: {intent_result.get('reason', 'No reason provided')}")

            # Prepare messages with system prompt and context
            full_messages = self._prepare_messages(messages, prompt_config, context)

            # Stream based on provider
            if model.startswith("gpt") or model.startswith("o1"):
                async for chunk in self._stream_openai(model, full_messages, model_config):
                    yield chunk
            elif model.startswith("claude"):
                async for chunk in self._stream_anthropic(model, full_messages, model_config):
                    yield chunk
            else:
                raise ValueError(f"Unsupported model: {model}")

        except Exception as e:
            logger.error(f"Stream chat error: {str(e)}")
            yield self._format_sse("error", {"message": str(e)})

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str,
        prompt_id: str = "default",
        model_config: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Non-streaming chat completion.
        """
        try:
            logger.info(f"Starting non-streaming chat - model: {model}, prompt: {prompt_id}")
            # Collect all streaming events
            content = ""
            tool_calls = []
            reasoning = ""

            async for event_str in self.stream_chat(messages, model, prompt_id, model_config or {}):
                # Parse SSE format
                if "event:" in event_str and "data:" in event_str:
                    lines = event_str.strip().split('\n')
                    event_type = ""
                    data = {}

                    for line in lines:
                        if line.startswith('event:'):
                            event_type = line.replace('event:', '').strip()
                        elif line.startswith('data:'):
                            try:
                                data = json.loads(line.replace('data:', '').strip())
                            except:
                                pass

                    if event_type == "content":
                        content += data.get("delta", "")
                    elif event_type == "tool_call_end":
                        tool_calls.append(data)
                    elif event_type == "reasoning":
                        reasoning = data.get("content", "")

            return {
                "content": content,
                "tool_calls": tool_calls,
                "reasoning": reasoning if reasoning else None
            }
        except Exception as e:
            logger.error(f"Non-streaming chat error: {str(e)}")
            raise Exception(f"Chat error: {str(e)}")

    async def _stream_openai(
        self,
        model: str,
        messages: List[Dict[str, str]],
        config: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Stream OpenAI chat completion"""
        try:
            # Handle o1 models (no streaming)
            if model.startswith("o1"):
                response = self.openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_completion_tokens=config.get("max_completion_tokens", 8000),
                    **{k: v for k, v in config.items() if k != "max_completion_tokens"}
                )

                # Send reasoning if available
                if hasattr(response.choices[0].message, "reasoning"):
                    yield self._format_sse("reasoning", {
                        "content": response.choices[0].message.reasoning
                    })

                yield self._format_sse("content", {
                    "delta": response.choices[0].message.content
                })
                yield self._format_sse("done", {})
            else:
                # Standard streaming models
                stream = self.openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    stream=True,
                    **config
                )

                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield self._format_sse("content", {
                            "delta": chunk.choices[0].delta.content
                        })

                yield self._format_sse("done", {})

        except Exception as e:
            logger.error(f"OpenAI stream error: {str(e)}")
            yield self._format_sse("error", {"message": str(e)})

    async def _stream_anthropic(
        self,
        model: str,
        messages: List[Dict[str, str]],
        config: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Stream Anthropic chat completion"""
        try:
            # Extract system message
            system_msg = ""
            chat_messages = []

            for msg in messages:
                if msg["role"] == "system":
                    system_msg = msg["content"]
                else:
                    chat_messages.append(msg)

            # Stream response
            with self.anthropic_client.messages.stream(
                model=model,
                max_tokens=config.get("max_tokens", 8192),
                system=system_msg,
                messages=chat_messages,
            ) as stream:
                for text in stream.text_stream:
                    yield self._format_sse("content", {"delta": text})

            yield self._format_sse("done", {})

        except Exception as e:
            logger.error(f"Anthropic stream error: {str(e)}")
            yield self._format_sse("error", {"message": str(e)})

    def _build_context(self, vector_results: Dict[str, Any]) -> str:
        """Build context string from vector search results"""
        if not vector_results or not vector_results.get("documents"):
            return ""

        context_parts = ["# Relevant Knowledge Base Articles\n"]

        documents = vector_results.get("documents", [[]])[0]
        metadatas = vector_results.get("metadatas", [[]])[0]

        for i, (doc, meta) in enumerate(zip(documents, metadatas), 1):
            context_parts.append(f"\n## Article {i}")
            if meta and meta.get("title"):
                context_parts.append(f"Title: {meta['title']}")
            if meta and meta.get("url"):
                context_parts.append(f"Source: {meta['url']}")
            context_parts.append(f"\n{doc}\n")

        return "\n".join(context_parts)

    def _prepare_messages(
        self,
        messages: List[Dict[str, str]],
        prompt_config: Dict[str, Any],
        context: str
    ) -> List[Dict[str, str]]:
        """Prepare messages with system prompt and context"""
        system_prompt = prompt_config.get("system_prompt", "")

        if context:
            system_prompt += f"\n\n{context}"

        prepared = [{"role": "system", "content": system_prompt}]
        prepared.extend(messages)

        return prepared

    def _get_default_prompt(self) -> Dict[str, Any]:
        """Get default prompt configuration"""
        return {
            "id": "default",
            "name": "Default",
            "tone": "professional and helpful",
            "behavior": "assist with customer service inquiries",
            "use_case": "general customer support",
            "system_prompt": "You are a helpful customer service assistant for 1&1."
        }

    def _format_sse(self, event_type: str, data: Dict[str, Any]) -> str:
        """Format Server-Sent Event"""
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
