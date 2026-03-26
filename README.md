# NoiseGuard AI

NoiseGuard AI is a full-stack MERN application with real-time audio threat detection and alerting.

## Tech Stack

- **Client:** React (Vite), Tailwind CSS, socket.io-client
- **Server:** Node.js, Express, MongoDB (Mongoose), Socket.io, Multer, Gemini API

## Features

### User Dashboard

- Start/stop microphone recording using `MediaRecorder`
- Blinking red recording indicator
- Upload recorded audio for AI analysis
- Displays label (`Fire`, `Gunshot`, `Vehicle`, `Unknown`)
- LED safety indicator (green safe / red danger)
- Buzzer sound on danger
- Alert history per user

### Admin Dashboard

- User list panel
- Real-time alert cards via Socket.io (`new-alert`)
- Buzzer + red highlight for dangerous alerts

## API Endpoints

- `POST /api/audio/analyze` - upload and classify audio, persist alert, emit `new-alert`
- `GET /api/admin/users` - list users
- `GET /api/admin/alerts` - list latest alerts
- `GET /api/users` - list users
- `POST /api/users/seed` - seed demo users (idempotent)
- `GET /api/users/:userId/alerts` - user alert history

## Environment Setup

### Server (`server/.env`)

Copy `server/.env.example` to `server/.env` and fill values:

```env
PORT=5050
MONGO_URI=mongodb://127.0.0.1:27017/noiseguard_ai
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
CLIENT_ORIGIN=http://localhost:5173
```

### Client (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5050
VITE_SOCKET_URL=http://localhost:5050
```

## Run Locally

From repo root:

```bash
npm install
npm run dev
```

This starts both:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5050`

## Notes

- Gemini key is used only on backend.
- If Gemini fails or key is missing, classification safely falls back to `Unknown`.
- Ensure MongoDB is running before starting the backend.
