# AI News Hub

**An AI-powered news aggregator that delivers a concise daily summary of AI news.**

Get caught up on AI developments in 3-5 minutes. One briefing, multiple sources, zero noise.

---

## What It Does

- Fetches AI news from curated RSS sources
- Deduplicates and ranks stories by importance
- Generates concise summaries using LLMs
- Delivers a daily briefing at 8:00 AM
- Tracks read/unread state

**For:** Developers and AI practitioners who want to stay current without information overload

---

## Architecture

Three-tier system with separate frontend and backend:

**Frontend** → Next.js on Vercel (free tier)  
**Backend** → Express.js on Railway ($5/mo)  
**Database** → PostgreSQL on Supabase (free tier)  
**LLM** → OpenAI GPT-4o-mini ($30-50/mo)

Uses AI SDK (ai-sdk.dev) for LLM interactions and streaming.

**Why separate backend?** Briefing generation takes 60-90 seconds, exceeding serverless timeout limits.

---

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, AI SDK UI
- **Backend:** Express.js, TypeScript, AI SDK Core
- **Database:** PostgreSQL (Supabase)
- **LLM:** OpenAI GPT-4o-mini
- **Deployment:** Vercel (frontend), Railway (backend)

**Key libraries:** `ai` (AI SDK), `rss-parser`, `pg`, `winston`

---

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account (free tier)
- OpenAI API key

### Quick Setup

See [SETUP.md](SETUP.md) for detailed instructions.

**Summary:**
1. Clone repository
2. Set up Supabase dev database
3. Install dependencies (`npm install` in both `backend/` and `frontend/`)
4. Configure environment variables (`.env` in both directories)
5. Run migrations (`npm run migrate` in `backend/`)
6. Start servers (`npm run dev` in both directories)

**Backend:** http://localhost:3005
**Frontend:** http://localhost:3000

---

## Development

**Run both servers:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

**Common commands:**
- `npm run migrate` - Run database migrations
- `npm run test:db` - Test database connection
- `npm run build` - Build for production

See [SETUP.md](SETUP.md) for detailed development workflow.

---

## Deployment

- **Frontend:** Deploy to Vercel (connect GitHub repo)
- **Backend:** Deploy to Railway (connect GitHub repo)
- **Database:** Already on Supabase
- **Cron:** Railway cron (daily 8 AM trigger)

Set production environment variables in Railway and Vercel dashboards.

---

## Project Roadmap

This project evolves through 6 structured phases:

**Phase 1 (2-3 weeks)** - Core briefing generation with RSS + LLM  
**Phase 2 (3-5 weeks)** - Agentic reasoning and intelligent ranking  
**Phase 3 (2-4 weeks)** - Evaluations and quality guardrails  
**Phase 4 (4-6 weeks)** - MCP architecture + generative UI  
**Phase 5 (2-4 weeks)** - Real-time streaming and chat  
**Phase 6 (2 weeks)** - Production hardening and polish  

Total timeline: 4-6 months

---

## Documentation

- [Setup Guide](SETUP.md) - Complete development environment setup

## License

MIT

---

**Status:** Phase 0 Complete | Next: Phase 1 (Core Briefing Generation)