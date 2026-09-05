import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dateKey,
  appDate,
  levelInfo,
  rankForLevel,
  globalLevelUpCost,
  getTotalXp,
  categoryXp,
  totalSkillPoints,
  globalLevelInfo,
} from "./logic.js";

test("dateKey formats a date as YYYY-MM-DD", () => {
  const date = new Date("2026-08-21T15:30:00Z");
  assert.equal(dateKey(date), "2026-08-21");
});

test("dateKey rolls a time before 6 AM UTC back to the previous day", () => {
  const date = new Date("2026-08-22T03:00:00Z");
  assert.equal(dateKey(date), "2026-08-21");
});

test("dateKey keeps a time at or after 6 AM UTC on the same day", () => {
  const date = new Date("2026-08-22T06:00:00Z");
  assert.equal(dateKey(date), "2026-08-22");
});

test("appDate shifts a time before 6 AM UTC to the previous calendar day", () => {
  const date = new Date("2026-08-22T03:00:00Z");
  assert.equal(appDate(date).toISOString().slice(0, 10), "2026-08-21");
});

test("levelInfo computes level 1 with no XP", () => {
  assert.deepEqual(levelInfo(0), {
    level: 1,
    current: 0,
    needed: 100,
    percent: 0,
  });
});

test("levelInfo computes a higher level with partial progress", () => {
  assert.deepEqual(levelInfo(250), {
    level: 3,
    current: 50,
    needed: 100,
    percent: 50,
  });
});

test("rankForLevel returns the right rank at each threshold", () => {
  assert.equal(rankForLevel(1), "Apprenti du quotidien");
  assert.equal(rankForLevel(4), "Apprenti du quotidien");
  assert.equal(rankForLevel(5), "Aventurier constant");
  assert.equal(rankForLevel(10), "Bâtisseur du quotidien");
  assert.equal(rankForLevel(15), "Compagnon fiable");
  assert.equal(rankForLevel(20), "Gardien du foyer");
});

test("globalLevelUpCost grows every two levels", () => {
  assert.equal(globalLevelUpCost(1), 2);
  assert.equal(globalLevelUpCost(2), 3);
  assert.equal(globalLevelUpCost(4), 4);
});

test("getTotalXp sums XP for all completed quests across all days", () => {
  const quests = [
    { id: "a", xp: 10 },
    { id: "b", xp: 20 },
  ];
  const days = {
    "2026-08-20": { completed: ["a"] },
    "2026-08-21": { completed: ["a", "b"] },
  };
  assert.equal(getTotalXp(days, quests), 40);
});

test("categoryXp only counts quests from the given category", () => {
  const quests = [
    { id: "a", xp: 10, categoryId: "corps" },
    { id: "b", xp: 20, categoryId: "esprit" },
  ];
  const days = {
    "2026-08-21": { completed: ["a", "b"] },
  };
  assert.equal(categoryXp(days, quests, "corps"), 10);
});

test("getTotalXp adds bonus XP for quests with a checked bonus", () => {
  const quests = [
    { id: "a", xp: 10, bonusXp: 5 },
    { id: "b", xp: 20 },
  ];
  const days = {
    "2026-08-21": { completed: ["a", "b"], bonusCompleted: ["a"] },
  };
  assert.equal(getTotalXp(days, quests), 35);
});

test("categoryXp adds bonus XP only for quests in the given category", () => {
  const quests = [
    { id: "a", xp: 10, bonusXp: 5, categoryId: "corps" },
    { id: "b", xp: 20, bonusXp: 8, categoryId: "esprit" },
  ];
  const days = {
    "2026-08-21": { completed: ["a", "b"], bonusCompleted: ["a", "b"] },
  };
  assert.equal(categoryXp(days, quests, "corps"), 15);
});

test("totalSkillPoints sums the levels gained across all categories", () => {
  const categories = [{ id: "corps" }, { id: "esprit" }];
  const quests = [
    { id: "a", xp: 100, categoryId: "corps" },
    { id: "b", xp: 50, categoryId: "esprit" },
  ];
  const days = {
    "2026-08-21": { completed: ["a", "b"] },
  };
  // corps : 100 XP -> niveau 2 (niveau - 1 = 1 point)
  // esprit : 50 XP -> niveau 1 (niveau - 1 = 0 point)
  assert.equal(totalSkillPoints(days, quests, categories), 1);
});

test("globalLevelInfo computes the global level from accumulated skill points", () => {
  assert.deepEqual(globalLevelInfo(0), {
    level: 1,
    current: 0,
    needed: 2,
    percent: 0,
  });
  assert.deepEqual(globalLevelInfo(2), {
    level: 2,
    current: 0,
    needed: 3,
    percent: 0,
  });
});
