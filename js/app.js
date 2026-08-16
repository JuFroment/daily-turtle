const STORAGE_KEY = "julien-rpg-tracker-v1";
const THEME_KEY = "daily-turtle-theme";
const savedTheme = localStorage.getItem(THEME_KEY) || "dark";

const defaultState = {
  profileName: "Julien",
  quests: [
    { id: crypto.randomUUID(), title: "Prendre une douche", xp: 15 },
    { id: crypto.randomUUID(), title: "Porter des vêtements propres et en bon état", xp: 10 },
    { id: crypto.randomUUID(), title: "Faire une action pour la maison", xp: 15 },
    { id: crypto.randomUUID(), title: "Créer un moment complice avec Morgan et les toutous", xp: 20 },
    { id: crypto.randomUUID(), title: "Manger au moins un repas équilibré", xp: 15 },
    { id: crypto.randomUUID(), title: "Faire une pause avant de lancer le PC", xp: 10 }
  ],
  days: {},
  reviews: {},
  backlog: []
};

let state = loadState();
let deferredInstallPrompt = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    return {
      ...structuredClone(defaultState),
      ...saved,
      quests: saved.quests?.length ? saved.quests : structuredClone(defaultState.quests),
      days: saved.days || {},
      reviews: saved.reviews || {},
      backlog: saved.backlog || []
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  const button = document.querySelector("#themeToggle");

  document.documentElement.classList.toggle("dark", isDark);

  const backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();

  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute("content", backgroundColor);

  button.textContent = isDark ? "☀ Mode clair" : "🌙 Mode sombre";
  button.setAttribute(
    "aria-label",
    isDark ? "Activer le thème clair" : "Activer le thème sombre"
  );
}

applyTheme(savedTheme);

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function currentDay() {
  const key = dateKey();
  if (!state.days[key]) {
    state.days[key] = { completed: [], initiative: "" };
  }
  return state.days[key];
}

function getTotalXp() {
  return Object.values(state.days).reduce((total, day) => {
    return total + (day.completed || []).reduce((sum, questId) => {
      const quest = state.quests.find(q => q.id === questId);
      return sum + (quest?.xp || 0);
    }, 0);
  }, 0);
}

function levelInfo(totalXp) {
  const xpPerLevel = 100;
  const level = Math.floor(totalXp / xpPerLevel) + 1;
  const current = totalXp % xpPerLevel;
  return { level, current, needed: xpPerLevel, percent: current };
}

function rankForLevel(level) {
  if (level >= 20) return "Gardien du foyer";
  if (level >= 15) return "Compagnon fiable";
  if (level >= 10) return "Bâtisseur du quotidien";
  if (level >= 5) return "Aventurier constant";
  return "Apprenti du quotidien";
}

function render() {
  const today = new Date();
  document.querySelector("#todayLabel").textContent =
    today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  document.querySelector("#playerTitle").textContent = state.profileName;
  const totalXp = getTotalXp();
  const info = levelInfo(totalXp);
  document.querySelector("#levelValue").textContent = info.level;
  document.querySelector("#rankLabel").textContent = rankForLevel(info.level);
  document.querySelector("#xpLabel").textContent = `${info.current} / ${info.needed} XP`;
  document.querySelector("#nextLevelLabel").textContent = `${info.needed - info.current} XP pour le niveau suivant`;
  document.querySelector("#xpBar").style.width = `${info.percent}%`;
  document.querySelector("#totalXp").textContent = totalXp;

  const day = currentDay();
  document.querySelector("#todayScore").textContent = `${day.completed.length}/${state.quests.length}`;
  document.querySelector("#activeDays").textContent =
    Object.values(state.days).filter(d => (d.completed?.length || 0) > 0).length;

  const questList = document.querySelector("#questList");
  questList.innerHTML = "";
  state.quests.forEach(quest => {
    const isDone = day.completed.includes(quest.id);
    const label = document.createElement("label");
    label.className = `quest ${isDone ? "done" : ""}`;
    label.innerHTML = `
      <input type="checkbox" ${isDone ? "checked" : ""} aria-label="${escapeHtml(quest.title)}" />
      <span class="quest-title">${escapeHtml(quest.title)}</span>
      <span class="quest-xp">+${quest.xp} XP</span>`;
    label.querySelector("input").addEventListener("change", event => {
      const todayData = currentDay();
      if (event.target.checked) {
        if (!todayData.completed.includes(quest.id)) todayData.completed.push(quest.id);
      } else {
        todayData.completed = todayData.completed.filter(id => id !== quest.id);
      }
      saveState();
      render();
    });
    questList.appendChild(label);
  });

  document.querySelector("#initiativeNote").value = day.initiative || "";
  renderWeek();
  loadReview();
  renderBacklog();
}

