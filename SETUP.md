# Development Environment Setup Guide

Quick setup instructions for AI Daily Briefing.

---

## Prerequisites

- **Node.js 20+**
- **npm**
- **PostgreSQL database** (any provider: Supabase, Neon, local, etc.)
- **LLM API key** (OpenAI, Anthropic, or other AI SDK-compatible provider)

---

## Setup Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd ai-news-hub
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Configure environment:**
```bash
cp .env.example .env
```

**Edit `.env`:**
```bash
DATABASE_PASSWORD="your-password"
DATABASE_CONNECTION_STRING="postgresql://user:password@host:port/dbname"
PORT=3005
FRONTEND_URL="http://localhost:3000"
```

**Notes:**
- Use your actual PostgreSQL connection string
- Add your LLM provider API key (OpenAI, Anthropic, etc.) as needed
- Port can be any available port

**Test database connection:**
```bash
npm run test:db
```

Expected: ✅ Database connected successfully!

**Run migrations:**
```bash
npm run migrate
```

**Start backend:**
```bash
npm run dev
```

Backend running on http://localhost:3005 (or your configured port)

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

**Configure environment:**
```bash
cp .env.example .env
```

**Edit `.env`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3005
```

Match the port to your backend configuration.

**Start frontend:**
```bash
npm run dev
```

Frontend running on http://localhost:3000

---

## Verify Setup

**Backend health check:**
```
curl http://localhost:3005/health
```

**Frontend:**
```
http://localhost:3000
```

Both should respond without errors.

---

## Common Commands

### Backend
```bash
npm run dev          # Start dev server
npm run test:db      # Test database connection
npm run migrate      # Run migrations
npm run build        # Build for production
```

### Frontend
```bash
npm run dev          # Start dev server  
npm run build        # Build for production
npm run lint         # Lint code
```

---

## Database Setup

You need a PostgreSQL database. Options:

**Managed (Recommended):**
- Supabase (free tier, 500MB)
- Neon (serverless)
- Railway (managed Postgres)

**Local:**
```bash
# Install PostgreSQL locally
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb ai-daily-briefing-dev
```

**Connection String Format:**
```
postgresql://username:password@host:port/database
```

For pooled connections (Supabase/Neon), use the pooler URL (usually port 6543).

---

## LLM Provider Setup

This project uses [AI SDK](https://sdk.vercel.ai) which supports multiple providers.

**Supported providers:**
- OpenAI (GPT-4, GPT-4o-mini)
- Anthropic (Claude)
- Google (Gemini)
- And others

Get an API key from your chosen provider and add it to your backend `.env`:

```bash
# For OpenAI
OPENAI_API_KEY=sk-...

# For Anthropic  
ANTHROPIC_API_KEY=sk-ant-...

# etc.
```

Update the LLM Proxy configuration in `backend/src/config/llm.ts` to match your provider.

---

## Troubleshooting

**Port already in use:**
```bash
# Find process
lsof -i :3005

# Kill it
kill -9 <PID>
```

**Database connection fails:**
- Verify connection string format
- Check database is running
- Ensure firewall allows connections

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---


**Setup complete!** 🎉