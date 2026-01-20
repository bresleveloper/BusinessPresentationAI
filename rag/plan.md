# BizPrez Implementation Plan

## Overview
Build a vanilla Node.js application that collects business information and generates three AI-powered presentations representing 80s, 2000s, and 2020s business approaches.

## Environment
- **Node.js**: v22.21.1
- **Storage**: File-based JSON (zero dependencies)
- **AI Provider**: OpenRouter with `x-ai/grok-4.1-fast` model
- **Constraints**: No external libraries - pure vanilla implementation

## Project Structure
```
bizPrez/
├── rag/
│   ├── req.md
│   └── plan.md
├── data/
│   └── .gitkeep
├── server/
│   ├── index.js
│   ├── router.js
│   ├── storage.js
│   ├── ai.js
│   └── agents/
│       ├── interviewer.js
│       ├── agent80s.js
│       ├── agent2000s.js
│       └── agent2020s.js
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## Independent Implementation Steps

Each step below can be implemented independently. Complete all steps, then test the full application.

---

### Step 1: Create Directory Structure

Create the following directories:
- `data/`
- `server/`
- `server/agents/`
- `public/`

Create empty file `data/.gitkeep` to preserve the data directory in git.

---

### Step 2: Storage Layer (`server/storage.js`)

Create a module that handles JSON file storage using native `fs` module.

**Requirements:**
- Export functions: `read(filename)`, `write(filename, data)`, `append(filename, item)`
- Store files in `data/` directory
- Handle file-not-found by returning empty array/object
- Use `JSON.parse` and `JSON.stringify` for serialization

**Data files to support:**
- `sessions.json` - Array of session objects
- `profiles.json` - Array of business profiles
- `conversations.json` - Array of conversation threads
- `presentations.json` - Array of generated presentations

**Data structures:**
```javascript
// Session: { id: "uuid", createdAt: "ISO date" }
// Profile: { sessionId: "uuid", profession: "string", description: "string", uniqueQualities: "string" }
// Conversation: { sessionId: "uuid", messages: [{ role: "user|assistant", content: "string" }] }
// Presentation: { sessionId: "uuid", era: "80s|2000s|2020s", content: "string", createdAt: "ISO date" }
```

---

### Step 3: AI Integration (`server/ai.js`)

Create a module for OpenRouter API communication using native `https` module.

**Configuration:**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- API Key: `sk-or-v1-getYourKey`
- Model: `x-ai/grok-4.1-fast`

**Export function:**
```javascript
async function chat(systemPrompt, messages) {
  // messages = [{ role: "user"|"assistant", content: "string" }]
  // Returns: string (assistant's response)
}
```

**Implementation notes:**
- Use `https.request` with POST method
- Set headers: `Content-Type: application/json`, `Authorization: Bearer <key>`
- Request body: `{ model, messages: [{ role: "system", content: systemPrompt }, ...messages] }`
- Parse response and return `choices[0].message.content`

---

### Step 4: Interviewer Agent (`server/agents/interviewer.js`)

Create the AI interviewer that asks probing questions about unique business qualities.

**Export:**
```javascript
const interviewerPrompt = `...system prompt...`;
```

**System prompt requirements:**
- Role: Business consultant gathering information
- Goal: Discover what makes this business unique and valuable
- Behavior: Ask 2-3 focused questions about differentiators
- Style: Professional, curious, encouraging
- Focus areas: Unique skills, special processes, client outcomes, guarantees offered

---

### Step 5: 80s Presentation Agent (`server/agents/agent80s.js`)

Create the 80s-style presentation generator.

**Export:**
```javascript
const agent80sPrompt = `...system prompt...`;
```

**System prompt requirements:**
- Era mindset: 1980s business culture
- Emphasis: Credentials, degrees, certifications, years of experience
- Tone: Formal, authoritative, trust-through-expertise
- Format: Professional presentation text (not slides)
- Include: Education background, professional memberships, industry experience

---

### Step 6: 2000s Presentation Agent (`server/agents/agent2000s.js`)

Create the 2000s-style presentation generator.

**Export:**
```javascript
const agent2000sPrompt = `...system prompt...`;
```

**System prompt requirements:**
- Era mindset: 2000s business culture
- Emphasis: Competitive pricing, reliability, efficiency, value proposition
- Tone: Results-oriented, comparative advantages
- Format: Professional presentation text
- Include: Cost savings, turnaround time, reliability metrics, customer satisfaction

---

### Step 7: 2020s Presentation Agent (`server/agents/agent2020s.js`)

Create the 2020s-style presentation generator.

**Export:**
```javascript
const agent2020sPrompt = `...system prompt...`;
```

**System prompt requirements:**
- Era mindset: 2020s business culture
- Emphasis: End-to-end solutions, guarantees, ownership of outcomes
- Tone: Partnership-focused, outcome-driven
- Format: Professional presentation text
- Include: Full-service approach, risk reversal, guarantees, client success stories
- This is the RECOMMENDED modern approach

---

### Step 8: API Router (`server/router.js`)

Create routing logic for API endpoints.

**Export:**
```javascript
async function handleRequest(req, res) {
  // Route requests to appropriate handlers
}
```

**Routes to implement:**

1. `POST /api/session` - Create new session
   - Generate UUID, store in sessions.json
   - Return: `{ sessionId: "uuid" }`

2. `POST /api/business-info` - Submit business description
   - Body: `{ sessionId, profession, description }`
   - Store in profiles.json
   - Return: `{ success: true }`

3. `POST /api/interview` - Get interviewer questions
   - Body: `{ sessionId }`
   - Load profile, call AI with interviewer prompt
   - Store conversation, return AI response
   - Return: `{ message: "AI question" }`

4. `POST /api/respond` - Submit answer to interview
   - Body: `{ sessionId, message }`
   - Add to conversation, get AI follow-up
   - Return: `{ message: "AI response", complete: boolean }`

5. `POST /api/generate` - Generate all 3 presentations
   - Body: `{ sessionId }`
   - Load profile and conversation
   - Call all 3 era agents in parallel
   - Store presentations
   - Return: `{ presentations: [...] }`

6. `GET /api/presentations/:sessionId` - Get presentations
   - Return stored presentations for session

**Helper functions needed:**
- `parseBody(req)` - Parse JSON request body
- `sendJSON(res, data)` - Send JSON response
- `sendError(res, status, message)` - Send error response
- `generateUUID()` - Generate simple UUID

---

### Step 9: HTTP Server (`server/index.js`)

Create the main HTTP server entry point.

**Requirements:**
- Use native `http` module
- Listen on port 3000
- Serve static files from `public/` directory
- Route `/api/*` requests to router
- Handle MIME types: `.html`, `.css`, `.js`

**Static file serving:**
- Map URL path to file in `public/` directory
- Default `/` to `/index.html`
- Set correct Content-Type headers
- Return 404 for missing files

**Startup message:**
```
Server running at http://localhost:3000
```

---

### Step 10: Frontend HTML (`public/index.html`)

Create the single-page application HTML.

**Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>BizPrez - AI Business Presentation Generator</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>BizPrez</h1>
    <p>AI-Powered Business Presentation Generator</p>
  </header>

  <main>
    <!-- Step 1: Business Info Form -->
    <section id="business-form">
      <h2>Tell us about your business</h2>
      <input type="text" id="profession" placeholder="Your profession (e.g., Electrician)">
      <textarea id="description" placeholder="Describe what you do..."></textarea>
      <button id="start-interview">Start Interview</button>
    </section>

    <!-- Step 2: Interview Chat -->
    <section id="interview" class="hidden">
      <h2>Interview</h2>
      <div id="chat-messages"></div>
      <input type="text" id="user-input" placeholder="Your answer...">
      <button id="send-answer">Send</button>
      <button id="generate-btn" class="hidden">Generate Presentations</button>
    </section>

    <!-- Step 3: Results -->
    <section id="results" class="hidden">
      <h2>Your Presentations</h2>
      <div id="presentations">
        <div class="presentation" id="pres-80s">
          <h3>1980s Approach</h3>
          <div class="content"></div>
        </div>
        <div class="presentation" id="pres-2000s">
          <h3>2000s Approach</h3>
          <div class="content"></div>
        </div>
        <div class="presentation recommended" id="pres-2020s">
          <h3>2020s Approach (Recommended)</h3>
          <div class="content"></div>
        </div>
      </div>
    </section>
  </main>

  <script src="app.js"></script>
</body>
</html>
```

---

### Step 11: Frontend Styles (`public/styles.css`)

Create responsive CSS styling.

**Requirements:**
- Clean, modern design
- Mobile-responsive
- `.hidden` class for hiding sections
- Chat message styling (user vs assistant)
- Three-column layout for presentations on desktop
- Single column on mobile
- `.recommended` class with highlight styling (border, background)
- Loading states

**Key styles:**
- Header with gradient or solid color
- Card-style sections with shadows
- Input and button styling
- Chat bubbles with different colors for user/assistant
- Presentation boxes with distinct headers

---

### Step 12: Frontend JavaScript (`public/app.js`)

Create client-side application logic.

**State:**
```javascript
let sessionId = null;
let interviewComplete = false;
```

**Functions to implement:**

1. `startInterview()` - Called when user submits business info
   - POST to `/api/session` to get sessionId
   - POST to `/api/business-info` with form data
   - POST to `/api/interview` to get first question
   - Show interview section, display AI message

2. `sendAnswer()` - Called when user sends chat message
   - POST to `/api/respond` with user message
   - Display user message in chat
   - Display AI response
   - If `response.complete`, show generate button

3. `generatePresentations()` - Called when user clicks generate
   - POST to `/api/generate`
   - Show loading state
   - Display all 3 presentations in result boxes
   - Show results section

4. `displayMessage(role, content)` - Add message to chat
   - Create div with appropriate class
   - Append to chat container

5. `displayPresentation(era, content)` - Show presentation
   - Find correct presentation div
   - Set inner content

**Event listeners:**
- `#start-interview` click -> `startInterview()`
- `#send-answer` click -> `sendAnswer()`
- `#user-input` enter key -> `sendAnswer()`
- `#generate-btn` click -> `generatePresentations()`

---

## Verification Steps

After implementing all steps:

1. Start the server:
   ```bash
   node server/index.js
   ```

2. Open browser to `http://localhost:3000`

3. Test the flow:
   - Enter profession: "Electrician"
   - Enter description: "I specialize in residential electrical work, focusing on older homes that need rewiring"
   - Click "Start Interview"
   - Answer the AI's questions (2-3 exchanges)
   - Click "Generate Presentations"
   - Verify all 3 presentations appear
   - Confirm 2020s box is highlighted as recommended

4. Check data files in `data/` directory contain saved information

---

## Error Handling Notes

- All API endpoints should return proper error responses
- Frontend should display errors to user
- AI failures should show friendly error message
- File read/write errors should not crash server
