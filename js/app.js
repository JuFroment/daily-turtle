import {
  dateKey,
  getTotalXp,
  categoryXp,
  levelInfo,
  rankForLevel,
  totalSkillPoints,
  globalLevelInfo,
} from "./logic.js";

const STORAGE_KEY = "julien-rpg-tracker-v1";

const defaultCategories = [
  {
    id: crypto.randomUUID(),
    name: "Le Foyer",
    description: "Prendre soin de l'endroit où tu vis.",
  },
  {
    id: crypto.randomUUID(),
    name: "Corps",
    description: "Prendre soin de toi, physiquement.",
  },
  {
    id: crypto.randomUUID(),
    name: "Esprit",
    description: "Prendre soin de ta tête, de ton calme.",
  },
  {
    id: crypto.randomUUID(),
    name: "Cercle proche",
    description: "Prendre soin de tes proches — humains et animaux.",
  },
];

const defaultState = {
  profileName: "Julien",
  categories: defaultCategories,
  quests: [
    {
      id: crypto.randomUUID(),
      title: "Prendre une douche",
      xp: 15,
      categoryId: defaultCategories[1].id,
    },
    {
      id: crypto.randomUUID(),
      title: "Porter des vêtements propres et en bon état",
      xp: 10,
      categoryId: defaultCategories[1].id,
    },
    {
      id: crypto.randomUUID(),
      title: "Faire une action pour la maison",
      xp: 15,
      categoryId: defaultCategories[0].id,
    },
    {
      id: crypto.randomUUID(),
      title: "Créer un moment complice avec son·sa chéri·e",
      xp: 20,
      categoryId: defaultCategories[3].id,
    },
    {
      id: crypto.randomUUID(),
      title: "Manger au moins un repas équilibré",
      xp: 15,
      categoryId: defaultCategories[1].id,
    },
    {
      id: crypto.randomUUID(),
      title: "Faire une pause avant de lancer le PC",
      xp: 10,
      categoryId: defaultCategories[2].id,
    },
  ],
  days: {},
  reviews: {},
  backlog: [],
};

const TITLE_TO_CATEGORY = {
  "Prendre une douche": "Corps",
  "Porter des vêtements propres et en bon état": "Corps",
  "Faire une action pour la maison": "Le Foyer",
  "Créer un moment complice avec son·sa chéri·e": "Cercle proche",
  "Manger au moins un repas équilibré": "Corps",
  "Faire une pause avant de lancer le PC": "Esprit",
};

function migrateQuestCategories(quests, categories) {
  const idByName = (name) => categories.find((c) => c.name === name)?.id;
  const fallbackId = idByName("Corps");
  return quests.map((quest) => {
    if (quest.categoryId) return quest;
    const categoryName = TITLE_TO_CATEGORY[quest.title];
    return {
      ...quest,
      categoryId: (categoryName && idByName(categoryName)) || fallbackId,
    };
  });
}

let state = loadState();
let deferredInstallPrompt = null;
let journalPeriod = "today";
let journalCollapsed = false;
let expandedCategoryId = null;
let calendarMonth = new Date();
let viewedDayKey = null;
let viewedWeekKey = null;

