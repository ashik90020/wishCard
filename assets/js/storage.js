/**
 * Storage Module
 * Handles all LocalStorage operations.
 * Wraps read/write operations for easy future migration to an API.
 */

const STORAGE_KEYS = {
  CARD_STATE:     'wishly_card_state',
  FAVORITES_T:    'wishly_favorites_templates',
  FAVORITES_W:    'wishly_favorites_wishes',
  RECENT_OCCI:    'wishly_recent_occasions',
  RECENT_TMPL:    'wishly_recent_templates',
  RECENT_MSGS:    'wishly_recent_messages',
  EDITOR_HISTORY: 'wishly_editor_history',
  PREFERENCES:    'wishly_preferences',
};

const MAX_RECENT = 6;

/** Safe JSON parse with fallback */
function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Safe JSON stringify write */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Remove a key */
function storageRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

// ── Card State (the full in-progress card) ─────────────────────────────────

/**
 * Save the full card creation state.
 * @param {object} state
 */
function saveCardState(state) {
  storageSet(STORAGE_KEYS.CARD_STATE, { ...state, savedAt: Date.now() });
}

/**
 * Load saved card state.
 * @returns {object|null}
 */
function loadCardState() {
  return storageGet(STORAGE_KEYS.CARD_STATE, null);
}

/** Clear saved card state (start fresh). */
function clearCardState() {
  storageRemove(STORAGE_KEYS.CARD_STATE);
}

/** Check if a saved card state exists (less than 24 hours old). */
function hasSavedCard() {
  const state = loadCardState();
  if (!state || !state.savedAt) return false;
  const ageMs = Date.now() - state.savedAt;
  return ageMs < 24 * 60 * 60 * 1000; // 24 hours
}

// ── Favorites ──────────────────────────────────────────────────────────────

/** Toggle a template favorite. Returns new favorite status (true/false). */
function toggleFavoriteTemplate(templateId) {
  const favs = storageGet(STORAGE_KEYS.FAVORITES_T, []);
  const idx = favs.indexOf(templateId);
  if (idx === -1) {
    favs.unshift(templateId);
  } else {
    favs.splice(idx, 1);
  }
  storageSet(STORAGE_KEYS.FAVORITES_T, favs);
  return idx === -1; // true if now favorited
}

/** Check if a template is favorited. */
function isTemplateFavorited(templateId) {
  const favs = storageGet(STORAGE_KEYS.FAVORITES_T, []);
  return favs.includes(templateId);
}

/** Get all favorited template IDs. */
function getFavoriteTemplateIds() {
  return storageGet(STORAGE_KEYS.FAVORITES_T, []);
}

/** Toggle a wish favorite. Returns new favorite status. */
function toggleFavoriteWish(wishId) {
  const favs = storageGet(STORAGE_KEYS.FAVORITES_W, []);
  const idx = favs.indexOf(wishId);
  if (idx === -1) {
    favs.unshift(wishId);
  } else {
    favs.splice(idx, 1);
  }
  storageSet(STORAGE_KEYS.FAVORITES_W, favs);
  return idx === -1;
}

/** Check if a wish is favorited. */
function isWishFavorited(wishId) {
  return storageGet(STORAGE_KEYS.FAVORITES_W, []).includes(wishId);
}

/** Get all favorited wish IDs. */
function getFavoriteWishIds() {
  return storageGet(STORAGE_KEYS.FAVORITES_W, []);
}

// ── Recently Used ──────────────────────────────────────────────────────────

/**
 * Add an occasion to recent list.
 * @param {string} occasionId
 */
function addRecentOccasion(occasionId) {
  let recent = storageGet(STORAGE_KEYS.RECENT_OCCI, []);
  recent = recent.filter(id => id !== occasionId);
  recent.unshift(occasionId);
  storageSet(STORAGE_KEYS.RECENT_OCCI, recent.slice(0, MAX_RECENT));
}

function getRecentOccasions() {
  return storageGet(STORAGE_KEYS.RECENT_OCCI, []);
}

/**
 * Add a template to recent list.
 * @param {string} templateId
 */
function addRecentTemplate(templateId) {
  let recent = storageGet(STORAGE_KEYS.RECENT_TMPL, []);
  recent = recent.filter(id => id !== templateId);
  recent.unshift(templateId);
  storageSet(STORAGE_KEYS.RECENT_TMPL, recent.slice(0, MAX_RECENT));
}

function getRecentTemplates() {
  return storageGet(STORAGE_KEYS.RECENT_TMPL, []);
}

/**
 * Add a message to recent list.
 * @param {string} wishId
 */
function addRecentMessage(wishId) {
  let recent = storageGet(STORAGE_KEYS.RECENT_MSGS, []);
  recent = recent.filter(id => id !== wishId);
  recent.unshift(wishId);
  storageSet(STORAGE_KEYS.RECENT_MSGS, recent.slice(0, MAX_RECENT));
}

function getRecentMessages() {
  return storageGet(STORAGE_KEYS.RECENT_MSGS, []);
}

// ── Editor History (Undo/Redo) ─────────────────────────────────────────────

const MAX_HISTORY_SIZE = 30;

/**
 * Save editor history snapshot to localStorage.
 * @param {Array} history - Array of state snapshots
 * @param {number} pointer - Current position in history
 */
function saveEditorHistory(history, pointer) {
  try {
    // Store only the last MAX_HISTORY_SIZE items to keep storage lean
    const trimmed = history.slice(-MAX_HISTORY_SIZE);
    storageSet(STORAGE_KEYS.EDITOR_HISTORY, { history: trimmed, pointer });
  } catch {}
}

function loadEditorHistory() {
  return storageGet(STORAGE_KEYS.EDITOR_HISTORY, { history: [], pointer: -1 });
}

// ── Preferences ────────────────────────────────────────────────────────────

function getPreference(key, fallback = null) {
  const prefs = storageGet(STORAGE_KEYS.PREFERENCES, {});
  return key in prefs ? prefs[key] : fallback;
}

function setPreference(key, value) {
  const prefs = storageGet(STORAGE_KEYS.PREFERENCES, {});
  prefs[key] = value;
  storageSet(STORAGE_KEYS.PREFERENCES, prefs);
}

// ── Full Reset ─────────────────────────────────────────────────────────────

function clearAllAppData() {
  Object.values(STORAGE_KEYS).forEach(key => storageRemove(key));
}
