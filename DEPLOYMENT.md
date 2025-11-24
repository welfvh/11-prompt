# Deployment Guide

## Quick Deploy (5 Minutes)

Everything auto-initializes on first startup. ChromaDB data and scraped articles are included in the repo.

### Step 1: Deploy Backend to Railway

**Option A: Via Web Dashboard**
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `welfvh/11-prompt`
4. Railway auto-detects `railway.toml` config ✅
5. Add environment variables in dashboard:
   - `ANTHROPIC_API_KEY` = your key
   - `OPENAI_API_KEY` = your key
6. Deploy and copy the URL (e.g., `https://your-app.up.railway.app`)

**Option B: Via CLI**
```bash
npm install -g @railway/cli
railway login
railway init
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set OPENAI_API_KEY=sk-...
railway up
```

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" → Import `welfvh/11-prompt` from GitHub
3. Vercel auto-detects the `vercel.json` config
4. Add environment variable:
   - `VITE_API_BASE_URL` = `https://your-railway-url.up.railway.app/api`
5. Deploy!

### Done!

Access your app at the Vercel URL from any browser, including your work laptop.

---

## Alternative Backend Hosting

### Render
- Root Directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Fly.io
```bash
cd backend
fly launch
fly secrets set ANTHROPIC_API_KEY=your_key
fly secrets set OPENAI_API_KEY=your_key
fly deploy
```

---

## Architecture

```
┌─────────────────┐
│  Vercel         │  ← Access from work laptop
│  (Frontend)     │
└────────┬────────┘
         │ HTTPS
         │
┌────────▼────────┐
│  Railway        │
│  (Backend)      │
│  - FastAPI      │
│  - ChromaDB     │
│  - AI APIs      │
└─────────────────┘
```

## Features

- ✅ Auto-loads scraped 1&1 articles on startup
- ✅ Intent recognition for smart queries
- ✅ Multi-model support (GPT, Claude, o1)
- ✅ Real-time streaming
- ✅ No local setup needed - works from any browser