function daysSinceFirstUse() {
  const keys = Object.keys(state.days).sort();
  if (!keys.length) return 1;
  const first = new Date(keys[0]);
  const today = new Date();
  const diffDays = Math.floor((today - first) / 86400000);
  return diffDays + 1;
}

function renderWeek() {
  const grid = document.querySelector("#weekGrid");
  grid.innerHTML = "";
  let completed = 0;
  let possible = 0;

  const visibleDays = Math.min(daysSinceFirstUse(), 7);

  for (let offset = visibleDays - 1; offset >= 0; offset--) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = dateKey(date);
    const day = state.days[key] || { completed: [] };
    const count = day.completed?.length || 0;
    completed += count;
    possible += state.quests.length;

    const percent = state.quests.length ? Math.round((count / state.quests.length) * 100) : 0;
    const cell = document.createElement("div");
    cell.className = "day-cell";
    if (offset === 0) cell.classList.add("today");
    const opacity = 0.08 + percent / 180;

    if (percent > 0) {
      cell.classList.add("active");
      cell.style.background = `rgb(var(--activity-rgb) / ${opacity})`;
    }
    cell.innerHTML = `
      <strong>${date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}</strong>
      <span>${count}/${state.quests.length}</span>`;
    grid.appendChild(cell);
  }

  document.querySelector("#weekPercent").textContent =
    possible ? `${Math.round((completed / possible) * 100)} %` : "0 %";
}

function renderBacklog() {
  const activeList = document.querySelector("#backlogActive");
  const doneList = document.querySelector("#backlogDone");
  const doneSection = document.querySelector("#backlogDoneSection");
  activeList.innerHTML = "";
  doneList.innerHTML = "";

  const renderItem = (item, container) => {
    const row = document.createElement("div");
    row.className = `backlog-item ${item.done ? "done" : ""}`;
    row.innerHTML = `
      <label>
        <input type="checkbox" ${item.done ? "checked" : ""} aria-label="${escapeHtml(item.title)}" />
        <span>${escapeHtml(item.title)}</span>
      </label>
      <button type="button" class="text-btn" aria-label="Supprimer">✕</button>`;
    row.querySelector("input").addEventListener("change", event => {
      item.done = event.target.checked;
      saveState();
      renderBacklog();
    });
    row.querySelector("button").addEventListener("click", () => {
      state.backlog = state.backlog.filter(entry => entry.id !== item.id);
      saveState();
      renderBacklog();
    });
    container.appendChild(row);
  };

  state.backlog.forEach(item => renderItem(item, item.done ? doneList : activeList));

  doneSection.classList.toggle("hidden", doneList.children.length === 0);
}

function reviewKey() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
  return `${now.getFullYear()}-S${week}`;
}

function loadReview() {
  const review = state.reviews[reviewKey()] || {};
  document.querySelector("#proudInput").value = review.proud || "";
  document.querySelector("#obstacleInput").value = review.obstacle || "";
  document.querySelector("#priorityInput").value = review.priority || "";
}

function openQuestEditor() {
  const editor = document.querySelector("#questEditor");
  editor.innerHTML = "";
  state.quests.forEach(quest => addEditorRow(quest));
  document.querySelector("#questDialog").showModal();
}

