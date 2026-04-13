# Habit Forge

Habit Forge is a full-stack habit tracking platform focused on consistency, analytics, and gamification.
It is designed as a portfolio-quality project for Full-Stack Developer roles.

## Features

- Habit CRUD with color, reminder time, and weekly target
- Daily completion tracking with streak engine (current and longest)
- Weekly analytics dashboard with Chart.js
- Heatmap calendar for long-term consistency view
- Gamification: XP, levels, and achievement badges
- Browser notification reminders
- Search, filter, and sort habits from UI and API
- Recent activity feed (`/api/activity`)
- CSV export (`/api/export.csv`)

## Tech Stack

- Frontend: React + Vite + Chart.js
- Backend: Node.js + Express
- Storage: local JSON via `lowdb` (no MongoDB required)

## Project Structure

```text
client/   # React frontend
server/   # Express API + lowdb storage
```

## API Overview

- `GET /api/habits?q=&status=&sortBy=&order=`
- `POST /api/habits`
- `PUT /api/habits/:id`
- `DELETE /api/habits/:id`
- `POST /api/habits/:id/toggle`
- `GET /api/stats/weekly`
- `GET /api/stats/heatmap?days=140`
- `GET /api/gamification`
- `GET /api/reminders/due`
- `GET /api/activity?days=30`
- `GET /api/export.csv`

## Local Setup (Windows PowerShell)

### 1) Install dependencies

```bash
cd server
npm.cmd install
cd ..\client
npm.cmd install
```

### 2) Start backend

```bash
cd server
npm.cmd start
```

Default backend: `http://127.0.0.1:5000`

### 3) Start frontend

```bash
cd client
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Default frontend: `http://127.0.0.1:5173`

## Port Configuration

If port `5000` is already in use, run backend on another port:

```bash
# PowerShell example
$env:PORT="5001"; npm.cmd start
```

Then point frontend proxy to that backend:

```bash
# PowerShell example
$env:VITE_PROXY_TARGET="http://127.0.0.1:5001"; npm.cmd run dev -- --host 127.0.0.1 --port 5174
```

## Why This Project Is Portfolio-Ready

- Clear separation of frontend and backend concerns
- Practical REST API design with query-driven endpoints
- Real product behavior: reminders, analytics, and export workflows
- Strong date/time logic for streaks, weekly summaries, and heatmaps
- Local-first persistence for easy review and demo without external services

## Troubleshooting

- `ERR_CONNECTION_REFUSED` for API:
  - Backend is not running or wrong API proxy target is configured.
- `EADDRINUSE` on startup:
  - Selected port is already occupied; run on another port.
- PowerShell `npm` policy issues:
  - Use `npm.cmd` commands.
