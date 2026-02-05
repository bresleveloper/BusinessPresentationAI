// Supabase Configuration
const SUPABASE_URL = 'https://rbdtdhppsdzlymjpufji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZHRkaHBwc2R6bHltanB1ZmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjAzOTIsImV4cCI6MjA4NTgzNjM5Mn0.DZzkK-2N1vQ9nKmG-nD5FJ8A9juUvgxZzV-Dv5q5V7Y';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let sessionId = null;
let interviewComplete = false;
let currentUser = null;
let accessToken = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const userBar = document.getElementById('user-bar');
const businessForm = document.getElementById('business-form');
const interviewSection = document.getElementById('interview');
const loadingSection = document.getElementById('loading');
const resultsSection = document.getElementById('results');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const generateBtn = document.getElementById('generate-btn');

// API Helper with auth
async function api(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  // Add auth header if logged in
  if (accessToken) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(endpoint, options);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

// Convert username to fake email for Supabase
function usernameToEmail(username) {
  return `${username.toLowerCase()}@bizprez.local`;
}

// Auth Functions
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  if (!username || !password) {
    showAuthError('אנא מלאו שם משתמש וסיסמה');
    return;
  }

  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'מתחבר...';

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: usernameToEmail(username),
      password
    });

    if (error) throw error;

    hideAuthError();
  } catch (err) {
    showAuthError('שם משתמש או סיסמה שגויים');
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = 'התחברו';
  }
}

async function handleSignup() {
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value;
  const btn = document.getElementById('signup-btn');

  if (!username || !password) {
    showAuthError('אנא מלאו שם משתמש וסיסמה');
    return;
  }

  if (password.length < 6) {
    showAuthError('הסיסמה חייבת להכיל לפחות 6 תווים');
    return;
  }

  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'נרשם...';

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: {
        data: { username }
      }
    });

    if (error) throw error;
    hideAuthError();
  } catch (err) {
    showAuthError(err.message);
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = 'הירשמו';
  }
}

async function handleGoogleLogin() {
  const btn = document.getElementById('google-login-btn');
  btn.disabled = true;
  btn.classList.add('loading');

  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
  } catch (err) {
    showAuthError(err.message);
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  accessToken = null;
  updateAuthUI();
}

function showAuthError(message, type = 'error') {
  const errorDiv = document.getElementById('auth-error');
  errorDiv.textContent = message;
  errorDiv.className = `auth-error ${type}`;
  errorDiv.classList.remove('hidden');
}

function hideAuthError() {
  const errorDiv = document.getElementById('auth-error');
  errorDiv.classList.add('hidden');
}

async function fetchCredits() {
  try {
    const data = await api('/api/user/credits');
    document.getElementById('user-credits').textContent = data.credits;
    return data.credits;
  } catch (err) {
    console.error('Error fetching credits:', err);
    return 0;
  }
}

async function initCredits() {
  try {
    const data = await api('/api/user/init-credits', 'POST');
    document.getElementById('user-credits').textContent = data.credits;
    return data.credits;
  } catch (err) {
    console.error('Error initializing credits:', err);
    return 0;
  }
}

function updateAuthUI() {
  if (currentUser) {
    authSection.classList.add('hidden');
    userBar.classList.remove('hidden');
    businessForm.classList.remove('hidden');
    // Display username from metadata or extract from fake email
    const username = currentUser.user_metadata?.username || currentUser.email.split('@')[0];
    document.getElementById('user-email').textContent = username;
  } else {
    authSection.classList.remove('hidden');
    userBar.classList.add('hidden');
    businessForm.classList.add('hidden');
    interviewSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
  }
}

// Auth tab switching
function setupAuthTabs() {
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    hideAuthError();
  });

  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    hideAuthError();
  });
}

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    currentUser = session.user;
    accessToken = session.access_token;
    updateAuthUI();

    // Initialize credits for new users or fetch existing
    if (event === 'SIGNED_IN') {
      await initCredits();
    } else {
      await fetchCredits();
    }
  } else {
    currentUser = null;
    accessToken = null;
    updateAuthUI();
  }
});

// Check initial session on load
async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    currentUser = session.user;
    accessToken = session.access_token;
    updateAuthUI();
    await fetchCredits();
  }
}

