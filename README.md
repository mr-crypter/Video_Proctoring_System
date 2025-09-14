# Video Proctoring

Monorepo with Node.js/Express backend and React frontend.

## Structure

```
video-proctoring/
├── backend/
│   ├── controllers/
│   │   └── candidateController.js
│   ├── models/
│   │   └── Candidate.js
│   ├── routes/
│   │   └── candidateRoutes.js
│   ├── utils/
│   │   └── calculateScore.js
│   ├── config/
│   │   └── db.js
│   ├── app.js
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── models/
│   └── src/
│       ├── components/
│       │   └── InterviewScreen.jsx
│       ├── services/
│       │   └── api.js
│       ├── utils/
│       │   ├── focusDetection.js
│       │   └── objectDetection.js
│       ├── App.jsx
│       └── index.js
│
├── scripts/
│   └── seedCandidates.js
│
├── env.example
└── package.json
```

## Setup

1. Copy env.example to .env (or set envs in your shell).
2. Install deps:

```
npm run install:all
```

3. Start both apps:

```
npm run dev
```

4. Seed a candidate (optional):

```
npm run seed
```

## Notes
- Frontend expects models in `frontend/public/models`. Place Face API models there if hosting locally.
- Configure `REACT_APP_API_URL` via `.env.local` in frontend or root envs.
