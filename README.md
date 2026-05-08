# Habit Forge

> A full-stack habit tracking platform built for consistency, analytics, and gamification — designed with production-grade architecture and real-world engineering practices.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?style=flat&logo=chartdotjs&logoColor=white)](https://chartjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Overview

Habit Forge is a full-stack productivity application that helps users build and maintain daily habits through intelligent streak tracking, visual analytics, and a gamification system. Built with a clean REST API, local-first persistence, and a responsive React frontend — no external database required.

**Key engineering highlights:**
- RESTful API with query-driven filtering, sorting, and search
- Streak engine with current and longest streak calculation
- XP/level/badge gamification system with real progression logic
- Heatmap calendar rendering 140 days of activity history
- Browser notification system for habit reminders
- CSV export pipeline for data portability



---

## ✨ Features

| Feature | Description |
|---|---|
| **Habit Management** | Full CRUD with color labels, reminder times, and weekly targets |
| **Streak Engine** | Tracks current and longest streaks with daily completion logic |
| **Weekly Analytics** | Chart.js bar/line charts showing weekly completion rates |
| **Heatmap Calendar** | GitHub-style contribution heatmap for 140-day history |
| **Gamification** | XP points, level progression, and achievement badges |
| **Smart Reminders** | Browser push notifications at scheduled reminder times |
| **Advanced Filtering** | Search, filter by status, sort by name/streak/progress |
| **Activity Feed** | Real-time log of recent habit completions and achievements |
| **CSV Export** | One-click data export for all habits and completion history |

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite 5** — fast dev server and optimized builds
- **Chart.js 4** — weekly analytics and heatmap visualizations
- **React Router v6** — client-side routing
- **Tailwind CSS** — utility-first responsive styling

### Backend
- **Node.js 18** + **Express 4** — RESTful API server
- **lowdb** — lightweight local JSON persistence (no external DB needed)
- **date-fns** — reliable date/time logic for streaks and weekly summaries

### DevOps
- **Vite Proxy** — seamless frontend-to-backend API routing in dev
- **Vercel** — frontend deployment
- **Render** — backend deployment

---

## 📁 Project Structure

```
habit-forge/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Helper functions
│   └── vite.config.js
│
├── server/                  # Express API + lowdb storage
│   ├── routes/              # API route handlers
│   ├── services/            # Business logic (streak, gamification)
│   ├── db/                  # lowdb setup and data access
│   └── index.js
│
└── README.md
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/habits?q=&status=&sortBy=&order=` | List habits with filtering and sorting |
| `POST` | `/api/habits` | Create a new habit |
| `PUT` | `/api/habits/:id` | Update habit details |
| `DELETE` | `/api/habits/:id` | Delete a habit |
| `POST` | `/api/habits/:id/toggle` | Toggle today's completion |
| `GET` | `/api/stats/weekly` | Weekly completion statistics |
| `GET` | `/api/stats/heatmap?days=140` | Heatmap data for N days |
| `GET` | `/api/gamification` | XP, level, and badge data |
| `GET` | `/api/reminders/due` | Habits with due reminders |
| `GET` | `/api/activity?days=30` | Recent activity feed |
| `GET` | `/api/export.csv` | Export all data as CSV |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Windows PowerShell or any terminal

### 1. Clone the repository
```bash
git clone https://github.com/itsaahsan/habit-forge.git
cd habit-forge
```

### 2. Install dependencies
```bash
# Backend
cd server
npm.cmd install

# Frontend
cd ..\client
npm.cmd install
```

### 3. Start the backend
```bash
cd server
npm.cmd start
# Running at http://127.0.0.1:5000
```

### 4. Start the frontend
```bash
cd client
npm.cmd run dev -- --host 127.0.0.1 --port 5173
# Running at http://127.0.0.1:5173
```

---

## 🔧 Port Configuration

If port `5000` is already in use:

```powershell
# Run backend on alternate port
$env:PORT="5001"; npm.cmd start

# Point frontend proxy to new backend port
$env:VITE_PROXY_TARGET="http://127.0.0.1:5001"
npm.cmd run dev -- --host 127.0.0.1 --port 5174
```

---

## 🧠 Engineering Decisions

**Why lowdb instead of MongoDB?**
Local JSON persistence via lowdb removes the need for external services, making the project instantly reviewable and demo-friendly without any cloud setup. The data layer is abstracted behind a service layer, so swapping to MongoDB or PostgreSQL requires changes only in `server/db/`.

**Why Vite instead of Create React App?**
Vite's native ESM dev server provides near-instant HMR and significantly faster cold starts compared to webpack-based setups — better developer experience and faster CI builds.

**Streak calculation approach**
Streaks are calculated server-side on each toggle event using a date-sequence algorithm that correctly handles timezone-aware day boundaries, preventing off-by-one errors common in client-side implementations.

---

## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| `ERR_CONNECTION_REFUSED` | Backend is not running — start it first with `npm.cmd start` |
| `EADDRINUSE` on startup | Port is occupied — use alternate port config above |
| PowerShell `npm` policy error | Use `npm.cmd` instead of `npm` on Windows |
| Notifications not showing | Allow browser notifications in site permissions |

---

## 🗺 Roadmap

- [ ] PostgreSQL / MongoDB adapter option
- [ ] OAuth 2.0 authentication (Google, GitHub)
- [ ] Mobile app (React Native)
- [ ] Habit sharing and social streaks
- [ ] AI-powered habit recommendations

---

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.




---

> Built with focus on clean architecture, real-world API design, and production-ready engineering practices.
