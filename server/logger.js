const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../rag/serverErr.txt');

// Ensure rag directory exists
const ragDir = path.dirname(LOG_FILE);
if (!fs.existsSync(ragDir)) {
  fs.mkdirSync(ragDir, { recursive: true });
}

function logError(context, error) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';

  const logEntry = `
[${timestamp}] ${context}
Error: ${errorMessage}
${errorStack ? 'Stack: ' + errorStack : ''}
${'='.repeat(80)}
`;

  // Write to file
  try {
    fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
  } catch (writeErr) {
    console.error('Failed to write to log file:', writeErr);
  }

  // Also log to console
  console.error(`[ERROR] ${context}:`, error);
}

function logInfo(context, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [INFO] ${context}: ${message}\n`;

  try {
    fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
  } catch (writeErr) {
    console.error('Failed to write to log file:', writeErr);
  }

  console.log(`[INFO] ${context}: ${message}`);
}

function clearLog() {
  try {
    fs.writeFileSync(LOG_FILE, '', 'utf8');
    console.log('Log file cleared');
  } catch (err) {
    console.error('Failed to clear log file:', err);
  }
}

module.exports = { logError, logInfo, clearLog };
