# Storage Architecture

## Where data is stored

Daily Turtle is a fully static app (HTML/CSS/JS, no backend). All user
data is stored in the browser's `localStorage`, under a single key:

```js
const STORAGE_KEY = "julien-rpg-tracker-v1";
```

The entire application state is serialized as one JSON object and written
to that key (`js/app.js`, `saveState()`), then read back and parsed on
load (`loadState()`). There is no server, no database, no sync between
devices — everything lives in the browser that created it.

## Static vs. dynamic data

The state object mixes two kinds of data:

**Configuration data** — set up once, rarely changed by the user, but
still stored (not hardcoded), since the user can edit it:
- `profileName` — the player's display name
- `categories` — the life areas quests are grouped into (e.g. "Le Foyer",
  "Corps")
- `quests` — the list of available daily quests, each tied to a category
  and worth a fixed amount of XP

**Generated data** — grows continuously as the user interacts with the
app day to day:
- `days` — a map keyed by date (`YYYY-MM-DD`), each entry tracking which
  quests were completed that day and an optional "initiative" note
- `reviews` — a map keyed by period (week/month), storing retrospective
  answers (`proud`, `obstacle`, `priority`)
- `backlog` — a flat list of freeform ideas noted in "La carapace à
  idées", each with a `done` flag

## Why localStorage

This choice follows directly from the project's current constraints:
- The app is deployed as a static site on GitHub Pages — no backend means
  no server-side storage option.
- Daily Turtle is currently a personal tracker with no accounts or
  authentication, so `localStorage` fits its present scope well.
- It keeps data entirely on the user's device, which suits a personal
  journal-style app.
- It works offline, which matters since the app is also installable as a
  PWA (see `manifest.json` / `sw.js`).

**Trade-off**: data doesn't sync across browsers or devices, and clearing
site data (or switching browsers) resets the app to `defaultState`. This
is an accepted limitation for now — if the app were to support multiple
users or accounts in the future, this storage approach would need to be
revisited entirely (e.g. a real backend with per-user data).

## Loading and migration

`loadState()` doesn't just read the stored JSON as-is — it merges it with
`defaultState` and runs `migrateQuestCategories()`, which backfills a
`categoryId` on any quest that predates the category system (matching by
title against a legacy `TITLE_TO_CATEGORY` map, falling back to "Corps").
This lets old saved states, created before categories existed, keep
working without the user losing their data.