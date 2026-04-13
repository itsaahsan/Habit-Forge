const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function call(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
  } catch {
    throw new Error("Backend is not reachable. Start the server on port 5000.");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Request failed");
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  listHabits: (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.order) query.set("order", params.order);
    const suffix = query.toString() ? `?${query}` : "";
    return call(`/habits${suffix}`);
  },
  createHabit: (body) => call("/habits", { method: "POST", body: JSON.stringify(body) }),
  toggleHabit: (id, date) =>
    call(`/habits/${id}/toggle`, { method: "POST", body: JSON.stringify({ date }) }),
  deleteHabit: (id) => call(`/habits/${id}`, { method: "DELETE" }),
  weeklyStats: () => call("/stats/weekly"),
  heatmapStats: (days = 180) => call(`/stats/heatmap?days=${days}`),
  profile: () => call("/gamification"),
  dueReminders: () => call("/reminders/due"),
  activity: (days = 30) => call(`/activity?days=${days}`),
  exportCsvUrl: `${API_BASE}/export.csv`
};
