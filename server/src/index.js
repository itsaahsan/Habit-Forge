import cors from "cors";
import dayjs from "dayjs";
import express from "express";
import { nanoid } from "nanoid";
import { db, saveDb } from "./db.js";
import { calcStreak, getCurrentWeekKeys, getLastNDays, toDateKey } from "./dateUtils.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const xpThreshold = (level) => level * 120;

const refreshProfileRewards = () => {
  const allCompletions = db.data.habits.reduce(
    (sum, habit) => sum + habit.completions.length,
    0
  );
  const streaks = db.data.habits.map((habit) => calcStreak(habit.completions).longest);
  const longest = Math.max(0, ...streaks);
  const badges = new Set();

  if (allCompletions >= 10) badges.add("Starter");
  if (allCompletions >= 50) badges.add("Momentum");
  if (allCompletions >= 100) badges.add("Centurion");
  if (longest >= 7) badges.add("7-Day Streak");
  if (longest >= 30) badges.add("30-Day Legend");

  db.data.profile.badges = [...badges];
};

const applyXp = (delta) => {
  db.data.profile.xp = Math.max(0, db.data.profile.xp + delta);
  while (db.data.profile.xp >= xpThreshold(db.data.profile.level)) {
    db.data.profile.xp -= xpThreshold(db.data.profile.level);
    db.data.profile.level += 1;
  }
};

const enrichHabit = (habit) => {
  const streak = calcStreak(habit.completions);
  return { ...habit, streak };
};

const escapeCsv = (value) => {
  const normalized = String(value ?? "");
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

app.get("/api/health", (_, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api/habits", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const status = String(req.query.status || "all");
  const sortBy = String(req.query.sortBy || "createdAt");
  const order = String(req.query.order || "desc") === "asc" ? 1 : -1;
  const today = toDateKey();

  let habits = db.data.habits.map(enrichHabit);

  if (q) habits = habits.filter((habit) => habit.name.toLowerCase().includes(q));
  if (status === "today_done") habits = habits.filter((habit) => habit.completions.includes(today));
  if (status === "today_pending")
    habits = habits.filter((habit) => !habit.completions.includes(today));

  habits.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name) * order;
    if (sortBy === "streak") return (a.streak.current - b.streak.current) * order;
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
  });

  res.json(habits);
});

app.post("/api/habits", async (req, res) => {
  const { name, color = "#f97316", reminderTime = "20:00", targetDays = 5 } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Habit name is required." });
  }

  const newHabit = {
    id: nanoid(),
    name: name.trim(),
    color,
    reminderTime,
    targetDays: Number(targetDays) || 5,
    completions: [],
    createdAt: new Date().toISOString()
  };

  db.data.habits.push(newHabit);
  await saveDb();
  return res.status(201).json(enrichHabit(newHabit));
});

app.put("/api/habits/:id", async (req, res) => {
  const habit = db.data.habits.find((item) => item.id === req.params.id);
  if (!habit) return res.status(404).json({ message: "Habit not found." });

  const { name, color, reminderTime, targetDays } = req.body || {};
  if (name) habit.name = String(name).trim();
  if (color) habit.color = color;
  if (reminderTime) habit.reminderTime = reminderTime;
  if (targetDays !== undefined) habit.targetDays = Number(targetDays) || habit.targetDays;

  await saveDb();
  return res.json(enrichHabit(habit));
});

app.delete("/api/habits/:id", async (req, res) => {
  const before = db.data.habits.length;
  db.data.habits = db.data.habits.filter((habit) => habit.id !== req.params.id);
  if (db.data.habits.length === before) {
    return res.status(404).json({ message: "Habit not found." });
  }

  refreshProfileRewards();
  await saveDb();
  return res.status(204).send();
});

app.post("/api/habits/:id/toggle", async (req, res) => {
  const habit = db.data.habits.find((item) => item.id === req.params.id);
  if (!habit) return res.status(404).json({ message: "Habit not found." });

  const dateKey = req.body?.date ? toDateKey(req.body.date) : toDateKey();
  const alreadyCompleted = habit.completions.includes(dateKey);

  if (alreadyCompleted) {
    habit.completions = habit.completions.filter((d) => d !== dateKey);
    applyXp(-5);
  } else {
    habit.completions.push(dateKey);
    applyXp(10);
  }

  refreshProfileRewards();
  await saveDb();
  return res.json(enrichHabit(habit));
});

app.get("/api/stats/weekly", (_, res) => {
  const weekKeys = getCurrentWeekKeys();
  const weeklyByDay = weekKeys.map((day) => ({
    day,
    completed: db.data.habits.filter((habit) => habit.completions.includes(day)).length
  }));

  const activeHabits = db.data.habits.length;
  const weekCompleted = weeklyByDay.reduce((sum, row) => sum + row.completed, 0);
  const weekTarget = db.data.habits.reduce((sum, habit) => sum + habit.targetDays, 0);
  const completionRate = weekTarget > 0 ? Math.round((weekCompleted / weekTarget) * 100) : 0;

  return res.json({
    weeklyByDay,
    summary: {
      activeHabits,
      weekCompleted,
      weekTarget,
      completionRate
    }
  });
});

app.get("/api/stats/heatmap", (req, res) => {
  const days = Math.min(365, Number(req.query.days) || 180);
  const keys = getLastNDays(days);
  const records = keys.map((date) => {
    const count = db.data.habits.filter((habit) => habit.completions.includes(date)).length;
    return { date, count };
  });
  res.json(records);
});

app.get("/api/reminders/due", (req, res) => {
  const now = req.query.now ? dayjs(req.query.now) : dayjs();
  const timeKey = now.format("HH:mm");
  const todayKey = toDateKey(now);

  const due = db.data.habits.filter((habit) => {
    const isTime = habit.reminderTime === timeKey;
    const completedToday = habit.completions.includes(todayKey);
    return isTime && !completedToday;
  });

  res.json(
    due.map((habit) => ({
      id: habit.id,
      name: habit.name,
      reminderTime: habit.reminderTime
    }))
  );
});

app.get("/api/gamification", (_, res) => {
  refreshProfileRewards();
  res.json({
    ...db.data.profile,
    nextLevelXp: xpThreshold(db.data.profile.level)
  });
});

app.get("/api/activity", (req, res) => {
  const days = Math.min(180, Number(req.query.days) || 30);
  const since = dayjs().subtract(days, "day");

  const events = db.data.habits
    .flatMap((habit) =>
      habit.completions.map((date) => ({
        habitId: habit.id,
        habitName: habit.name,
        date
      }))
    )
    .filter((event) => dayjs(event.date).isAfter(since) || dayjs(event.date).isSame(since, "day"))
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  res.json({
    rangeDays: days,
    totalEvents: events.length,
    events
  });
});

app.get("/api/export.csv", (_, res) => {
  const rows = [
    ["habit_id", "habit_name", "created_at", "target_days", "reminder_time", "completion_date"],
    ...db.data.habits.flatMap((habit) => {
      if (!habit.completions.length) {
        return [[habit.id, habit.name, habit.createdAt, habit.targetDays, habit.reminderTime, ""]];
      }
      return habit.completions.map((completion) => [
        habit.id,
        habit.name,
        habit.createdAt,
        habit.targetDays,
        habit.reminderTime,
        completion
      ]);
    })
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="habit-forge-export.csv"`);
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`Habit Forge API running on http://localhost:${PORT}`);
});
