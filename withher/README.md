# with/her — Mentorship & Community Platform for Female Soccer Players

**with/her** is a cross-platform mobile app (iOS + Android) connecting female soccer athletes across all career stages through AI-powered mentorship matching, structured 30-day coaching programs, real-time messaging, community forums, and events.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Services](#running-the-services)
- [API Reference](#api-reference)
- [Architecture Decisions](#architecture-decisions)
- [Safety & Trust Architecture](#safety--trust-architecture)

---

## Overview

| Feature | Description |
|---|---|
| **Matching** | AI-powered mentor/mentee matching across 5 career levels |
| **30-Day Programs** | Structured mentorship cycles with sessions, notes, and reflections |
| **Messaging** | Real-time Firebase chat between matched pairs |
| **Community** | Forum, events, and curated resource library |
| **Safety** | Background checks, parental consent for under-18, content moderation |
| **Gamification** | Badges, streaks, and leaderboards |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo) + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Real-time Messaging | Firebase Realtime Database |
| Auth | Firebase Auth (email + Google + Apple) |
| File Storage | Firebase Storage |
| AI Matching | Python FastAPI microservice + sentence-transformers |
| Push Notifications | Expo Push Notifications |
| State Management | Redux Toolkit |
| Job Queue | Bull + Redis |
| Background Checks | Checkr API (stub) |

---

## Project Structure

```
withher/
├── app/                    # React Native (Expo) frontend
│   ├── src/
│   │   ├── screens/        # All app screens
│   │   ├── components/     # Reusable UI components
│   │   ├── navigation/     # React Navigation setup
│   │   ├── store/          # Redux Toolkit slices
│   │   ├── services/       # API, Firebase, auth integrations
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Helper functions
│   │   ├── constants/      # Theme, colors, fonts
│   │   └── types/          # TypeScript interfaces
│   ├── assets/
│   ├── app.json
│   └── package.json
│
├── server/                 # Node.js Express backend
│   ├── src/
│   │   ├── routes/         # Route definitions
│   │   ├── controllers/    # Business logic handlers
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── services/       # Business services
│   │   └── utils/          # Logger, error helpers
│   ├── prisma/
│   │   └── schema.prisma   # Full DB schema
│   └── package.json
│
├── matching-service/       # Python FastAPI matching microservice
│   ├── main.py
│   ├── routers/
│   ├── models/
│   ├── ml/                 # Matching algorithm
│   └── requirements.txt
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 20.x
- Python >= 3.11
- PostgreSQL >= 15 (with pgvector extension)
- Redis >= 7
- Expo CLI (`npm install -g expo-cli`)
- Firebase project (with Auth, Realtime Database, Storage enabled)

### 1. Clone and install dependencies

```bash
# Server dependencies
cd server && npm install

# App dependencies
cd ../app && npm install

# Python matching service
cd ../matching-service && pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp app/.env.example app/.env
cp matching-service/.env.example matching-service/.env
```

Fill in all values — see [Environment Variables](#environment-variables) below.

### 3. Database setup

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed   # optional seed data
```

### 4. Enable pgvector

```sql
-- Run in your PostgreSQL database:
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Environment Variables

### server/.env

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `REDIS_URL` | Redis connection URL |
| `CHECKR_API_KEY` | Checkr background check API key |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_PORT` | Email SMTP port |
| `SMTP_USER` | Email SMTP username |
| `SMTP_PASSWORD` | Email SMTP password |
| `JWT_SECRET` | JWT signing secret (fallback) |
| `MATCHING_SERVICE_URL` | URL of Python matching service |
| `PORT` | Server port (default: 4000) |
| `NODE_ENV` | development / production |
| `CORS_ORIGIN` | Allowed CORS origins |

### app/.env

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

---

## Running the Services

```bash
# Backend (development)
cd server && npm run dev

# React Native app
cd app && npx expo start

# Python matching service
cd matching-service && uvicorn main:app --reload --port 8000
```

---

## Public Deployment

Use this flow to make login/profile/matches work across different computers and networks.

### 1. Deploy the API (Render)

1. Push the repository to GitHub.
2. In Render, create a **Web Service** from `withher/server`.
3. Configure:
	- Build command: `npm install && npm run build`
	- Start command: `npm run start`
4. Add environment variables from `server/.env.example`:
	- Required: `DATABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `JWT_SECRET`, `NODE_ENV=production`, `ALLOWED_ORIGINS`
	- Optional for full feature set: `REDIS_URL`, `MATCHING_SERVICE_URL`, SMTP + Checkr keys
5. Ensure your managed Postgres is reachable by `DATABASE_URL`.
6. Run migrations on production DB:
	- `npx prisma migrate deploy`
	- `npx prisma generate`
7. Verify health endpoint:
	- `https://<your-api-domain>/health`

### 2. Deploy the web app (Netlify or Vercel)

1. In `withher/app`, set production env values:
	- `EXPO_PUBLIC_API_URL=https://<your-api-domain>/api`
	- Firebase `EXPO_PUBLIC_FIREBASE_*` values (same project you already use)
2. Build static web output:

```bash
cd withher/app
npm run web:export
```

3. Deploy `withher/app/dist`:
	- Netlify: drag-drop `dist` or connect repo with publish dir `withher/app/dist`
	- Vercel: framework preset `Other`, output directory `withher/app/dist`

### 3. Wire CORS correctly

Set `ALLOWED_ORIGINS` in your deployed API to include your web domain(s), comma-separated.

Example:

```env
ALLOWED_ORIGINS=https://withher-app.netlify.app,https://www.withher.app
```

### 4. Mobile note (Expo Go)

If you also run native clients, keep `EXPO_PUBLIC_API_URL` pointed at your public API domain (not localhost), then rebuild/restart Expo.

---

## API Reference

All API routes are prefixed with `/api`. Protected routes require a valid Firebase JWT in the `Authorization: Bearer <token>` header.

| Domain | Routes |
|---|---|
| Auth | `/api/auth/*` |
| Users | `/api/users/*` |
| Matching | `/api/matches/*` |
| Messaging | `/api/messages/*`, `/api/conversations` |
| Programs & Sessions | `/api/programs/*`, `/api/sessions/*` |
| Community | `/api/forum/*` |
| Events | `/api/events/*` |
| Resources | `/api/resources/*` |
| Safety | `/api/verification/*`, `/api/users/:id/report`, `/api/users/:id/block` |
| Gamification | `/api/badges/*`, `/api/leaderboards/*` |
| Notifications | `/api/notifications/*` |

---

## Architecture Decisions

- **Firebase Auth** handles token issuance; the backend verifies tokens via the Firebase Admin SDK on every protected request.
- **Prisma** with strict TypeScript types eliminates runtime type errors on DB queries.
- **Bull + Redis** queues session reminders, digest emails, and daily match refreshes outside the request cycle.
- **FastAPI matching service** runs as an independent microservice so the matching algorithm can be iterated separately without impacting the main API.
- **pgvector** stores sentence-transformer embeddings for mentorship goals, enabling fast cosine similarity search at match time.

---

## Safety & Trust Architecture

- All messages are scanned by `SafetyService` before delivery — phone numbers, emails, and external URLs are blocked.
- Users under 18 require **parental consent** before any mentor match becomes active.
- Mentors must complete a **background check** (via Checkr) before matching activates.
- Accounts are **auto-suspended** after 3 reports or any CRITICAL severity report.
- A moderation queue collects all flagged content for admin review.

---

## License

Private — All rights reserved © with/her
