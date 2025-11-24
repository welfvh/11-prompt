# 11-Prompt Project Notes

## What We Built

A complete testbed for rewriting and testing the 1&1 chatbot prompt. This replicates your production setup with:

1. **Vector Database**: ChromaDB for semantic search of help center content
2. **Multi-Model Support**: OpenAI (GPT-4o, GPT-5) and Anthropic (Claude Sonnet 4, Opus 4)
3. **Prompt Configuration UI**: User-friendly interface with sections for tone, behavior, use cases
4. **Chat Interface**: Real-time streaming with tool call visualization
5. **Content Scraper**: Automated scraping of hilfe-center.1und1.de

## Key Features for Your Team

### User-Friendly Prompt Editor
Inspired by Intercom's approach, with sections for:
- **Tone**: Define communication style
- **Behavior**: Set guidelines and rules
- **Use Case**: Context about when to use this prompt
- **System Prompt**: The complete prompt with all combined instructions

### Model Comparison
Test the same prompt with multiple models:
- **GPT-4o**: Fast, streaming, good baseline
- **GPT-4o Mini**: Cheaper, faster alternative
- **GPT-5 (o1)**: Extended reasoning, shows thinking process
- **GPT-5 Mini (o1-mini)**: Balanced reasoning model
- **Claude Sonnet 4**: Anthropic's latest general model
- **Claude Opus 4**: Most capable Claude model

### CS Latency Optimization
- GPT-5 reasoning effort configured to "medium" by default (~15-30s thinking time)
- This balances quality vs. latency for customer service use cases
- Adjustable in the UI if you need faster/slower reasoning

### Tool Call Visualization
Every vector DB search is shown as an expandable card displaying:
- Query used
- Articles retrieved
- Relevance scores
- Source URLs
- Retrieval time

## Architecture Decisions

### Why ChromaDB?
- Local, no external dependencies
- Easy setup, no infrastructure needed
- Built-in embeddings
- Good for prototyping

### Why FastAPI Backend?
- Fast, modern Python framework
- Native async support for streaming
- Easy to extend
- Good OpenAPI documentation

### Why React Frontend?
- Matches your 11-agent project stack
- Rich component ecosystem (Radix UI)
- TypeScript for type safety
- Easy for product team to understand

### Why JSON for Prompts?
- Easy to version control
- Human-readable and editable
- Can be reviewed in PRs
- Simple to export/import

## Team Usage

### For Product Managers
1. Use the Prompt Editor tab
2. Write in plain language (Tone, Behavior sections)
3. Test immediately in the Chat tab
4. No technical knowledge needed

### For Engineers
1. Prompts saved as JSON in `/prompts` directory
2. Version control with git
3. API available at http://localhost:8000
4. Extend with custom tools/endpoints

### For Testing/QA
1. Compare responses across models
2. Check vector DB retrievals
3. Verify reasoning for complex queries
4. Export conversation histories (future feature)

## Future Enhancements

Ideas for later:

1. **A/B Testing**: Side-by-side model comparison
2. **Conversation Export**: Save test conversations
3. **Prompt Variants**: Test multiple prompts simultaneously
4. **Analytics**: Track response quality metrics
5. **Custom Tool Integration**: Add your own tools beyond vector search
6. **Scheduled Scraping**: Auto-update knowledge base
7. **Multi-Language**: Support for different locales

## Technical Notes

### Streaming Implementation
- Server-Sent Events (SSE) for real-time updates
- Event types: `tool_call_start`, `tool_call_end`, `content`, `reasoning`, `done`, `error`
- Frontend updates in real-time as chunks arrive

### Vector Search
- Embeddings generated automatically by ChromaDB
- Top 5 results included in context
- Metadata preserved (title, URL)
- Distance scores shown as similarity

### Model Configs
- GPT-5 models: `max_completion_tokens`, `reasoning_effort`
- Standard models: `max_tokens`, `temperature` (easily extendable)
- Configs saved per-model in UI

## Known Limitations

1. **ChromaDB Telemetry Warnings**: Harmless PostHog telemetry errors, don't affect functionality
2. **o1 Models No Streaming**: Due to their reasoning process, responses come all at once
3. **Single Collection**: One vector DB collection for all content (can be extended)
4. **No Auth**: Local development only, add auth for production deployment

## Maintenance

### Updating Dependencies
```bash
cd backend
source venv/bin/activate
pip install --upgrade anthropic openai
```

### Refreshing Help Center Content
```bash
cd backend
source venv/bin/activate
python -m scraper.helpdesk_scraper
```

### Resetting Vector DB
Access http://localhost:8000/docs for Swagger UI, use vector endpoints

## API Keys

Already configured from your existing projects:
- OpenAI: From `/recipe-chatbot/.env`
- Anthropic: From `/11-evals/platform/.env`

These are development keys. Use production keys when deploying.

## Contact & Support

This is a self-contained project. The product team can use it autonomously for prompt development and testing.

For technical questions, refer to:
- `README.md` - Full documentation
- `QUICKSTART.md` - Getting started guide
- API docs: http://localhost:8000/docs