function getMonthWeeks(monthDate) {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const firstDayNum = (firstOfMonth.getUTCDay() + 6) % 7; // lundi = 0
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(gridStart.getUTCDate() - firstDayNum);
  const lastOfMonth = new Date(Date.UTC(year, month + 1, 0));

  const weeks = [];
  let cursor = new Date(gridStart);
  let reachedEnd = false;
  while (!reachedEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      if (cursor.getTime() === lastOfMonth.getTime()) reachedEnd = true;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    const categories = saved.categories?.length
      ? saved.categories
      : structuredClone(defaultState.categories);
    const quests = saved.quests?.length
      ? saved.quests
      : structuredClone(defaultState.quests);
    return {
      ...structuredClone(defaultState),
      ...saved,
      categories,
      quests: migrateQuestCategories(quests, categories),
      days: saved.days || {},
      reviews: saved.reviews || {},
      backlog: saved.backlog || [],
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentDay() {
  const key = dateKey();
  if (!state.days[key]) {
    state.days[key] = { completed: [], initiative: "" };
  }
  return state.days[key];
}

function renderCategories() {
  const container = document.querySelector("#categoryList");
  container.innerHTML = "";
  const day = currentDay();

  state.categories.forEach((category) => {
    const categoryQuests = state.quests.filter(
      (q) => q.categoryId === category.id,
    );
    const info = levelInfo(categoryXp(state.days, state.quests, category.id));
    const isExpanded = expandedCategoryId === category.id;

    const card = document.createElement("div");
    card.className = `category-card ${isExpanded ? "expanded" : ""}`;

    const inner = document.createElement("div");
    inner.className = "category-card-inner";

    const header = document.createElement("button");
    header.type = "button";
    header.className = "category-header";
    header.innerHTML = `
  <div class="category-header-main">
    <span class="category-name">${escapeHtml(category.name)}</span>
    <div class="category-mini-progress">
      <div class="category-mini-progress-bar" style="width: ${info.percent}%"></div>
    </div>
  </div>
  <span class="category-level">Niv. ${info.level}</span>`;
    header.addEventListener("click", () => {
      expandedCategoryId = isExpanded ? null : category.id;
      renderCategories();
    });
    inner.appendChild(header);

    if (isExpanded) {
      const body = document.createElement("div");
      body.className = "category-body";
      body.innerHTML = `<p class="muted category-description">${escapeHtml(category.description)}</p>`;

      const list = document.createElement("div");
      list.className = "quest-list";
      categoryQuests.forEach((quest) => {
        const isDone = day.completed.includes(quest.id);
        const isBonusDone = (day.bonusCompleted || []).includes(quest.id);
        const label = document.createElement("label");
        label.className = `quest ${isDone ? "done" : ""}`;
        label.innerHTML = `
      <input type="checkbox" ${isDone ? "checked" : ""} aria-label="${escapeHtml(quest.title)}" />
      <span class="quest-title">${escapeHtml(quest.title)}</span>
      <span class="quest-xp">+${quest.xp} XP</span>`;
        label.querySelector("input").addEventListener("change", (event) => {
          const todayData = currentDay();
          if (event.target.checked) {
            if (!todayData.completed.includes(quest.id))
              todayData.completed.push(quest.id);
          } else {
            todayData.completed = todayData.completed.filter(
              (id) => id !== quest.id,
            );
            todayData.bonusCompleted = (todayData.bonusCompleted || []).filter(
              (id) => id !== quest.id,
            );
          }
          saveState();
          render();
        });
        list.appendChild(label);

        if (quest.bonusLabel && isDone) {
          const bonusLabel = document.createElement("label");
          bonusLabel.className = `quest quest-bonus ${isBonusDone ? "done" : ""}`;
          bonusLabel.innerHTML = `
      <input type="checkbox" ${isBonusDone ? "checked" : ""} aria-label="${escapeHtml(quest.bonusLabel)}" />
      <span class="quest-title">${escapeHtml(quest.bonusLabel)}</span>
      <span class="quest-xp">+${quest.bonusXp} XP</span>`;
          bonusLabel.querySelector("input").addEventListener("change", (event) => {
            const todayData = currentDay();
            if (!todayData.bonusCompleted) todayData.bonusCompleted = [];
            if (event.target.checked) {
              if (!todayData.bonusCompleted.includes(quest.id))
                todayData.bonusCompleted.push(quest.id);
            } else {
              todayData.bonusCompleted = todayData.bonusCompleted.filter(
                (id) => id !== quest.id,
              );
            }
            saveState();
            render();
          });
          list.appendChild(bonusLabel);
        }
      });

      body.appendChild(list);
      inner.appendChild(body);
    }

    card.appendChild(inner);
    container.appendChild(card);
  });
}

function render() {
  const today = new Date();
  document.querySelector("#todayLabel").textContent = today.toLocaleDateString(
    "fr-FR",
    { weekday: "long", day: "numeric", month: "long" },
  );
  document.querySelector("#playerTitle").textContent = state.profileName;
  const totalXp = getTotalXp(state.days, state.quests);
  document.querySelector("#totalXp").textContent = totalXp;
  const info = globalLevelInfo(
    totalSkillPoints(state.days, state.quests, state.categories),
  );
  document.querySelector("#levelValue").textContent = info.level;
  document.querySelector("#rankLabel").textContent = rankForLevel(info.level);
  document.querySelector("#xpLabel").textContent =
    `${info.current} / ${info.needed} montées de compétence`;
  document.querySelector("#nextLevelLabel").textContent =
    `${info.needed - info.current} montée(s) de compétence pour le niveau suivant`;
  document.querySelector("#xpBar").style.width = `${info.percent}%`;

  const day = currentDay();
  document.querySelector("#todayScore").textContent =
    `${day.completed.length}/${state.quests.length}`;
  document.querySelector("#activeDays").textContent = Object.values(
    state.days,
  ).filter((d) => (d.completed?.length || 0) > 0).length;

  renderCategories();

  document.querySelector("#initiativeNote").value = day.initiative || "";
  renderWeek();
  loadReview();
  renderBacklog();
  renderJournal();
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

    const percent = state.quests.length
      ? Math.round((count / state.quests.length) * 100)
      : 0;
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

  document.querySelector("#weekPercent").textContent = possible
    ? `${Math.round((completed / possible) * 100)} %`
    : "0 %";
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
    row.querySelector("input").addEventListener("change", (event) => {
      item.done = event.target.checked;
      saveState();
      renderBacklog();
    });
    row.querySelector("button").addEventListener("click", () => {
      state.backlog = state.backlog.filter((entry) => entry.id !== item.id);
      saveState();
      renderBacklog();
    });
    container.appendChild(row);
  };

  state.backlog.forEach((item) =>
    renderItem(item, item.done ? doneList : activeList),
  );

  doneSection.classList.toggle("hidden", doneList.children.length === 0);
}

function reviewKey(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = (d.getUTCDay() + 6) % 7; // lundi = 0
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // jeudi de cette semaine
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstThursdayDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - firstThursdayDayNum + 3,
  );
  const week = 1 + Math.round((d - firstThursday) / (7 * 86400000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function startOfIsoWeek(weekKey) {
  const [year, week] = weekKey.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayNum = (jan4.getUTCDay() + 6) % 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4DayNum + (week - 1) * 7);
  return monday;
}

function loadReview() {
  const review = state.reviews[reviewKey()] || {};
  document.querySelector("#proudInput").value = review.proud || "";
  document.querySelector("#obstacleInput").value = review.obstacle || "";
  document.querySelector("#priorityInput").value = review.priority || "";
}

function getPeriodStart(period) {
  const now = new Date();
  if (period === "month")
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  if (period === "year") return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - (period === "week" ? 7 : 0));
  return cutoff;
}

function dailyChronicleTitle(dateStr) {
  const date = new Date(dateStr);
  return `Chronique du ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

function weeklyChronicleTitle(mondayDateStr) {
  const monday = new Date(mondayDateStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const sameMonth = monday.getMonth() === sunday.getMonth();
  const mondayLabel = monday.toLocaleDateString(
    "fr-FR",
    sameMonth ? { day: "numeric" } : { day: "numeric", month: "long" },
  );
  const sundayLabel = sunday.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  return `Chronique du ${mondayLabel} au ${sundayLabel}`;
}

function periodChronicleTitle(period) {
  const now = new Date();
  if (period === "month") {
    const monthName = now.toLocaleDateString("fr-FR", { month: "long" });
    const prefix = /^[aeiouéèêëàâäîïôöûü]/i.test(monthName) ? "d'" : "de ";
    return `Chronique du mois ${prefix}${monthName}`;
  }
  return `Chronique de l'année ${now.getFullYear()}`;
}

function getPeriodSummary(period) {
  const cutoff = getPeriodStart(period);
  let activeDays = 0;
  let xp = 0;

  Object.entries(state.days).forEach(([key, day]) => {
    if (new Date(key) < cutoff) return;
    const completed = day.completed || [];
    if (completed.length) activeDays++;
    xp += completed.reduce((sum, id) => {
      const quest = state.quests.find((q) => q.id === id);
      return sum + (quest?.xp || 0);
    }, 0);
  });

  const reviewsCount = Object.keys(state.reviews).filter(
    (key) => startOfIsoWeek(key) >= cutoff,
  ).length;

  return { activeDays, xp, reviewsCount };
}

function renderJournal() {
  const list = document.querySelector("#journalList");
  list.classList.toggle("hidden", journalCollapsed);
  if (journalCollapsed) return;

  list.innerHTML = "";
  const item = document.createElement("div");
  item.className = "journal-entry";

  if (journalPeriod === "today") {
    const key = viewedDayKey || dateKey();
    const today = state.days[key] || { completed: [], initiative: "" };
    const backLink = viewedDayKey
      ? `<button type="button" class="text-btn journal-back-btn" data-back="today">← Revenir à aujourd'hui</button>`
      : "";
    if (today.initiative) {
      item.innerHTML = `
      ${backLink}
      <p class="journal-entry-title">${dailyChronicleTitle(key)}</p>
      <p>${escapeHtml(today.initiative)}</p>`;
    } else {
      item.innerHTML = `${backLink}<p class="muted">Rien à afficher pour ${viewedDayKey ? "ce jour" : "aujourd'hui"}.</p>`;
    }
  } else if (journalPeriod === "week") {
    const key = viewedWeekKey || reviewKey();
    const review = state.reviews[key];
    const backLink = viewedWeekKey
      ? `<button type="button" class="text-btn journal-back-btn" data-back="week">← Revenir à cette semaine</button>`
      : "";
    if (review) {
      item.innerHTML = `
      ${backLink}
      <p class="journal-entry-title">${weeklyChronicleTitle(startOfIsoWeek(key).toISOString().slice(0, 10))}</p>
      <p><strong>Fierté :</strong> ${escapeHtml(review.proud || "—")}</p>
      <p><strong>Obstacle :</strong> ${escapeHtml(review.obstacle || "—")}</p>
      <p><strong>Priorité :</strong> ${escapeHtml(review.priority || "—")}</p>`;
    } else {
      item.innerHTML = `${backLink}<p class="muted">Rien à afficher pour ${viewedWeekKey ? "cette semaine-là" : "cette semaine"}.</p>`;
    }
  } else {
    const summary = getPeriodSummary(journalPeriod);
    item.innerHTML = `
      <p class="journal-entry-title">${periodChronicleTitle(journalPeriod)}</p>
      <p>${summary.activeDays} jour(s) actif(s), ${summary.reviewsCount} bilan(s) hebdo, ${summary.xp} XP gagné.</p>`;
  }

  const todayBtn = document.querySelector(
    '.journal-filter-btn[data-period="today"]',
  );
  todayBtn.textContent = viewedDayKey
    ? new Date(viewedDayKey).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      })
    : "Aujourd'hui";

  const weekBtn = document.querySelector(
    '.journal-filter-btn[data-period="week"]',
  );
  weekBtn.textContent = viewedWeekKey
    ? `S${viewedWeekKey.split("-W")[1]}`
    : "1 semaine";

  list.appendChild(item);
}

