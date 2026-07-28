# SpeakFlow English Tutor — Frontend

React + Vite frontend for the SpeakFlow English speaking tutor.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the deployed backend API URL, including `/api`.

```env
VITE_API_URL=https://your-backend-domain.com/api
```

## Deployment

Deploy this repository directly to Vercel using the Vite preset.

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repository root
