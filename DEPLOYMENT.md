# Deployment Guide

## Vercel Deployment (Frontend Only)

The current configuration deploys the frontend to Vercel. The backend needs to be deployed separately.

### Prerequisites

1. Install Vercel CLI: `npm install -g vercel`
2. Have your API keys ready:
   - OpenAI API key
   - Anthropic API key

### Option 1: Deploy Frontend to Vercel + Backend Separately

#### Deploy Frontend

1. Push code to GitHub (already done)
2. Import project in Vercel dashboard
3. Configure build settings:
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

4. Set environment variable:
   - `VITE_API_BASE_URL` = Your backend URL (e.g., `https://your-backend.railway.app/api`)

#### Deploy Backend Options

**Option A: Railway**
1. Create account at railway.app
2. Create new project from GitHub repo
3. Set root directory to `backend`
4. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
5. Railway will auto-detect Python and deploy

**Option B: Render**
1. Create account at render.com
2. New Web Service from GitHub
3. Set:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables

**Option C: Fly.io**
```bash
cd backend
fly launch
# Follow prompts
fly secrets set ANTHROPIC_API_KEY=your_key
fly secrets set OPENAI_API_KEY=your_key
fly deploy
```

### Option 2: Full Stack on Vercel (Requires Restructuring)

To deploy both frontend and backend on Vercel, we'd need to:

1. Convert backend to Vercel serverless functions
2. Replace ChromaDB with a hosted vector DB (Pinecone, Supabase, etc.)
3. Restructure project for Vercel's architecture

This requires more significant changes. Let me know if you want this approach.

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000/api  # Local
# or
VITE_API_BASE_URL=https://your-backend.com/api  # Production
```

### Backend (.env)
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Current Architecture

```
┌─────────────────┐
│  Vercel         │
│  (Frontend)     │
└────────┬────────┘
         │
         │ HTTP/SSE
         │
┌────────▼────────┐
│  Railway/Render │
│  (Backend)      │
│  - FastAPI      │
│  - ChromaDB     │
│  - AI APIs      │
└─────────────────┘
```

## Next Steps

1. Choose backend hosting option
2. Deploy backend
3. Update frontend `VITE_API_BASE_URL` in Vercel
4. Test deployment

## Notes

- ChromaDB data persists in the backend filesystem
- For production, consider using a managed vector DB
- Backend needs persistent storage for prompt configurations
