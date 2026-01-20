// State
let sessionId = null;
let interviewComplete = false;

// DOM Elements
const businessForm = document.getElementById('business-form');
const interviewSection = document.getElementById('interview');
const loadingSection = document.getElementById('loading');
const resultsSection = document.getElementById('results');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const generateBtn = document.getElementById('generate-btn');

// API Helper
async function api(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
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
    alert('Please fill in both fields');
    return;
  }

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
    alert('Error: ' + err.message);
    console.error(err);
  }
}

// Send answer during interview
async function sendAnswer() {
  const message = userInput.value.trim();
  if (!message) return;

  displayMessage('user', message);
  userInput.value = '';
  userInput.disabled = true;
  document.getElementById('send-answer').disabled = true;

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
    alert('Error: ' + err.message);
    console.error(err);
  } finally {
    userInput.disabled = false;
    document.getElementById('send-answer').disabled = false;
    userInput.focus();
  }
}

// Generate all presentations
async function generatePresentations() {
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

  } catch (err) {
    alert('Error generating presentations: ' + err.message);
    console.error(err);
    showSection(interviewSection);
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

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendAnswer();
  }
});