function addEditorRow(quest = { id: crypto.randomUUID(), title: "", xp: 10 }) {
  const row = document.createElement("div");
  row.className = "editor-row";
  row.dataset.id = quest.id;
  row.innerHTML = `
    <input type="text" value="${escapeHtml(quest.title)}" placeholder="Nom de la quête" />
    <input type="number" min="1" max="100" value="${quest.xp}" aria-label="Points d'expérience" />
    <button type="button" class="danger">Supprimer</button>`;
  row.querySelector("button").addEventListener("click", () => row.remove());
  document.querySelector("#questEditor").appendChild(row);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector("#editProfileBtn").addEventListener("click", () => {
  const input = document.querySelector("#profileNameInput");

  input.value = state.profileName;
  document.querySelector("#profileDialog").showModal();
  input.focus();
});

document.querySelector("#profileForm").addEventListener("submit", event => {
  if (event.submitter?.value === "cancel") {
    return;
  }

  event.preventDefault();

  const input = document.querySelector("#profileNameInput");
  const profileName = input.value.trim();

  if (!profileName) {
    input.value = "";
    input.reportValidity();
    return;
  }

  state.profileName = profileName;
  saveState();

  document.querySelector("#profileDialog").close();
  render();
});

document.querySelector("#saveNoteBtn").addEventListener("click", () => {
  currentDay().initiative = document.querySelector("#initiativeNote").value.trim();
  saveState();
  const feedback = document.querySelector("#noteSaved");
  feedback.classList.remove("hidden");
  setTimeout(() => feedback.classList.add("hidden"), 1600);
});

document.querySelector("#backlogForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.querySelector("#backlogInput");
  const title = input.value.trim();
  if (!title) return;
  state.backlog.push({ id: crypto.randomUUID(), title, done: false });
  input.value = "";
  saveState();
  renderBacklog();
});

document.querySelector("#saveReviewBtn").addEventListener("click", () => {
  state.reviews[reviewKey()] = {
    proud: document.querySelector("#proudInput").value.trim(),
    obstacle: document.querySelector("#obstacleInput").value.trim(),
    priority: document.querySelector("#priorityInput").value.trim()
  };
  saveState();
  const feedback = document.querySelector("#reviewSaved");
  feedback.classList.remove("hidden");
  setTimeout(() => feedback.classList.add("hidden"), 1600);
});

document.querySelector("#editQuestsBtn").addEventListener("click", openQuestEditor);
document.querySelector("#addQuestBtn").addEventListener("click", () => addEditorRow());

document.querySelector("#saveQuestsBtn").addEventListener("click", event => {
  event.preventDefault();
  const rows = [...document.querySelectorAll(".editor-row")];
  const quests = rows.map(row => ({
    id: row.dataset.id,
    title: row.querySelector('input[type="text"]').value.trim(),
    xp: Math.max(1, Number(row.querySelector('input[type="number"]').value) || 10)
  })).filter(q => q.title);

  if (!quests.length) {
    alert("Il faut conserver au moins une quête.");
    return;
  }
  state.quests = quests;
  Object.values(state.days).forEach(day => {
    day.completed = (day.completed || []).filter(id => state.quests.some(q => q.id === id));
  });
  saveState();
  document.querySelector("#questDialog").close();
  render();
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quete-du-quotidien-${dateKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#resetBtn").addEventListener("click", () => {
  if (!confirm("Supprimer toutes les données et repartir de zéro ?")) return;
  state = structuredClone(defaultState);
  saveState();
  render();
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector("#installBtn").classList.remove("hidden");
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  const isCurrentlyDark =
    document.documentElement.classList.contains("dark");

  const nextTheme = isCurrentlyDark ? "light" : "dark";

  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
});

document.querySelector("#installBtn").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.querySelector("#installBtn").classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(console.error);
  });
}

render();
