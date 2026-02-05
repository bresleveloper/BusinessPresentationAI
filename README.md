# BizPrez - Business Presentation Generator

AI-powered tool that interviews you about your business and generates presentation scripts in three different styles: 80s, 2000s, and 2020s.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your OpenRouter API key:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your API key.

3. Start the server:
   ```bash
   npm start
   ```

4. Open http://localhost:13001 in your browser.

## How It Works

1. Enter your profession and business description
2. Answer the AI interviewer's questions about your business
3. Click "Generate Presentations" to create three presentation scripts
4. Each presentation targets a different era's style and audience expectations

## Tech Stack

- Node.js (vanilla, no frameworks)
- OpenRouter API with Grok model
- Plain HTML/CSS/JavaScript frontend
