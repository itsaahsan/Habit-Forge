import dayjs from "dayjs";

export const toDateKey = (date = dayjs()) => dayjs(date).format("YYYY-MM-DD");

export const getCurrentWeekKeys = () => {
  const today = dayjs();
  const dayOfWeek = today.day();
  const monday = today.subtract((dayOfWeek + 6) % 7, "day");
  return Array.from({ length: 7 }, (_, i) => toDateKey(monday.add(i, "day")));
};

export const getLastNDays = (days) => {
  const today = dayjs();
  return Array.from({ length: days }, (_, i) =>
    toDateKey(today.subtract(days - 1 - i, "day"))
  );
};

export const calcStreak = (completionKeys) => {
  if (!completionKeys.length) return { current: 0, longest: 0 };
  const sorted = [...new Set(completionKeys)].sort();

  let longest = 1;
  let running = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = dayjs(sorted[i - 1]);
    const current = dayjs(sorted[i]);
    if (current.diff(prev, "day") === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  const today = toDateKey();
  const yesterday = toDateKey(dayjs().subtract(1, "day"));
  let currentStreak = 0;

  if (sorted.includes(today) || sorted.includes(yesterday)) {
    let cursor = sorted.includes(today) ? dayjs(today) : dayjs(yesterday);
    while (sorted.includes(cursor.format("YYYY-MM-DD"))) {
      currentStreak += 1;
      cursor = cursor.subtract(1, "day");
    }
  }

  return { current: currentStreak, longest };
};

