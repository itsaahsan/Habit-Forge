import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { api } from "./api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MOTIVATION_LINES = [
  "Tiny steps beat perfect plans.",
  "Your streak is your story. Protect it.",
  "Progress compounds when repeated daily.",
  "One checkbox today helps future you."
];

function App() {
  const [habits, setHabits] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    sortBy: "createdAt",
    order: "desc"
  });
  const [form, setForm] = useState({
    name: "",
    reminderTime: "20:00",
    color: "#ea580c",
    targetDays: 5
  });

  const todayKey = dayjs().format("YYYY-MM-DD");
  const motivation = useMemo(
    () => MOTIVATION_LINES[dayjs().date() % MOTIVATION_LINES.length],
    []
  );

  const reloadAll = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const [habitData, weeklyData, heatData, profileData, activityData] = await Promise.all([
        api.listHabits(nextFilters),
        api.weeklyStats(),
        api.heatmapStats(140),
        api.profile(),
        api.activity(30)
      ]);
      setHabits(habitData);
      setWeekly(weeklyData);
      setHeatmap(heatData);
      setProfile(profileData);
      setActivity(activityData.events.slice(0, 8));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadAll(filters);
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const timer = setInterval(async () => {
      try {
        const reminders = await api.dueReminders();
        if (Notification.permission === "granted") {
          reminders.forEach((item) => {
            new Notification(`Habit Reminder: ${item.name}`, {
              body: "Keep your streak alive today."
            });
          });
        }
      } catch {
        // Ignore reminder polling errors.
      }
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const submitHabit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    await api.createHabit(form);
    setForm({ ...form, name: "" });
    reloadAll(filters);
  };

  const toggleToday = async (id) => {
    await api.toggleHabit(id, todayKey);
    reloadAll(filters);
  };

  const removeHabit = async (id) => {
    await api.deleteHabit(id);
    reloadAll(filters);
  };

  const updateFilter = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    reloadAll(next);
  };

  const chartData = useMemo(() => {
    if (!weekly) return null;
    return {
      labels: weekly.weeklyByDay.map((x) => dayjs(x.day).format("ddd")),
      datasets: [
        {
          label: "Completions",
          data: weekly.weeklyByDay.map((x) => x.completed),
          backgroundColor: "#0f766e"
        }
      ]
    };
  }, [weekly]);

  const heatmapRows = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < heatmap.length; i += 7) {
      chunks.push(heatmap.slice(i, i + 7));
    }
    return chunks;
  }, [heatmap]);

  const intensityClass = (count) => {
    if (count === 0) return "lvl-0";
    if (count === 1) return "lvl-1";
    if (count <= 3) return "lvl-2";
    return "lvl-3";
  };

  if (loading) return <div className="state">Loading dashboard...</div>;
  if (error) return <div className="state error">{error}</div>;

  return (
    <main className="page">
      <header className="hero">
        <div>
          <h1>Habit Forge</h1>
          <p>{motivation}</p>
        </div>
        {profile && (
          <div className="xpCard">
            <strong>Level {profile.level}</strong>
            <span>
              XP {profile.xp}/{profile.nextLevelXp}
            </span>
          </div>
        )}
      </header>

      <section className="grid">
        <article className="card">
          <h2>Create Habit</h2>
          <form onSubmit={submitHabit} className="habitForm">
            <input
              placeholder="Read 20 pages"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <label>
              Reminder
              <input
                type="time"
                value={form.reminderTime}
                onChange={(e) => setForm({ ...form, reminderTime: e.target.value })}
              />
            </label>
            <label>
              Target days/week
              <input
                type="number"
                min="1"
                max="7"
                value={form.targetDays}
                onChange={(e) => setForm({ ...form, targetDays: Number(e.target.value) })}
              />
            </label>
            <label>
              Color
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </label>
            <button type="submit">Add Habit</button>
          </form>
        </article>

        <article className="card">
          <h2>Weekly Stats</h2>
          {chartData && <Bar data={chartData} options={{ responsive: true }} />}
          {weekly && (
            <div className="summary">
              <span>Active habits: {weekly.summary.activeHabits}</span>
              <span>
                Completion rate: <strong>{weekly.summary.completionRate}%</strong>
              </span>
            </div>
          )}
        </article>
      </section>

      <section className="card">
        <div className="panelHead">
          <h2>Today&apos;s Habits</h2>
          <a className="linkBtn" href={api.exportCsvUrl} target="_blank" rel="noreferrer">
            Export CSV
          </a>
        </div>

        <div className="filterBar">
          <input
            placeholder="Search habits"
            value={filters.q}
            onChange={(e) => updateFilter({ q: e.target.value })}
          />
          <select
            value={filters.status}
            onChange={(e) => updateFilter({ status: e.target.value })}
          >
            <option value="all">All</option>
            <option value="today_done">Done Today</option>
            <option value="today_pending">Pending Today</option>
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter({ sortBy: e.target.value })}
          >
            <option value="createdAt">Sort: Created</option>
            <option value="name">Sort: Name</option>
            <option value="streak">Sort: Streak</option>
          </select>
          <select
            value={filters.order}
            onChange={(e) => updateFilter({ order: e.target.value })}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        {habits.length === 0 && <p>No habits found for current filters.</p>}
        <div className="habitList">
          {habits.map((habit) => {
            const doneToday = habit.completions.includes(todayKey);
            return (
              <div key={habit.id} className="habitItem">
                <div>
                  <h3>{habit.name}</h3>
                  <p>
                    Current streak: {habit.streak.current} days | Longest: {habit.streak.longest} days
                  </p>
                  <p>Reminder at {habit.reminderTime}</p>
                </div>
                <div className="actions">
                  <button
                    style={{ background: doneToday ? "#15803d" : habit.color }}
                    onClick={() => toggleToday(habit.id)}
                  >
                    {doneToday ? "Completed" : "Mark Done"}
                  </button>
                  <button className="danger" onClick={() => removeHabit(habit.id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>Heatmap Calendar (Last 140 days)</h2>
        <div className="heatmap">
          {heatmapRows.map((col, idx) => (
            <div key={idx} className="col">
              {col.map((cell) => (
                <div
                  key={cell.date}
                  className={`cell ${intensityClass(cell.count)}`}
                  title={`${cell.date}: ${cell.count} completion(s)`}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Badges</h2>
          <div className="badges">
            {profile?.badges?.length ? profile.badges.map((badge) => <span key={badge}>{badge}</span>) : <p>No badges yet.</p>}
          </div>
        </article>

        <article className="card">
          <h2>Recent Activity</h2>
          <div className="activityList">
            {activity.length === 0 && <p>No activity yet.</p>}
            {activity.map((item) => (
              <div key={`${item.habitId}-${item.date}`} className="activityItem">
                <strong>{item.habitName}</strong>
                <span>{dayjs(item.date).format("MMM D, YYYY")}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

export default App;