function openQuestEditor() {
  const editor = document.querySelector("#categoryEditor");
  editor.innerHTML = "";
  state.categories.forEach((category) => {
    const group = addCategoryEditorGroup(category);
    const questContainer = group.querySelector(".category-quest-editor");
    state.quests
      .filter((q) => q.categoryId === category.id)
      .forEach((quest) => addEditorRow(quest, questContainer));
  });
  document.querySelector("#questDialog").showModal();
}

function renderPastJournalCalendar() {
  document.querySelector("#calendarMonthLabel").textContent =
    calendarMonth.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });

  const weeks = getMonthWeeks(calendarMonth);
  const month = calendarMonth.getUTCMonth();
  const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  let html = `<div class="calendar-grid">
    <div class="calendar-cell calendar-header"></div>
    ${weekdayLabels.map((d) => `<div class="calendar-cell calendar-header">${d}</div>`).join("")}`;

  weeks.forEach((week) => {
    const wKey = reviewKey(week[0]);
    const hasReview = Boolean(state.reviews[wKey]);
    const weekNum = wKey.split("-W")[1];
    html += `<button type="button" class="calendar-cell calendar-week ${hasReview ? "has-entry" : ""}" data-week-key="${wKey}" ${hasReview ? "" : "disabled"}>S${weekNum}</button>`;

    week.forEach((day) => {
      const inMonth = day.getUTCMonth() === month;
      const dKey = dateKey(day);
      const hasNote = inMonth && Boolean(state.days[dKey]?.initiative);
      html += `<button type="button" class="calendar-cell calendar-day ${inMonth ? "" : "outside"} ${hasNote ? "has-entry" : ""}" data-day-key="${dKey}" ${hasNote ? "" : "disabled"}>${day.getUTCDate()}</button>`;
    });
  });

  html += `</div>`;
  document.querySelector("#pastJournalCalendar").innerHTML = html;
}

