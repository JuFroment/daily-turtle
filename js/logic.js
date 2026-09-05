export function appDate(date = new Date()) {
  return new Date(date.getTime() - 6 * 60 * 60 * 1000);
}

export function dateKey(date = new Date()) {
  return appDate(date).toISOString().slice(0, 10);
}

export function levelInfo(totalXp) {
  const xpPerLevel = 100;
  const level = Math.floor(totalXp / xpPerLevel) + 1;
  const current = totalXp % xpPerLevel;
  return { level, current, needed: xpPerLevel, percent: current };
}

export function rankForLevel(level) {
  if (level >= 20) return "Gardien du foyer";
  if (level >= 15) return "Compagnon fiable";
  if (level >= 10) return "Bâtisseur du quotidien";
  if (level >= 5) return "Aventurier constant";
  return "Apprenti du quotidien";
}

export function globalLevelUpCost(level) {
  return 2 + Math.floor(level / 2);
}

export function getTotalXp(days, quests) {
  return Object.values(days).reduce((total, day) => {
    const completedXp = (day.completed || []).reduce((sum, questId) => {
      const quest = quests.find(q => q.id === questId);
      return sum + (quest?.xp || 0);
    }, 0);
    const bonusXp = (day.bonusCompleted || []).reduce((sum, questId) => {
      const quest = quests.find(q => q.id === questId);
      return sum + (quest?.bonusXp || 0);
    }, 0);
    return total + completedXp + bonusXp;
  }, 0);
}

export function categoryXp(days, quests, categoryId) {
  return Object.values(days).reduce((total, day) => {
    const completedXp = (day.completed || []).reduce((sum, questId) => {
      const quest = quests.find(q => q.id === questId && q.categoryId === categoryId);
      return sum + (quest?.xp || 0);
    }, 0);
    const bonusXp = (day.bonusCompleted || []).reduce((sum, questId) => {
      const quest = quests.find(q => q.id === questId && q.categoryId === categoryId);
      return sum + (quest?.bonusXp || 0);
    }, 0);
    return total + completedXp + bonusXp;
  }, 0);
}


export function totalSkillPoints(days, quests, categories) {
  return categories.reduce((sum, category) => {
    return sum + (levelInfo(categoryXp(days, quests, category.id)).level - 1);
  }, 0);
}

export function globalLevelInfo(totalPoints) {
  let level = 1;
  let remaining = totalPoints;
  while (remaining >= globalLevelUpCost(level)) {
    remaining -= globalLevelUpCost(level);
    level++;
  }
  const needed = globalLevelUpCost(level);
  return { level, current: remaining, needed, percent: Math.round((remaining / needed) * 100) };
}