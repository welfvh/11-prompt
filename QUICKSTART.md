# 11-Prompt Quick Start Guide

## Current Status

Your 11-prompt testing platform is up and running!

- **Backend**: http://localhost:8000 ✅
- **Frontend**: http://localhost:5173 ✅

## What You Have

### 1. Complete Backend (FastAPI)
- Multi-model chat API (OpenAI + Anthropic)
- Streaming support with SSE
- Vector database integration (ChromaDB)
- Prompt management system
- Help center web scraper

### 2. Modern Frontend (React + TypeScript)
- Chat interface with real-time streaming
- Expandable tool call visualization
- Vector DB search results display
- User-friendly prompt editor (inspired by Intercom)
- Model selector with configuration options

### 3. Features Working Out of the Box
- **Multiple AI Models**:
  - GPT-4o, GPT-4o-mini
  - GPT-5 (o1), GPT-5 Mini (o1-mini) with reasoning visualization
  - Claude Sonnet 4, Claude Opus 4

- **Prompt Configuration**:
  - Sections for Tone, Behavior, Use Case
  - System prompt editor
  - JSON-based storage with versioning
  - Easy prompt switching

- **Chat Experience**:
  - Real-time streaming responses
  - Tool call visualization (collapsible)
  - Vector DB retrieval display
  - Reasoning traces for GPT-5 models
  - Message history

## Next Steps

### 1. Populate the Knowledge Base

To scrape help center content:

```bash
cd /Users/welf/dev/11-prompt/backend
source venv/bin/activate
python -m scraper.helpdesk_scraper
```

This will crawl hilfe-center.1und1.de and populate the vector database.

### 2. Test the Chat

1. Open http://localhost:5173 in your browser
2. Select a model (try GPT-4o for fast responses)
3. The default prompt is already loaded
4. Start chatting!

### 3. Configure Your Prompts

1. Click the "Prompts" tab
2. Edit the default prompt or create a new one
3. Configure:
   - **Tone**: How the assistant should communicate
   - **Behavior**: Guidelines and rules
   - **System Prompt**: The complete prompt sent to the model
4. Save and switch back to Chat

### 4. Compare Models

Try the same question with different models:
- GPT-4o: Fast, streaming, good for customer service
- GPT-5 (o1): Slower with reasoning, better for complex queries
- Claude Sonnet 4: Anthropic's latest, different perspective

Watch the reasoning process for o1 models and vector DB searches for all models.

## Configuration

### API Keys

Already configured in `backend/.env`:
- OpenAI API key: ✅ Set
- Anthropic API key: ✅ Set

### Model Settings

For GPT-5/o1 models, you can adjust:
- **Reasoning Effort**: low, medium (default), high
  - Medium (~15-30s) is recommended for CS latency requirements

Access this in the Model Selector panel.

## File Structure

```
11-prompt/
├── backend/
│   ├── api/              # Chat & prompt services
│   ├── scraper/          # Help center scraper
│   ├── vector_db/        # ChromaDB client
│   └── main.py          # FastAPI app
│
├── frontend/
│   └── src/
│       ├── components/   # React components
│       │   ├── ChatInterface.tsx
│       │   ├── PromptEditor.tsx
│       │   ├── ModelSelector.tsx
│       │   └── ToolCallDisplay.tsx
│       ├── services/     # API client
│       └── types/        # TypeScript types
│
├── prompts/              # JSON prompt configs (auto-created)
└── data/                 # Vector DB & scraped content
```

## Troubleshooting

### Backend won't start
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Frontend won't start
```bash
cd frontend
npm install
npm run dev
```

### ChromaDB telemetry warnings
These are harmless and don't affect functionality. They're just PostHog telemetry issues.

## Development Workflow

1. **Edit prompts** in the UI (saves to `/prompts`)
2. **Test with multiple models** side-by-side
3. **Observe tool calls** and vector DB retrieval
4. **Iterate** based on results
5. **Version control** your best prompts (they're just JSON files!)

## Tips

- Start with GPT-4o for quick iteration (streaming)
- Use GPT-5 when you need reasoning traces
- Check the expandable vector DB calls to see what knowledge is being retrieved
- Prompt versions are timestamped automatically
- You can duplicate prompts to create variants

## Ready to Go!

Everything is set up and running. Open http://localhost:5173 and start testing your prompts!