function addCategoryEditorGroup(
  category = { id: crypto.randomUUID(), name: "", description: "" },
) {
  const group = document.createElement("div");
  group.className = "category-editor-group";
  group.dataset.id = category.id;
  group.innerHTML = `
    <div class="row between">
      <input type="text" class="category-name-input" value="${escapeHtml(category.name)}" placeholder="Nom de la catégorie" />
      <button type="button" class="danger delete-category-btn">Supprimer la catégorie</button>
    </div>
    <textarea class="category-description-input" rows="2" placeholder="Description de la catégorie">${escapeHtml(category.description)}</textarea>
    <div class="category-quest-editor"></div>
    <button type="button" class="secondary add-quest-to-category-btn">Ajouter une quête</button>`;

  group
    .querySelector(".delete-category-btn")
    .addEventListener("click", () => group.remove());
  group
    .querySelector(".add-quest-to-category-btn")
    .addEventListener("click", () => {
      addEditorRow(undefined, group.querySelector(".category-quest-editor"));
    });

  document.querySelector("#categoryEditor").appendChild(group);
  return group;
}

function addEditorRow(
  quest = {
    id: crypto.randomUUID(),
    title: "",
    xp: 10,
    bonusLabel: "",
    bonusXp: 0,
  },
  container,
) {
  const row = document.createElement("div");
  row.className = "editor-row";
  row.dataset.id = quest.id;
  row.innerHTML = `
    <div class="editor-row-main">
      <input type="text" class="quest-title-input" value="${escapeHtml(quest.title)}" placeholder="Nom de la quête" />
      <input type="number" class="quest-xp-input" min="1" max="100" value="${quest.xp}" aria-label="Points d'expérience" />
      <button type="button" class="danger">Supprimer</button>
    </div>
    <div class="editor-row-bonus">
      <input type="text" class="quest-bonus-label-input" value="${escapeHtml(quest.bonusLabel || "")}" placeholder="Bonus (optionnel)" />
      <input type="number" class="quest-bonus-xp-input" min="0" max="100" value="${quest.bonusXp || 0}" aria-label="XP bonus" />
    </div>`;
  row.querySelector("button").addEventListener("click", () => row.remove());
  container.appendChild(row);
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

document.querySelector("#profileForm").addEventListener("submit", (event) => {
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
  currentDay().initiative = document
    .querySelector("#initiativeNote")
    .value.trim();
  saveState();
  renderJournal();
  const feedback = document.querySelector("#noteSaved");
  feedback.classList.remove("hidden");
  setTimeout(() => feedback.classList.add("hidden"), 1600);
});

document.querySelector("#backlogForm").addEventListener("submit", (event) => {
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
    priority: document.querySelector("#priorityInput").value.trim(),
  };
  saveState();
  renderJournal();
  const feedback = document.querySelector("#reviewSaved");
  feedback.classList.remove("hidden");
  setTimeout(() => feedback.classList.add("hidden"), 1600);
});

