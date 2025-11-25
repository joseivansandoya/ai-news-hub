# AI Daily Briefing - Architecture v0.1

**Project:** AI News Hub
**Date:** November 22, 2025
**Version:** 0.1 (Phase 0 - Architecture Lock)  
**Author:** Jose

---

## Table of Contents

1. [Overview](#overview)
2. [High-Level System Architecture](#high-level-system-architecture)
3. [Backend Internal Architecture](#backend-internal-architecture)
4. [Data Flows](#data-flows)
   - [Flow 1: Scheduled Briefing Generation (Phase 1)](#flow-1-scheduled-briefing-generation-phase-1)
   - [Flow 2: Manual Regeneration (Phase 1)](#flow-2-manual-regeneration-phase-1)
   - [Flow 3: Read State Updates (Phase 1)](#flow-3-read-state-updates-phase-1)
   - [Flow 4: Streaming Conversations (Phase 5)](#flow-4-streaming-conversations-phase-5)
5. [Technology Stack](#technology-stack)
6. [Deployment Architecture](#deployment-architecture)
7. [Database Schema](#database-schema)

---

## Overview

AI Daily Briefing is a personal AI-powered news aggregator that generates concise daily summaries of AI news from 7 curated RSS sources.

**Core Promise:** Open one page, get caught up on AI news in 3-5 minutes.

**Architecture Style:** Three-tier separation
- **Frontend:** Next.js (React) on Vercel
- **Backend:** Express.js on Railway
- **Database:** PostgreSQL via Supabase

**Key Design Decisions:**
- Separate backend to avoid serverless timeout constraints (45-90s generation time)
- LLM Proxy as abstraction module (not separate service)
- Database-first architecture for Phases 1-4
- Real-time streaming added in Phase 5
- All LLM calls routed through backend (security, cost control)

---

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer (Vercel - Free Tier)"
        FE[Next.js Application<br/>React Server Components<br/>AI SDK UI Hooks]
    end

    subgraph "Backend Layer (Railway - $5/mo)"
        BE[Express.js Server<br/>Node.js/TypeScript]
        
        subgraph "Backend Services"
            ROUTES[Routes Layer<br/>API Endpoints]
            SERVICES[Services Layer<br/>Business Logic]
            REPOS[Repositories Layer<br/>Data Access]
            LLMPROXY[LLM Proxy Module<br/>AI SDK Core<br/>Provider Abstraction]
        end
        
        ROUTES --> SERVICES
        SERVICES --> REPOS
        SERVICES --> LLMPROXY
    end

    subgraph "External Services"
        LLM[OpenAI API<br/>GPT-4o-mini<br/>$30-50/mo]
        
        subgraph "RSS Sources (Free)"
            RSS1[OpenAI Blog]
            RSS2[Anthropic Blog]
            RSS3[Import AI]
            RSS4[The Batch]
            RSS5[ArXiv AI]
            RSS6[The Verge]
            RSS7[Hacker News]
        end
        
        DB[(Supabase<br/>PostgreSQL<br/>Free Tier)]
    end

    subgraph "Scheduling"
        CRON[Railway Cron<br/>8:00 AM Daily]
    end

    %% User flows
    FE -->|HTTPS/REST<br/>X-User-Id header| BE
    BE -->|SSE Streaming<br/>Phase 5| FE
    
    %% Backend to external
    LLMPROXY -->|AI SDK Core<br/>Streaming Support| LLM
    SERVICES --> RSS1
    SERVICES --> RSS2
    SERVICES --> RSS3
    SERVICES --> RSS4
    SERVICES --> RSS5
    SERVICES --> RSS6
    SERVICES --> RSS7
    REPOS -->|pg Pool<br/>Connection Pooling| DB
    
    %% Cron trigger
    CRON -.->|POST /api/cron<br/>Auth: Bearer token| BE

    style FE fill:#ff99cc
    style BE fill:#ffcc99
    style LLM fill:#99ccff
    style DB fill:#ffff99
    style CRON fill:#cc99ff
    style LLMPROXY fill:#99ffcc
```

**Component Costs:**
- Frontend: $0 (Vercel free tier)
- Backend: $5/mo (Railway)
- Database: $0 (Supabase free tier - 500MB)
- LLM: $30-50/mo (OpenAI API)
- **Total: $35-55/month**

---

## Backend Internal Architecture

```mermaid
graph TB
    subgraph "Express.js Backend Structure"
        subgraph "HTTP Layer"
            R1[/api/briefings/:date<br/>GET]
            R2[/api/briefings/generate<br/>POST]
            R3[/api/stories/:id/read<br/>PATCH]
            R4[/api/chat<br/>POST - Phase 5]
            R5[/api/cron/generate-briefing<br/>POST - Internal]
        end
        
        subgraph "Middleware"
            M1[Auth Middleware<br/>X-User-Id validation]
            M2[Error Handler<br/>Centralized errors]
            M3[Rate Limiter<br/>Phase 2+]
        end
        
        subgraph "Services Layer"
            S1[BriefingService<br/>Orchestration]
            S2[RSSService<br/>Feed fetching]
            S3[DeduplicationService<br/>Similarity detection]
            S4[LLMProxy<br/>AI SDK Core]
        end
        
        subgraph "Repositories Layer"
            REP1[BriefingRepository<br/>Briefing CRUD]
            REP2[StoryRepository<br/>Story CRUD]
            REP3[ReadStateRepository<br/>Read state CRUD]
        end
        
        subgraph "Database Connection"
            POOL[pg Pool<br/>Max 20 connections<br/>SSL enabled]
        end
    end
    
    R1 --> M1
    R2 --> M1
    R3 --> M1
    R4 --> M1
    R5 --> M1
    
    M1 --> S1
    M1 --> S2
    M1 --> S3
    M1 --> S4
    
    S1 --> S2
    S1 --> S3
    S1 --> S4
    S1 --> REP1
    S1 --> REP2
    
    REP1 --> POOL
    REP2 --> POOL
    REP3 --> POOL
    
    M1 --> M2
    M2 -.->|Log errors| LOG[Logger<br/>Winston/Pino]

    style S1 fill:#99ffcc
    style S4 fill:#99ccff
    style POOL fill:#ffff99
```

**Layer Responsibilities:**

- **Routes:** HTTP concerns only (parse, validate, call service, format response)
- **Middleware:** Cross-cutting concerns (auth, errors, rate limiting)
- **Services:** Business logic (orchestration, external APIs, calculations)
- **Repositories:** Database queries only (CRUD, no business logic)
- **LLM Proxy:** Unified interface for all LLM calls (AI SDK Core)

**Key Principle:** Services have ZERO SQL. Repositories have ZERO business logic.

---

## Data Flows

### Flow 1: Scheduled Briefing Generation (Phase 1)

**Trigger:** Railway Cron at 8:00 AM daily

```mermaid
sequenceDiagram
    participant CRON as Railway Cron
    participant BE as Express Backend
    participant RSS as RSS Sources (7)
    participant LLM as OpenAI API
    participant DB as Supabase DB

    Note over CRON: 8:00 AM Daily
    CRON->>BE: POST /api/cron/generate-briefing<br/>Authorization: Bearer <secret>
    
    activate BE
    Note over BE: Validate cron secret
    
    BE->>RSS: Parallel fetch 7 RSS feeds
    activate RSS
    RSS-->>BE: ~150 raw items (5-10s)
    deactivate RSS
    
    Note over BE: DeduplicationService<br/>Title similarity + URL check
    Note over BE: 150 items → 30-50 unique items
    
    Note over BE: Rank & select top 7<br/>Recency (70%) + Source (30%)
    
    loop For each of 7 stories (parallel)
        BE->>LLM: Summarize article<br/>AI SDK Core
        activate LLM
        LLM-->>BE: 3 bullet points (2-5s)
        deactivate LLM
    end
    
    Note over BE: All summaries complete (~30-45s)
    
    BE->>DB: BEGIN TRANSACTION
    activate DB
    
    BE->>DB: Check if briefing exists for today
    DB-->>BE: existingBriefing | null
    
    alt Briefing exists
        BE->>DB: UPDATE briefings<br/>SET deleted_at = NOW()
    end
    
    BE->>DB: INSERT INTO briefings<br/>RETURNING id
    DB-->>BE: briefing_id
    
    BE->>DB: INSERT INTO stories (7 rows)<br/>WITH briefing_id
    
    BE->>DB: COMMIT
    deactivate DB
    
    BE-->>CRON: 200 OK<br/>{success: true, briefingId}
    deactivate BE
    
    Note over CRON,DB: Total time: 60-90 seconds<br/>Cost: ~$0.01-0.02
```

**Key Points:**
- RSS fetching: 5-10 seconds (parallel)
- Deduplication: 2-5 seconds (local computation)
- LLM calls: 30-45 seconds (7 parallel requests)
- Database writes: 1-2 seconds
- **Total: 60-90 seconds** (why serverless won't work)

**Error Handling:**
- If 1-2 RSS sources fail → Continue with others
- If >4 sources fail → Abort, retry in 1 hour
- If LLM fails → Use fallback (first 3 sentences)
- If DB fails → Rollback transaction, log error

---

### Flow 2: Manual Regeneration (Phase 1)

**Trigger:** User clicks "Regenerate" button

```mermaid
sequenceDiagram
    participant USER as User Browser
    participant FE as Next.js Frontend
    participant BE as Express Backend
    participant LLM as OpenAI API
    participant DB as Supabase DB

    USER->>FE: Click [Regenerate] button
    activate FE
    
    Note over FE: setIsGenerating(true)<br/>Show loading spinner
    
    FE->>BE: POST /api/briefings/generate<br/>X-User-Id: <uuid><br/>Body: {date: "2024-11-22"}
    activate BE
    
    Note over BE: Validate X-User-Id<br/>Rate limit check (max 5/hour)
    
    rect rgb(200, 220, 255)
        Note over BE,LLM: SAME FLOW AS CRON<br/>RSS → Dedup → Rank → LLM → DB
        Note over BE: 60-90 seconds
    end
    
    BE-->>FE: 200 OK<br/>{briefing: {...}, stories: [...]}
    deactivate BE
    
    Note over FE: setIsGenerating(false)<br/>setBriefing(data.briefing)<br/>Clear read states
    
    FE-->>USER: Display new briefing<br/>Success toast
    deactivate FE
```

**User Experience:**
- Loading state: 60-90 seconds with spinner
- No streaming in Phase 1 (database-first)
- Phase 5 adds real-time progress updates

---

### Flow 3: Read State Updates (Phase 1)

**Trigger:** User checks/unchecks story checkbox

```mermaid
sequenceDiagram
    participant USER as User Browser
    participant FE as Next.js Frontend
    participant BE as Express Backend
    participant DB as Supabase DB

    USER->>FE: Click checkbox on Story ABC
    activate FE
    
    Note over FE: OPTIMISTIC UPDATE<br/>setReadStates({..., "ABC": true})<br/>Checkbox checked immediately
    
    FE->>BE: PATCH /api/stories/ABC/read<br/>X-User-Id: <uuid><br/>Body: {isRead: true}
    activate BE
    
    Note over BE: Validate user & story
    
    BE->>DB: INSERT INTO read_states<br/>(user_id, story_id, is_read)<br/>ON CONFLICT UPDATE
    activate DB
    DB-->>BE: Success
    deactivate DB
    
    BE-->>FE: 200 OK<br/>{success: true}
    deactivate BE
    
    Note over FE: Success (silent)<br/>No UI change needed
    
    alt Error occurs
        Note over FE: ROLLBACK<br/>setReadStates({..., "ABC": false})<br/>Show error toast
    end
    
    deactivate FE
```

**Optimistic Update Pattern:**
1. Update UI immediately (instant feedback)
2. Send API request in background
3. If success: Do nothing (already updated)
4. If error: Rollback UI change + show error

**Why:** Feels instant, no waiting for round-trip.

---

### Flow 4: Streaming Conversations (Phase 5)

**Trigger:** User sends chat message about a story

```mermaid
sequenceDiagram
    participant USER as User Browser
    participant FE as Next.js Frontend<br/>AI SDK UI
    participant BE as Express Backend
    participant LLMP as LLM Proxy<br/>AI SDK Core
    participant LLM as OpenAI API

    USER->>FE: Type message & send<br/>"Explain the implications"
    activate FE
    
    Note over FE: AI SDK useChat() hook<br/>Manages state automatically
    
    FE->>BE: POST /api/chat<br/>X-User-Id: <uuid><br/>Body: {messages: [...]}
    activate BE
    
    Note over BE: Set SSE headers<br/>Content-Type: text/event-stream<br/>Cache-Control: no-cache
    
    BE->>LLMP: streamChat(messages, callbacks)
    activate LLMP
    
    LLMP->>LLM: Create streaming completion<br/>AI SDK Core
    activate LLM
    
    loop Stream tokens
        LLM-->>LLMP: Token chunk: "The "
        LLMP-->>BE: onChunk({content: "The "})
        BE-->>FE: data: {"content":"The "}\n\n
        Note over FE: Append to UI in real-time
        
        LLM-->>LLMP: Token chunk: "main "
        LLMP-->>BE: onChunk({content: "main "})
        BE-->>FE: data: {"content":"main "}\n\n
        
        LLM-->>LLMP: Token chunk: "implication..."
        LLMP-->>BE: onChunk({content: "implication..."})
        BE-->>FE: data: {"content":"implication..."}\n\n
    end
    
    LLM-->>LLMP: Stream complete
    deactivate LLM
    
    LLMP-->>BE: onComplete()
    deactivate LLMP
    
    BE-->>FE: data: [DONE]\n\n
    deactivate BE
    
    Note over FE: AI SDK handles parsing<br/>Updates messages state<br/>User sees complete response
    
    deactivate FE
```

**Phase 5 Features:**
- Real-time token streaming (AI SDK UI + Core)
- "Thinking" indicators while generating
- Interrupt/cancel support
- Voice input/output (optional)

**Why AI SDK:**
- Unified API for all LLM providers
- Built-in streaming support
- React hooks for UI (useChat, useCompletion)
- Type-safe, well-maintained

---

## Technology Stack

### Frontend Stack (Vercel)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 14+ | React framework with App Router |
| **Language** | TypeScript | 5+ | Type safety |
| **UI Library** | React | 18+ | Component-based UI |
| **AI Integration** | AI SDK UI | Latest | Chat hooks (useChat) |
| **HTTP Client** | Fetch API | Native | API calls to backend |
| **State Management** | React Hooks | Native | Local state (useState) |
| **Styling** | Tailwind CSS | 3+ | Utility-first CSS |
| **Deployment** | Vercel | - | Hosting (free tier) |

**Dependencies:**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "ai": "^latest",
    "tailwindcss": "^3.0.0"
  }
}
```

---

### Backend Stack (Railway)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 20+ | JavaScript runtime |
| **Language** | TypeScript | 5+ | Type safety |
| **Framework** | Express.js | 4+ | HTTP server |
| **AI Integration** | AI SDK Core | Latest | LLM abstraction |
| **Database Client** | pg (node-postgres) | 8+ | PostgreSQL driver |
| **RSS Parsing** | rss-parser | Latest | RSS feed parsing |
| **Logging** | Winston/Pino | Latest | Structured logging |
| **Environment** | dotenv | Latest | Config management |
| **Deployment** | Railway | - | Hosting ($5/mo) |

**Dependencies:**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "ai": "^latest",
    "pg": "^8.11.0",
    "rss-parser": "^3.13.0",
    "dotenv": "^16.0.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "@types/express": "^4.17.0",
    "@types/pg": "^8.10.0"
  }
}
```

---

### Database Stack (Supabase)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Database** | PostgreSQL | 15+ | Primary data store |
| **Hosting** | Supabase | - | Managed Postgres (free tier) |
| **Connection Pooling** | PgBouncer | Built-in | Connection management |
| **SSL** | Required | - | Secure connections |
| **Migrations** | Manual SQL | - | Schema versioning |

**Storage:**
- Free tier: 500 MB (sufficient for project)
- Estimated usage: ~2-7 MB/month
- Retention: 30 days of briefings

---

### External Services

| Service | Provider | Cost | Purpose |
|---------|----------|------|---------|
| **LLM API** | OpenAI | $30-50/mo | GPT-4o-mini for summarization |
| **RSS Feeds** | Various | Free | AI news sources (7 feeds) |
| **Cron Scheduling** | Railway | Included | Daily briefing generation |

**RSS Sources:**
1. OpenAI Blog: `https://openai.com/blog/rss.xml`
2. Anthropic Blog: `https://www.anthropic.com/news/rss.xml`
3. Import AI: `https://jack-clark.net/feed/`
4. The Batch: `https://www.deeplearning.ai/the-batch/feed/`
5. ArXiv AI: `https://arxiv.org/rss/cs.AI`
6. The Verge AI: `https://www.theverge.com/ai-artificial-intelligence/rss/index.xml`
7. Hacker News: `https://news.ycombinator.com/rss`

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Vercel (Frontend)"
            PROD_FE[Next.js App<br/>Auto-deploy from main<br/>Edge Network<br/>Free Tier]
        end
        
        subgraph "Railway (Backend)"
            PROD_BE[Express Server<br/>Auto-deploy from main<br/>US Region<br/>$5/month]
            PROD_CRON[Railway Cron<br/>Daily 8AM trigger<br/>Included]
        end
        
        subgraph "Supabase (Database)"
            PROD_DB[(PostgreSQL DB<br/>US East 1<br/>Free Tier<br/>500MB storage)]
        end
        
        subgraph "External"
            PROD_LLM[OpenAI API<br/>GPT-4o-mini<br/>Pay-as-you-go]
        end
    end
    
    subgraph "Development Environment"
        DEV_FE[Next.js<br/>localhost:3000]
        DEV_BE[Express<br/>localhost:3001]
        DEV_DB[(Supabase Dev<br/>Same instance<br/>Separate schema)]
        DEV_LLM[OpenAI API<br/>Same key<br/>Lower usage]
    end
    
    subgraph "CI/CD"
        GH[GitHub Repository<br/>Main branch]
        GH_ACTIONS[GitHub Actions<br/>Optional CI]
    end
    
    GH -->|Auto-deploy| PROD_FE
    GH -->|Auto-deploy| PROD_BE
    
    PROD_FE <-->|HTTPS| PROD_BE
    PROD_BE <--> PROD_DB
    PROD_BE <--> PROD_LLM
    PROD_CRON -.->|Trigger| PROD_BE
    
    DEV_FE <-->|HTTPS| DEV_BE
    DEV_BE <--> DEV_DB
    DEV_BE <--> DEV_LLM

    style PROD_FE fill:#ff99cc
    style PROD_BE fill:#ffcc99
    style PROD_DB fill:#ffff99
    style PROD_LLM fill:#99ccff
    style DEV_FE fill:#ffccff
    style DEV_BE fill:#ffe6cc
```

**Deployment Workflow:**

1. **Development:**
   - Work locally with dev environment
   - Frontend: `npm run dev` (localhost:3000)
   - Backend: `npm run dev` (localhost:3001)
   - Database: Supabase dev instance

2. **Commit & Push:**
   - Push to GitHub main branch
   - Auto-triggers deployments

3. **Production Deploy:**
   - Vercel auto-deploys frontend (~2 min)
   - Railway auto-deploys backend (~3 min)
   - Run migrations manually: `railway run npm run migrate:prod`

4. **Monitoring:**
   - Vercel analytics (free tier)
   - Railway logs (built-in)
   - Custom logging (Winston)

---

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ BRIEFINGS : creates
    USERS ||--o{ READ_STATES : has
    BRIEFINGS ||--|{ STORIES : contains
    STORIES ||--o{ READ_STATES : tracks

    USERS {
        uuid id PK
        text email
        timestamp created_at
    }

    BRIEFINGS {
        uuid id PK
        uuid user_id FK
        date date
        timestamp generated_at
        jsonb metadata
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }

    STORIES {
        uuid id PK
        uuid briefing_id FK
        text title
        text_array summary
        text source_url
        text source_name
        timestamp published_at
        text cover_image_url
        integer display_order
        text category
        integer importance
        timestamp created_at
        timestamp updated_at
    }

    READ_STATES {
        uuid user_id FK
        uuid story_id FK
        boolean is_read
        timestamp marked_at
    }
```

**Schema Notes:**

1. **Users Table:**
   - Minimal for Phase 1 (just UUID)
   - Email added when authentication introduced
   - Single hardcoded user for initial phases

2. **Briefings Table:**
   - One per day per user
   - `deleted_at` for soft-delete (regeneration)
   - `metadata` stores generation stats (JSONB)

3. **Stories Table:**
   - Normalized (not JSON in briefings)
   - `summary` is TEXT[] (Postgres array)
   - `display_order` for consistent rendering
   - `category` and `importance` added in Phase 2

4. **Read States Table:**
   - Composite primary key (user_id, story_id)
   - Upsert pattern for updates
   - Separate table for query performance

**Indexes:**
```sql
-- Briefings
CREATE INDEX idx_briefings_user_date ON briefings(user_id, date);
CREATE INDEX idx_briefings_deleted ON briefings(deleted_at) WHERE deleted_at IS NULL;

-- Stories
CREATE INDEX idx_stories_briefing ON stories(briefing_id);
CREATE INDEX idx_stories_published_at ON stories(published_at);

-- Read States
CREATE INDEX idx_read_states_user ON read_states(user_id);
```

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# LLM Provider
OPENAI_API_KEY=sk-proj-...
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://ai-briefing.vercel.app

# Security
CRON_SECRET=<generate-secure-random-string>

# Logging
LOG_LEVEL=info
```

### Frontend (.env.local)

```bash
# Backend API
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## Phase-by-Phase Architecture Evolution

### Phase 1-4: Database-First
- Briefings pre-generated and stored
- Frontend fetches from database
- No real-time streaming
- Manual regeneration waits for completion

### Phase 5: Real-Time Streaming
- Add SSE/WebSocket support
- Stream LLM responses token-by-token
- Progressive UI updates
- AI SDK UI hooks (useChat)
- Backend adds streaming endpoints

### Phase 6: Hardening
- Add metrics and monitoring
- Implement comprehensive logging
- Error tracking (optional: Sentry)
- Performance optimization
- Documentation polish

---

## Cost Breakdown

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Frontend (Vercel) | $0 | Free tier sufficient |
| Backend (Railway) | $5 | Hobby plan |
| Database (Supabase) | $0 | Free tier (500MB) |
| LLM (OpenAI) | $30-50 | ~1 briefing/day + testing |
| Domain (optional) | $1 | If custom domain desired |
| **Total** | **$35-55** | Under $60 budget cap |

**Usage Estimates:**
- Daily briefing: 7 stories × 500 tokens = 3,500 tokens
- Cost per briefing: ~$0.01-0.02
- Monthly briefings: 30 × $0.02 = $0.60
- Development/testing: ~$30-50/month
- **Total LLM cost: $30-50/month**

---

## Security Considerations

1. **API Keys:**
   - Never exposed to frontend
   - Stored in environment variables
   - Railway secrets management

2. **Authentication:**
   - Phase 1: Client-side UUID (localStorage)
   - Phase 7+: Proper auth (Clerk/Auth.js)
   - X-User-Id header validation

3. **Rate Limiting:**
   - Phase 2: Add rate limiting middleware
   - Prevent abuse of regeneration endpoint
   - Max 5 regenerations per hour

4. **CORS:**
   - Backend allows frontend domain only
   - Configured in Express middleware

5. **Database:**
   - SSL required (Supabase enforces)
   - Connection pooling
   - Prepared statements (SQL injection prevention)

6. **Cron Endpoint:**
   - Protected by secret token
   - Only Railway cron can trigger
   - Validate Authorization header

---

## Monitoring & Observability

### Logging Strategy

**Backend Logs (Winston/Pino):**
```json
{
  "level": "info",
  "timestamp": "2024-11-22T08:00:00Z",
  "event": "briefing_generated",
  "briefingId": "uuid",
  "storiesCount": 7,
  "generationTimeMs": 72000,
  "llmCost": 0.015,
  "tokensUsed": 10000
}
```

**What to Log:**
- All LLM calls (tokens, cost, latency)
- Briefing generation events
- Error occurrences
- API request/response times
- Database query times

### Metrics to Track

**Phase 1-2:**
- Briefings generated per day
- Average generation time
- LLM tokens used
- LLM cost per briefing
- Stories per briefing
- Read state engagement

**Phase 3+:**
- Error rates
- API latency percentiles
- Database query performance
- RSS fetch success rates
- User engagement metrics

### Health Check

```typescript
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2024-11-22T14:30:00Z",
  "database": "connected",
  "uptime": 86400,
  "version": "0.1.0"
}
```

Railway pings this endpoint to ensure service health.

---

## Next Steps (Post-Phase 0)

**Immediate (Phase 1):**
1. Set up Next.js project
2. Set up Express project
3. Implement RSS fetching
4. Implement LLM summarization (AI SDK Core)
5. Build basic UI
6. Deploy to production

**After Phase 1 Validation (Use app 3 days straight):**
- Phase 2: Add agentic reasoning
- Phase 3: Implement evals
- Phase 4: MCP + Generative UI
- Phase 5: Streaming
- Phase 6: Hardening

---

## Conclusion

This architecture provides:
- ✅ Clean separation of concerns
- ✅ No serverless timeout constraints
- ✅ Cost-effective ($35-55/month)
- ✅ Scalable to all 6 phases
- ✅ Professional structure
- ✅ Easy to maintain and extend

**Ready for implementation in Phase 1.**

---

**Document Version:** 0.1  
**Last Updated:** November 22, 2024  
**Status:** Locked for Phase 1 implementation