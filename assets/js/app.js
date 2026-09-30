/**
 * app.js — Wishly Core Application
 * Shared utilities, toast system, navigation, and global state.
 */

// ── Global App State ──────────────────────────────────────────────────────
const AppState = {
  // Card creation flow state
  currentStep: 1,
  totalSteps: 6,
  selectedOccasion: null,    // occasion object
  selectedTemplate: null,    // template object (cloned)
  recipientName: '',
  senderName: '',
  selectedDate: '',
  selectedWish: null,        // wish object
  customMessage: '',

  /** Update and persist state */
  update(patch) {
    Object.assign(this, patch);
    saveCardState(this.toJSON());
  },

  /** Serialize for storage */
  toJSON() {
    return {
      currentStep:      this.currentStep,
      selectedOccasion: this.selectedOccasion,
      selectedTemplate: this.selectedTemplate,
      recipientName:    this.recipientName,
      senderName:       this.senderName,
      selectedDate:     this.selectedDate,
      selectedWish:     this.selectedWish,
      customMessage:    this.customMessage,
    };
  },

  /** Restore from storage */
  restore(data) {
    Object.assign(this, data);
  },

  /** Reset to defaults */
  reset() {
    this.currentStep     = 1;
    this.selectedOccasion = null;
    this.selectedTemplate = null;
    this.recipientName   = '';
    this.senderName      = '';
    this.selectedDate    = '';
    this.selectedWish    = null;
    this.customMessage   = '';
    clearCardState();
  },
};

// ── Toast Notification System ─────────────────────────────────────────────

const TOAST_ICONS = {
  success: 'bi-check-circle-fill',
  error:   'bi-x-circle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info:    'bi-info-circle-fill',
};

const TOAST_COLORS = {
  success: '#10B981',
  error:   '#EF4444',
  warning: '#F59E0B',
  info:    '#7C3AED',
};

let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container-custom';
    toastContainer.id = 'toastContainer';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration - ms before auto-dismiss
 */
function showToast(message, type = 'info', duration = 3200) {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `
    <i class="bi ${TOAST_ICONS[type] || 'bi-info-circle-fill'}" style="color:${TOAST_COLORS[type]};font-size:1.2rem;flex-shrink:0"></i>
    <span style="flex:1">${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  const remove = () => {
    toast.style.animation = 'toastOut 0.25s ease forwards';
    setTimeout(() => toast.remove(), 260);
  };

  const timer = setTimeout(remove, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

// ── Navigation Utilities ───────────────────────────────────────────────────

/**
 * Navigate to a page, optionally updating AppState first.
 * @param {string} url
 * @param {object} stateUpdate
 */
function navigateTo(url, stateUpdate = {}) {
  if (Object.keys(stateUpdate).length) {
    AppState.update(stateUpdate);
  }
  window.location.href = url;
}

/** Highlight the active bottom nav item based on current page. */
function initBottomNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bottom-nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

// ── Step Bar ──────────────────────────────────────────────────────────────

const STEP_LABELS = [
  { title: 'Choose Occasion',   short: 'Occasion' },
  { title: 'Choose Design',     short: 'Design' },
  { title: 'Your Details',      short: 'Details' },
  { title: 'Choose a Message',  short: 'Message' },
  { title: 'Customize Card',    short: 'Customize' },
  { title: 'Preview & Download',short: 'Finish' },
];

/**
 * Initialize step progress bar.
 * @param {number} step - 1-indexed current step
 */
function initStepBar(step) {
  AppState.currentStep = step;
  const bar = document.querySelector('.step-bar');
  if (!bar) return;

  const label  = bar.querySelector('.step-label');
  const title  = bar.querySelector('.step-title');
  const fill   = bar.querySelector('.step-progress-fill');
  const backBtn = bar.querySelector('.step-back-btn');

  const info = STEP_LABELS[step - 1] || { title: 'Step', short: 'Step' };

  if (label) label.textContent = `Step ${step} of ${AppState.totalSteps}`;
  if (title) title.textContent = info.title;
  if (fill)  fill.style.width  = `${(step / AppState.totalSteps) * 100}%`;

  if (backBtn) {
    backBtn.addEventListener('click', () => history.back());
    if (step === 1) backBtn.style.visibility = 'hidden';
  }
}

// ── Offcanvas / Bottom Sheet Helpers ─────────────────────────────────────

/**
 * Open a Bootstrap offcanvas by its ID.
 * @param {string} id
 */
function openSheet(id) {
  const el = document.getElementById(id);
  if (!el) return;
  bootstrap.Offcanvas.getOrCreateInstance(el).show();
}

/**
 * Close a Bootstrap offcanvas by its ID.
 * @param {string} id
 */
function closeSheet(id) {
  const el = document.getElementById(id);
  if (!el) return;
  bootstrap.Offcanvas.getInstance(el)?.hide();
}

// ── Chip Filter Helper ────────────────────────────────────────────────────

/**
 * Initialize horizontal filter chips.
 * @param {string} containerSelector - CSS selector for chip container
 * @param {Function} onChange - Called with the active chip's data-value
 */
function initChips(containerSelector, onChange) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    if (typeof onChange === 'function') {
      onChange(chip.dataset.value || chip.textContent.trim().toLowerCase());
    }
  });
}

// ── Search Helper ─────────────────────────────────────────────────────────

/**
 * Attach live search to an input.
 * @param {string} inputSelector
 * @param {Function} onSearch - Called with trimmed query string
 * @param {number} debounceMs
 */
function initSearch(inputSelector, onSearch, debounceMs = 250) {
  const input = document.querySelector(inputSelector);
  if (!input) return;

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => onSearch(input.value.trim()), debounceMs);
  });
}

// ── Utility Functions ─────────────────────────────────────────────────────

/**
 * Escape HTML to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Clamp a number between min and max.
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Debounce a function.
 */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/**
 * Compress an image file to a smaller size (for mobile uploads).
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} quality
 * @returns {Promise<string>} - dataURL
 */
function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Format a date string as a readable date.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Generate a linear gradient CSS string from two colors.
 */
function gradientCSS(colors, angle = 135) {
  if (!colors || !colors.length) return '#333';
  if (colors.length === 1) return colors[0];
  return `linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
}