document.querySelectorAll(".journal-filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const alreadyActive = btn.classList.contains("active");

    if (alreadyActive) {
      journalCollapsed = !journalCollapsed;
    } else {
      document
        .querySelectorAll(".journal-filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      journalPeriod = btn.dataset.period;
      journalCollapsed = false;
      viewedDayKey = null;
      viewedWeekKey = null;
    }

    renderJournal();
  });
});

document
  .querySelector("#editQuestsBtn")
  .addEventListener("click", openQuestEditor);
document
  .querySelector("#addCategoryBtn")
  .addEventListener("click", () => addCategoryEditorGroup());

document.querySelector("#saveQuestsBtn").addEventListener("click", (event) => {
  event.preventDefault();
  const groups = [...document.querySelectorAll(".category-editor-group")];

  const categories = groups
    .map((group) => ({
      id: group.dataset.id,
      name: group.querySelector(".category-name-input").value.trim(),
      description: group
        .querySelector(".category-description-input")
        .value.trim(),
    }))
    .filter((c) => c.name);

  if (!categories.length) {
    alert("Il faut conserver au moins une catégorie.");
    return;
  }

  const quests = [];
  groups.forEach((group) => {
    const categoryId = group.dataset.id;
    if (!categories.some((c) => c.id === categoryId)) return;
    group.querySelectorAll(".editor-row").forEach((row) => {
      const title = row.querySelector(".quest-title-input").value.trim();
      if (!title) return;
      const bonusLabel = row
        .querySelector(".quest-bonus-label-input")
        .value.trim();
      const bonusXp =
        Number(row.querySelector(".quest-bonus-xp-input").value) || 0;
      quests.push({
        id: row.dataset.id,
        title,
        xp: Math.max(
          1,
          Number(row.querySelector(".quest-xp-input").value) || 10,
        ),
        categoryId,
        ...(bonusLabel ? { bonusLabel, bonusXp: Math.max(0, bonusXp) } : {}),
      });
    });
  });

  if (!quests.length) {
    alert("Il faut conserver au moins une quête.");
    return;
  }

  state.categories = categories;
  state.quests = quests;
  Object.values(state.days).forEach((day) => {
    day.completed = (day.completed || []).filter((id) =>
      state.quests.some((q) => q.id === id),
    );
  });
  saveState();
  document.querySelector("#questDialog").close();
  render();
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
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

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector("#installBtn").classList.remove("hidden");
});

