# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in [AI Studio](https://ai.studio/apps/fc1ff2b1-abb1-43c4-9a66-06dd3925546e).

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy [.env.example](.env.example) to `.env.local` and set the `GEMINI_API_KEY` to your Gemini API key:

   ```bash
   cp .env.example .env.local
   ```

3. Run the app:

   ```bash
   npm run dev
   ```
