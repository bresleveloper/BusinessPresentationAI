const https = require('https');

const API_KEY = 'sk-or-v1-getYourKey';
const MODEL = 'x-ai/grok-4.1-fast';
const API_HOST = 'openrouter.ai';
const API_PATH = '/api/v1/chat/completions';

function chat(systemPrompt, messages) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });

    const options = {
      hostname: API_HOST,
      port: 443,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(response.error.message || 'API error'));
            return;
          }
          if (response.choices && response.choices[0] && response.choices[0].message) {
            resolve(response.choices[0].message.content);
          } else {
            reject(new Error('Invalid API response format'));
          }
        } catch (err) {
          reject(new Error(`Failed to parse API response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`API request failed: ${err.message}`));
    });

    req.write(requestBody);
    req.end();
  });
}

module.exports = { chat };