// ── "Continue Previous Card?" Banner ─────────────────────────────────────

function checkAndShowContinueBanner() {
  if (!hasSavedCard()) return;
  const saved = loadCardState();
  if (!saved || !saved.selectedOccasion) return;

  const banner = document.getElementById('continueBanner');
  if (!banner) return;

  banner.classList.remove('d-none');

  document.getElementById('btnContinueCard')?.addEventListener('click', () => {
    AppState.restore(saved);
    const step = saved.currentStep || 1;
    const PAGE_MAP = {
      1: 'occasions.html',
      2: 'templates.html',
      3: 'details.html',
      4: 'details.html', // message selection is in details flow
      5: 'editor.html',
      6: 'preview.html',
    };
    window.location.href = PAGE_MAP[step] || 'occasions.html';
  });

  document.getElementById('btnStartNew')?.addEventListener('click', () => {
    AppState.reset();
    banner.classList.add('d-none');
  });
}

// ── Day / Night Mode Theme Manager ───────────────────────────────────────

/**
 * Get the currently active or saved theme ('dark' or 'light').
 */
function getCurrentTheme() {
  const saved = localStorage.getItem('wishly_theme') || getPreference('theme');
  if (saved) return saved;
  // Default to system preference if available, else 'dark'
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

/**
 * Apply the specified theme ('dark' or 'light') to the document.
 * @param {string} theme
 * @param {boolean} showToastNotice
 */
function applyTheme(theme, showToastNotice = false) {
  const active = (theme === 'light') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', active);
  localStorage.setItem('wishly_theme', active);
  setPreference('theme', active);

  // Update mobile status bar theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', active === 'light' ? '#F8FAFC' : '#0F0A1E');
  }

  // Update theme toggle buttons across the UI
  document.querySelectorAll('#btnThemeToggle, .theme-toggle-btn').forEach(btn => {
    btn.setAttribute('aria-label', active === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode');
    btn.setAttribute('title', active === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode');
    btn.innerHTML = active === 'light'
      ? '<i class="bi bi-moon-stars-fill" style="color:var(--primary)"></i>'
      : '<i class="bi bi-sun-fill" style="color:var(--secondary)"></i>';
  });

  // Update side menu badge if present
  const sideBadge = document.getElementById('sideThemeBadge');
  if (sideBadge) {
    sideBadge.textContent = active === 'light' ? 'Day Mode ☀️' : 'Night Mode 🌙';
    sideBadge.className = active === 'light'
      ? 'badge rounded-pill bg-warning text-dark'
      : 'badge rounded-pill bg-purple-soft';
  }

  if (showToastNotice && typeof showToast === 'function') {
    showToast(active === 'light' ? 'Switched to Day Mode ☀️' : 'Switched to Night Mode 🌙', 'info');
  }
}

/**
 * Toggle between Day and Night modes.
 */
function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next, true);
}

/**
 * Initialize theme listeners.
 */
function initTheme() {
  // Apply saved theme immediately
  applyTheme(getCurrentTheme(), false);

  // Bind click handlers to all theme toggles
  document.querySelectorAll('#btnThemeToggle, .theme-toggle-btn, #sideThemeToggle').forEach(el => {
    // Avoid double attaching
    if (el.dataset.themeBound) return;
    el.dataset.themeBound = 'true';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });

  // Listen for system theme changes if user hasn't explicitly set one in this session
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('wishly_theme')) {
        applyTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  }
}

// ── DOMContentLoaded Initializer ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initBottomNav();
  checkAndShowContinueBanner();
});
