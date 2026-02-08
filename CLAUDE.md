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
- `server/supabase.js` - Supabase client for auth, sessions, credits, and ratings

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
2. Session created with UUID → stored in Supabase `user_sessions` table
3. User enters business info → stored as JSONB in `user_sessions.business_profile`
4. Interview: AI asks questions → conversation stored as JSONB in `user_sessions.conversation`
5. Generation: All 3 agents run in parallel → results stored as JSONB in `user_sessions.presentations`
6. Credit deducted after successful generation

## API Endpoints

All endpoints require authentication (Bearer token).

- `POST /api/session` - Create session
- `POST /api/business-info` - Submit business description
- `POST /api/interview` - Start interview
- `POST /api/respond` - Submit answer, get next question
- `POST /api/generate` - Generate presentations (costs 1 credit)
- `GET /api/presentations/:sessionId` - Get generated presentations (supports `?format=pdf&style=`)
- `POST /api/presentations/:sessionId/rate` - Rate a presentation
- `GET /api/user/credits` - Get credit balance
- `POST /api/user/init-credits` - Initialize credits for new user
- `GET /api/user/sessions` - Get user's past sessions
- `POST /api/session/load` - Load a previous session

## Environment Variables

Required in `.env`:
```
OPENROUTER_API_KEY=<key>
SUPABASE_URL=<project-url>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
```

## Database (Supabase)

- `user_sessions` - Session data with business_profile, conversation, presentations (JSONB)
- `user_credits` - User credit balances (3 free on signup)
- `credit_transactions` - Audit log of credit changes
- `presentation_ratings` - User ratings and feedback per presentation style
- Schemas in `supabase-schema.sql`, `supabase-sessions-schema.sql`, `supabase-ratings-schema.sql`
