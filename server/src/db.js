import { JSONFilePreset } from "lowdb/node";

const defaultData = {
  habits: [],
  profile: {
    name: "Demo User",
    xp: 0,
    level: 1,
    badges: []
  }
};

export const db = await JSONFilePreset("data/db.json", defaultData);

export const saveDb = async () => {
  await db.write();
};