document.querySelector("#installBtn").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.querySelector("#installBtn").classList.add("hidden");
});

document.querySelector("#pastJournalBtn").addEventListener("click", () => {
  calendarMonth = new Date();
  renderPastJournalCalendar();
  document.querySelector("#pastJournalDialog").showModal();
});

document.querySelector("#closePastJournalBtn").addEventListener("click", () => {
  document.querySelector("#pastJournalDialog").close();
});

document.querySelector("#prevMonthBtn").addEventListener("click", () => {
  calendarMonth.setUTCMonth(calendarMonth.getUTCMonth() - 1);
  renderPastJournalCalendar();
});

document.querySelector("#nextMonthBtn").addEventListener("click", () => {
  calendarMonth.setUTCMonth(calendarMonth.getUTCMonth() + 1);
  renderPastJournalCalendar();
});

document
  .querySelector("#pastJournalCalendar")
  .addEventListener("click", (event) => {
    const dayBtn = event.target.closest(".calendar-day");
    if (dayBtn && !dayBtn.disabled) {
      viewedDayKey = dayBtn.dataset.dayKey;
      viewedWeekKey = null;
      journalPeriod = "today";
      journalCollapsed = false;
      document
        .querySelectorAll(".journal-filter-btn")
        .forEach((b) =>
          b.classList.toggle("active", b.dataset.period === "today"),
        );
      document.querySelector("#pastJournalDialog").close();
      renderJournal();
      return;
    }

    const weekBtn = event.target.closest(".calendar-week");
    if (weekBtn && !weekBtn.disabled) {
      viewedWeekKey = weekBtn.dataset.weekKey;
      viewedDayKey = null;
      journalPeriod = "week";
      journalCollapsed = false;
      document
        .querySelectorAll(".journal-filter-btn")
        .forEach((b) =>
          b.classList.toggle("active", b.dataset.period === "week"),
        );
      document.querySelector("#pastJournalDialog").close();
      renderJournal();
    }
  });

document.querySelector("#journalList").addEventListener("click", (event) => {
  const backBtn = event.target.closest(".journal-back-btn");
  if (!backBtn) return;
  if (backBtn.dataset.back === "today") viewedDayKey = null;
  if (backBtn.dataset.back === "week") viewedWeekKey = null;
  renderJournal();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(console.error);
  });
}

render();

function numberButtons() {
  document.querySelectorAll("button").forEach((btn, index) => {
    btn.dataset.btnVariant = index % 10;
  });
}

numberButtons();
new MutationObserver(numberButtons).observe(document.body, {
  childList: true,
  subtree: true,
});
