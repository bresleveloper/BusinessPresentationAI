const storage = require('./storage.js');
const { chat } = require('./ai.js');
const { interviewerPrompt } = require('./agents/interviewer.js');
const { agent80sPrompt } = require('./agents/agent80s.js');
const { agent2000sPrompt } = require('./agents/agent2000s.js');
const { agent2020sPrompt } = require('./agents/agent2020s.js');
const { verifyToken, getUserCredits, deductCredit, initializeUserCredits } = require('./supabase.js');

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('JSON לא תקין'));
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJSON(res, { error: message }, status);
}

// Auth middleware helper - verifies JWT and returns user
async function authenticate(req, res) {
  const authHeader = req.headers.authorization;
  const user = await verifyToken(authHeader);

  if (!user) {
    sendError(res, 401, 'לא מחובר - יש להתחבר כדי להשתמש בשירות');
    return null;
  }

  return user;
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // GET /api/user/credits - Get user's credit balance
    if (method === 'GET' && path === '/api/user/credits') {
      const user = await authenticate(req, res);
      if (!user) return;

      const credits = await getUserCredits(user.id);
      return sendJSON(res, { credits });
    }

    // POST /api/user/init-credits - Initialize credits for new user
    if (method === 'POST' && path === '/api/user/init-credits') {
      const user = await authenticate(req, res);
      if (!user) return;

      await initializeUserCredits(user.id);
      const credits = await getUserCredits(user.id);
      return sendJSON(res, { credits });
    }

    // POST /api/session - Create new session
    if (method === 'POST' && path === '/api/session') {
      const session = {
        id: generateUUID(),
        createdAt: new Date().toISOString()
      };
      storage.append('sessions.json', session);
      return sendJSON(res, { sessionId: session.id });
    }

    // POST /api/business-info - Submit business description
    if (method === 'POST' && path === '/api/business-info') {
      const body = await parseBody(req);
      const { sessionId, profession, description } = body;

      if (!sessionId || !profession || !description) {
        return sendError(res, 400, 'חסרים שדות נדרשים');
      }

      const profile = {
        sessionId,
        profession,
        description,
        uniqueQualities: '',
        createdAt: new Date().toISOString()
      };
      storage.append('profiles.json', profile);
      return sendJSON(res, { success: true });
    }

    // POST /api/interview - Start interview, get first question
    if (method === 'POST' && path === '/api/interview') {
      const body = await parseBody(req);
      const { sessionId } = body;

      if (!sessionId) {
        return sendError(res, 400, 'חסר מזהה סשן');
      }

      const profile = storage.findOne('profiles.json', p => p.sessionId === sessionId);
      if (!profile) {
        return sendError(res, 404, 'פרופיל לא נמצא');
      }

      const userMessage = `My profession: ${profile.profession}\n\nWhat I do: ${profile.description}`;
      const messages = [{ role: 'user', content: userMessage }];

      const aiResponse = await chat(interviewerPrompt, messages);

      const conversation = {
        sessionId,
        messages: [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: aiResponse }
        ]
      };
      storage.append('conversations.json', conversation);

      return sendJSON(res, { message: aiResponse });
    }

    // POST /api/respond - Submit answer to interview question
    if (method === 'POST' && path === '/api/respond') {
      const body = await parseBody(req);
      const { sessionId, message } = body;

      if (!sessionId || !message) {
        return sendError(res, 400, 'חסרים שדות נדרשים');
      }

      const conversation = storage.findOne('conversations.json', c => c.sessionId === sessionId);
      if (!conversation) {
        return sendError(res, 404, 'שיחה לא נמצאה');
      }

      conversation.messages.push({ role: 'user', content: message });

      const profile = storage.findOne('profiles.json', p => p.sessionId === sessionId);
      const aiResponse = await chat(interviewerPrompt, conversation.messages);

      conversation.messages.push({ role: 'assistant', content: aiResponse });

      storage.update('conversations.json',
        c => c.sessionId === sessionId,
        { messages: conversation.messages }
      );

      const isComplete = aiResponse.toLowerCase().includes('enough information') ||
                         aiResponse.toLowerCase().includes('generate your presentations') ||
                         aiResponse.includes('מספיק מידע') ||
                         aiResponse.includes('יצירת המצגות') ||
                         conversation.messages.filter(m => m.role === 'user').length >= 4;

      return sendJSON(res, { message: aiResponse, complete: isComplete });
    }

    // POST /api/generate - Generate all 3 presentations
    if (method === 'POST' && path === '/api/generate') {
      // Require authentication
      const user = await authenticate(req, res);
      if (!user) return;

      // Check credits before generation
      const credits = await getUserCredits(user.id);
      if (credits < 1) {
        return sendError(res, 402, 'אין לך מספיק קרדיטים. יש לרכוש קרדיטים נוספים.');
      }

      const body = await parseBody(req);
      const { sessionId } = body;

      if (!sessionId) {
        return sendError(res, 400, 'חסר מזהה סשן');
      }

      const profile = storage.findOne('profiles.json', p => p.sessionId === sessionId);
      const conversation = storage.findOne('conversations.json', c => c.sessionId === sessionId);

      if (!profile) {
        return sendError(res, 404, 'פרופיל לא נמצא');
      }

      // Build context from profile and conversation
      let context = `Business: ${profile.profession}\n\nDescription: ${profile.description}`;
      if (conversation && conversation.messages) {
        context += '\n\nInterview insights:\n';
        conversation.messages.forEach(msg => {
          context += `${msg.role === 'user' ? 'Owner' : 'Interviewer'}: ${msg.content}\n\n`;
        });
      }

      const contextMessage = [{ role: 'user', content: context }];

      // Generate all 3 presentations in parallel
      const [pres80s, pres2000s, pres2020s] = await Promise.all([
        chat(agent80sPrompt, contextMessage),
        chat(agent2000sPrompt, contextMessage),
        chat(agent2020sPrompt, contextMessage)
      ]);

      // Deduct credit after successful generation
      const deductResult = await deductCredit(user.id);
      if (!deductResult.success) {
        return sendError(res, 500, 'שגיאה בניכוי קרדיט');
      }

      const presentations = [
        { sessionId, era: '80s', content: pres80s, createdAt: new Date().toISOString() },
        { sessionId, era: '2000s', content: pres2000s, createdAt: new Date().toISOString() },
        { sessionId, era: '2020s', content: pres2020s, createdAt: new Date().toISOString() }
      ];

      presentations.forEach(p => storage.append('presentations.json', p));

      return sendJSON(res, {
        presentations,
        remainingCredits: deductResult.remainingCredits
      });
    }

    // GET /api/presentations/:sessionId - Get presentations
    if (method === 'GET' && path.startsWith('/api/presentations/')) {
      const sessionId = path.split('/').pop();
      const presentations = storage.findAll('presentations.json', p => p.sessionId === sessionId);
      return sendJSON(res, { presentations });
    }

    return null; // Not an API route
  } catch (err) {
    console.error('API Error:', err);
    return sendError(res, 500, err.message || 'שגיאת שרת פנימית');
  }
}

module.exports = { handleRequest };
