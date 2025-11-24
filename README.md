# 11-Prompt Testing Platform

A comprehensive testbed for developing, testing, and optimizing chatbot prompts for the 1&1 customer service team.

## Features

- **Multi-Model Support**: Test with OpenAI (GPT-4o, GPT-4o-mini, GPT-5/o1) and Anthropic (Claude Sonnet 4, Opus 4) models
- **Prompt Management**: User-friendly interface for configuring prompts with sections for tone, behavior, and use cases
- **Vector Database Integration**: ChromaDB-powered knowledge base from hilfe-center.1und1.de
- **Real-time Streaming**: See responses as they're generated
- **Tool Call Visualization**: Expandable views of vector database searches and retrievals
- **Model-Specific Configs**: Configure GPT-5 thinking time and other model parameters
- **Version Control**: JSON-based prompt storage with versioning

## Architecture

```
11-prompt/
├── backend/           # FastAPI server
│   ├── api/          # API endpoints and services
│   ├── scraper/      # Help center web scraper
│   ├── vector_db/    # ChromaDB integration
│   └── main.py       # Main application
├── frontend/          # React + TypeScript UI
│   └── src/
│       ├── components/  # UI components
│       ├── services/    # API client
│       └── types/       # TypeScript definitions
├── prompts/           # JSON prompt configurations
└── data/              # Scraped content & vector DB
```

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- API keys for OpenAI and Anthropic

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

5. Start the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The UI will be available at `http://localhost:5173`

## Scraping Help Center Content

To populate the vector database with help center articles:

```bash
cd backend
python -m scraper.helpdesk_scraper
```

This will:
1. Crawl hilfe-center.1und1.de
2. Extract article content
3. Save to `data/scraped_articles.json`
4. Import into ChromaDB

## Usage

### 1. Select a Model

Choose from available OpenAI and Anthropic models. Configure model-specific settings like GPT-5 reasoning effort.

### 2. Configure Your Prompt

Use the Prompt Editor to define:
- **Tone**: How the assistant should communicate
- **Behavior**: Guidelines and rules for responses
- **System Prompt**: The complete prompt sent to the model
- **Use Case**: Context about when this prompt is used

### 3. Test in Chat

Send messages and observe:
- Real-time streaming responses
- Vector DB search results (expandable)
- Reasoning traces (for GPT-5/o1 models)
- Tool calls and their performance

### 4. Iterate

Save different prompt versions, compare results, and optimize for your use case.

## API Endpoints

### Chat
- `POST /api/chat` - Send messages with streaming support

### Prompts
- `GET /api/prompts` - List all prompts
- `GET /api/prompts/{id}` - Get specific prompt
- `POST /api/prompts` - Create new prompt
- `PUT /api/prompts/{id}` - Update prompt
- `DELETE /api/prompts/{id}` - Delete prompt

### Models
- `GET /api/models` - List available AI models

### Vector Database
- `POST /api/vector/search` - Search knowledge base
- `GET /api/vector/stats` - Get database statistics

## Model Configurations

### GPT-5 (o1) Models

The o1 models use extended thinking time for complex reasoning:

- **Reasoning Effort**: `low`, `medium`, or `high`
  - **Low**: ~5-10s thinking time, suitable for simple queries
  - **Medium**: ~15-30s thinking time, balanced for most use cases (default for CS)
  - **High**: 30s+ thinking time, for complex analytical tasks

Note: o1 models don't support streaming due to their reasoning process.

### Standard Models (GPT-4o, Claude)

These models support streaming and have lower latency, suitable for real-time customer service interactions.

## Development

### Frontend
```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

### Backend
```bash
cd backend
python main.py    # Start with auto-reload
```

## Project Goals

This platform enables the product team to:

1. **Test multiple AI models** side-by-side
2. **Iterate on prompts** quickly with a user-friendly interface
3. **Evaluate performance** with real help center content
4. **Optimize for latency** by comparing model configurations
5. **Version control** prompt iterations

## Notes

- Prompt configurations are saved as JSON files in `/prompts`
- Vector database persists in `/data/chroma`
- Scraped articles are cached in `/data/scraped_articles.json`
- Frontend proxies API calls to avoid CORS issues

## Support

For issues or questions, consult the project documentation or reach out to the development team.