// Display a chat message
function displayMessage(role, content) {
  const div = document.createElement('div');
  div.className = `chat-message ${role}`;
  div.textContent = content;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show/hide sections
function showSection(section) {
  businessForm.classList.add('hidden');
  interviewSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  section.classList.remove('hidden');
}

// Start the interview process
async function startInterview() {
  const profession = document.getElementById('profession').value.trim();
  const description = document.getElementById('description').value.trim();

  if (!profession || !description) {
    alert('אנא מלאו את שני השדות');
    return;
  }

  const btn = document.getElementById('start-interview');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'טוען...';

  try {
    // Create session
    const sessionData = await api('/api/session', 'POST');
    sessionId = sessionData.sessionId;

    // Submit business info
    await api('/api/business-info', 'POST', {
      sessionId,
      profession,
      description
    });

    // Start interview
    const interviewData = await api('/api/interview', 'POST', { sessionId });

    // Show interview section
    showSection(interviewSection);
    displayMessage('assistant', interviewData.message);

  } catch (err) {
    alert('שגיאה: ' + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = originalText;
  }
}

// Send answer during interview
async function sendAnswer() {
  const message = userInput.value.trim();
  if (!message) return;

  const btn = document.getElementById('send-answer');
  const originalText = btn.textContent;

  displayMessage('user', message);
  userInput.value = '';
  userInput.disabled = true;
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'שולח...';

  try {
    const response = await api('/api/respond', 'POST', {
      sessionId,
      message
    });

    displayMessage('assistant', response.message);

    if (response.complete) {
      interviewComplete = true;
      generateBtn.classList.remove('hidden');
    }

  } catch (err) {
    alert('שגיאה: ' + err.message);
    console.error(err);
  } finally {
    userInput.disabled = false;
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = originalText;
    userInput.focus();
  }
}

// Generate all presentations
async function generatePresentations() {
  const btn = generateBtn;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'יוצר מצגות...';

  showSection(loadingSection);

  try {
    const response = await api('/api/generate', 'POST', { sessionId });

    // Display presentations
    response.presentations.forEach(pres => {
      const presDiv = document.getElementById(`pres-${pres.era}`);
      if (presDiv) {
        presDiv.querySelector('.content').textContent = pres.content;
      }
    });

    showSection(resultsSection);

    // Update credits display if returned
    if (response.remainingCredits !== undefined) {
      document.getElementById('user-credits').textContent = response.remainingCredits;
    }

  } catch (err) {
    alert('שגיאה ביצירת המצגות: ' + err.message);
    console.error(err);
    showSection(interviewSection);
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = originalText;
  }
}

// Start over
function startOver() {
  sessionId = null;
  interviewComplete = false;
  chatMessages.innerHTML = '';
  generateBtn.classList.add('hidden');
  document.getElementById('profession').value = '';
  document.getElementById('description').value = '';
  showSection(businessForm);
}

// Event Listeners
document.getElementById('start-interview').addEventListener('click', startInterview);
document.getElementById('send-answer').addEventListener('click', sendAnswer);
document.getElementById('generate-btn').addEventListener('click', generatePresentations);
document.getElementById('start-over').addEventListener('click', startOver);

// Auth Event Listeners
document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('signup-btn').addEventListener('click', handleSignup);
document.getElementById('google-login-btn').addEventListener('click', handleGoogleLogin);
document.getElementById('logout-btn').addEventListener('click', handleLogout);

// Login form enter key support
document.getElementById('login-username').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleLogin();
});
document.getElementById('login-password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleLogin();
});
document.getElementById('signup-username').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSignup();
});
document.getElementById('signup-password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSignup();
});

// Setup auth tabs and check session
setupAuthTabs();
checkSession();

// Disclaimer checkbox controls button state and tooltip
const disclaimerCheckbox = document.getElementById('disclaimer-checkbox');
const startInterviewBtn = document.getElementById('start-interview');
const tooltipWrapper = startInterviewBtn.parentElement;

disclaimerCheckbox.addEventListener('change', () => {
  const isChecked = disclaimerCheckbox.checked;
  startInterviewBtn.disabled = !isChecked;
  tooltipWrapper.classList.toggle('show-tooltip', !isChecked);
});

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendAnswer();
  }
});
