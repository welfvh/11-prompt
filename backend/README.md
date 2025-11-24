# 11-Prompt Backend

FastAPI backend for the 11-prompt chatbot testbed.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

4. Run the server:
```bash
python main.py
```

The API will be available at http://localhost:8000

## Scraping Help Center Content

To scrape and import help center articles:

```bash
cd backend
python -m scraper.helpdesk_scraper
```

This will:
1. Crawl hilfe-center.1und1.de
2. Extract article content
3. Save to data/scraped_articles.json
4. Import into ChromaDB vector database

## API Endpoints

- `GET /` - Health check
- `POST /api/chat` - Chat with streaming support
- `GET /api/prompts` - List all prompts
- `GET /api/prompts/{id}` - Get specific prompt
- `POST /api/prompts` - Create new prompt
- `PUT /api/prompts/{id}` - Update prompt
- `DELETE /api/prompts/{id}` - Delete prompt
- `POST /api/vector/search` - Search vector database
- `GET /api/vector/stats` - Get vector DB statistics
- `GET /api/models` - List available AI models
