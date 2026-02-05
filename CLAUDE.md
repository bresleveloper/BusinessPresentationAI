# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BizPrez is an AI-powered business presentation generator that interviews users about their business and creates three presentation scripts in different styles (80s expertise-focused, 2000s cost/reliability, 2020s results/accountability). The entire application is in Hebrew with RTL support.

## Commands

```bash
npm install    # Install dependencies
npm start      # Start server on http://localhost:13001
```

## Architecture

**Backend (vanilla Node.js, no frameworks):**
- `server/index.js` - HTTP server setup, static file serving with directory traversal protection
- `server/router.js` - API route handlers for auth, interview, and generation endpoints
- `server/ai.js` - OpenRouter API client using Grok model (`x-ai/grok-4.1-fast`)
- `server/storage.js` - File-based JSON storage for sessions, profiles, conversations, presentations
- `server/supabase.js` - Supabase auth verification and credit management

**AI Agents (`server/agents/`):**
- `interviewer.js` - Discovery interview agent (2-3 questions, Hebrew prompts)
- `agent80s.js` - 80s style: expertise, credentials, professional tone
- `agent2000s.js` - 2000s style: low cost, reliability, practical tone
- `agent2020s.js` - 2020s style: results, accountability, outcome-focused

**Frontend (plain HTML/CSS/JS):**
- `public/app.js` - Supabase auth client, form handling, API calls
- `public/index.html` - Main UI (Hebrew, RTL layout)

## Data Flow

1. User authenticates via Supabase (username converted to email internally)
2. Session created with UUID
3. User enters business info → stored in `data/profiles.json`
4. Interview: AI asks questions → conversation stored in `data/conversations.json`
5. Generation: All 3 agents run in parallel → results stored in `data/presentations.json`
6. Credit deducted after successful generation

## API Endpoints

- `POST /api/session` - Create session
- `POST /api/business-info` - Submit business description
- `POST /api/interview` - Start interview
- `POST /api/respond` - Submit answer, get next question
- `POST /api/generate` - Generate presentations (requires auth, costs 1 credit)
- `GET /api/presentations/:sessionId` - Get generated presentations
- `GET /api/user/credits` - Get credit balance
- `POST /api/user/init-credits` - Initialize credits for new user

## Environment Variables

Required in `.env`:
```
OPENROUTER_API_KEY=<key>
SUPABASE_URL=<project-url>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
```

## Database (Supabase)

- `user_credits` - User credit balances (3 free on signup)
- `credit_transactions` - Audit log of credit changes
- Schema in `supabase-schema.sql`
