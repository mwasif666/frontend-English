# SpeakFlow English Tutor — Frontend

React + Vite frontend for the SpeakFlow English-speaking tutor.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the deployed backend URL, including `/api`:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

Run tests and a production build:

```bash
npm run ci
```

## Runtime behavior

- Learners can type or speak English, Roman Urdu, Urdu script or mixed input.
- The composer requests a writing correction while the learner types.
- Tutor replies show corrected English, simple Roman Urdu, Urdu script, useful vocabulary and a related follow-up question.
- Signed-in users can use realtime WebSocket updates when available.
- If realtime is unavailable, the app automatically retries over normal HTTPS.
- Guest lessons work without an account, while saved history, progress and dictionary projects require the backend database/account service.

## Browser limitations

- Speech recognition support and accuracy vary by browser and device.
- Voice selection uses voices installed by the operating system/browser.
- The frontend cannot save account data when MongoDB or JWT configuration is unavailable, but guest tutor replies can still work.
- AI and translation endpoints may temporarily return a rate-limit message after unusually high use.

## Deployment

Deploy this repository directly to Vercel using the Vite preset:

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repository root

GitHub Actions runs tests and the production build on every push and pull request, then checks the live Vercel page after a push to `main`.
