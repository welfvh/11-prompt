"""
Main FastAPI application for 11-prompt project.
Provides API endpoints for chat, prompt configuration, and vector search.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
from pathlib import Path

from api.chat import ChatService
from api.prompts import PromptManager
from vector_db.chroma_client import VectorDBClient

app = FastAPI(title="11-Prompt API", version="1.0.0")

# CORS configuration - allow all origins for deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
prompt_manager = PromptManager()
vector_db = VectorDBClient()
chat_service = ChatService(prompt_manager, vector_db)


@app.on_event("startup")
async def startup_event():
    """Initialize vector DB with scraped data if collection is empty"""
    stats = vector_db.get_stats()

    if stats.get("document_count", 0) == 0:
        print("Vector DB is empty, loading scraped articles...")

        # Load scraped articles
        data_file = Path(__file__).parent.parent / "data" / "scraped_articles.json"

        if data_file.exists():
            with open(data_file, "r", encoding="utf-8") as f:
                articles = json.load(f)

            # Prepare data for ChromaDB
            documents = []
            metadatas = []
            ids = []

            for article in articles:
                if article.get("content"):
                    documents.append(article["content"])
                    metadatas.append({
                        "title": article.get("title", ""),
                        "url": article.get("url", ""),
                        "source": "1&1 Helpdesk"
                    })
                    # Generate ID from URL or title
                    article_id = article.get("url", "").split("/")[-1] or f"article_{len(ids)}"
                    ids.append(article_id)

            if documents:
                result = vector_db.add_documents(documents, metadatas, ids)
                print(f"Loaded {len(documents)} articles into vector DB")
                print(f"Result: {result}")
        else:
            print(f"Warning: Scraped articles file not found at {data_file}")
    else:
        print(f"Vector DB already has {stats.get('document_count')} documents")


# Request/Response models
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str
    prompt_id: Optional[str] = "default"
    stream: bool = True
    model_params: Optional[Dict[str, Any]] = None  # Renamed from model_config (reserved in Pydantic v2)


class PromptConfig(BaseModel):
    id: str
    name: str
    tone: str
    behavior: str
    use_case: str
    system_prompt: str
    additional_instructions: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class VectorSearchRequest(BaseModel):
    query: str
    n_results: int = 5


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "11-prompt API"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Main chat endpoint with streaming support.
    Handles vector DB retrieval and tool calls.
    """
    try:
        # Convert Pydantic models to dicts
        messages_dict = [msg.model_dump() for msg in request.messages]

        if request.stream:
            return StreamingResponse(
                chat_service.stream_chat(
                    messages=messages_dict,
                    model=request.model,
                    prompt_id=request.prompt_id,
                    model_config=request.model_params or {}
                ),
                media_type="text/event-stream"
            )
        else:
            response = await chat_service.chat(
                messages=messages_dict,
                model=request.model,
                prompt_id=request.prompt_id,
                model_config=request.model_params or {}
            )
            return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/prompts")
async def list_prompts():
    """List all available prompt configurations"""
    return prompt_manager.list_prompts()


@app.get("/api/prompts/{prompt_id}")
async def get_prompt(prompt_id: str):
    """Get a specific prompt configuration"""
    prompt = prompt_manager.get_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


@app.post("/api/prompts")
async def create_prompt(config: PromptConfig):
    """Create a new prompt configuration"""
    try:
        result = prompt_manager.save_prompt(config.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/prompts/{prompt_id}")
async def update_prompt(prompt_id: str, config: PromptConfig):
    """Update an existing prompt configuration"""
    try:
        config_dict = config.dict()
        config_dict["id"] = prompt_id
        result = prompt_manager.save_prompt(config_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str):
    """Delete a prompt configuration"""
    try:
        result = prompt_manager.delete_prompt(prompt_id)
        if not result:
            raise HTTPException(status_code=404, detail="Prompt not found")
        return {"status": "deleted", "id": prompt_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/vector/search")
async def vector_search(request: VectorSearchRequest):
    """Search the vector database"""
    try:
        results = vector_db.search(request.query, n_results=request.n_results)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/vector/stats")
async def vector_stats():
    """Get vector database statistics"""
    try:
        stats = vector_db.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models")
async def list_models():
    """List available AI models with their configurations"""
    return {
        "models": [
            {
                "id": "gpt-4o",
                "name": "GPT-4o",
                "provider": "openai",
                "supports_streaming": True,
                "default_config": {}
            },
            {
                "id": "gpt-4o-mini",
                "name": "GPT-4o Mini",
                "provider": "openai",
                "supports_streaming": True,
                "default_config": {}
            },
            {
                "id": "o1",
                "name": "GPT-5 (o1)",
                "provider": "openai",
                "supports_streaming": False,
                "default_config": {
                    "max_completion_tokens": 8000,
                    "reasoning_effort": "medium"
                },
                "config_options": {
                    "reasoning_effort": {
                        "type": "select",
                        "options": ["low", "medium", "high"],
                        "description": "Thinking time for reasoning tasks"
                    }
                }
            },
            {
                "id": "o1-mini",
                "name": "GPT-5 Mini (o1-mini)",
                "provider": "openai",
                "supports_streaming": False,
                "default_config": {
                    "max_completion_tokens": 8000,
                    "reasoning_effort": "medium"
                },
                "config_options": {
                    "reasoning_effort": {
                        "type": "select",
                        "options": ["low", "medium", "high"],
                        "description": "Thinking time for reasoning tasks"
                    }
                }
            },
            {
                "id": "claude-sonnet-4-20250514",
                "name": "Claude Sonnet 4",
                "provider": "anthropic",
                "supports_streaming": True,
                "default_config": {
                    "max_tokens": 8192
                }
            },
            {
                "id": "claude-opus-4-20250514",
                "name": "Claude Opus 4",
                "provider": "anthropic",
                "supports_streaming": True,
                "default_config": {
                    "max_tokens": 8192
                }
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
