/**
 * Occasions Data Module
 * Contains all available card occasions with metadata.
 * Designed to be easily replaced by a Laravel API endpoint later.
 */

const OCCASIONS = [
  // --- Love & Relationships ---
  { id: 'birthday',      name: 'Birthday',           icon: 'bi-cake2',           category: ['popular','celebration'],  designCount: 48, color: '#FF6B9D' },
  { id: 'wedding',       name: 'Wedding',             icon: 'bi-heart-fill',      category: ['popular','love'],         designCount: 42, color: '#C084FC' },
  { id: 'anniversary',   name: 'Anniversary',         icon: 'bi-hearts',          category: ['popular','love'],         designCount: 36, color: '#F472B6' },
  { id: 'engagement',    name: 'Engagement',          icon: 'bi-gem',             category: ['love'],                   designCount: 30, color: '#E879F9' },
  { id: 'valentine',     name: "Valentine's Day",     icon: 'bi-balloon-heart',   category: ['popular','love'],         designCount: 38, color: '#FB7185' },
  { id: 'friendship',    name: 'Friendship',          icon: 'bi-people-fill',     category: ['popular','family'],       designCount: 28, color: '#38BDF8' },

  // --- Family ---
  { id: 'mother',        name: "Mother's Day",        icon: 'bi-flower1',         category: ['popular','family'],       designCount: 32, color: '#FB923C' },
  { id: 'father',        name: "Father's Day",        icon: 'bi-star-fill',       category: ['family'],                 designCount: 28, color: '#60A5FA' },
  { id: 'newbaby',       name: 'New Baby',             icon: 'bi-emoji-smile',     category: ['celebration','family'],   designCount: 30, color: '#86EFAC' },
  { id: 'babyshower',   name: 'Baby Shower',          icon: 'bi-gift',            category: ['celebration','family'],   designCount: 26, color: '#FCA5A5' },

  // --- Achievement ---
  { id: 'graduation',    name: 'Graduation',          icon: 'bi-mortarboard-fill',category: ['popular','celebration'],  designCount: 34, color: '#FBBF24' },
  { id: 'promotion',     name: 'Promotion',           icon: 'bi-graph-up-arrow',  category: ['celebration'],            designCount: 22, color: '#34D399' },
  { id: 'congratulations', name: 'Congratulations',  icon: 'bi-trophy-fill',     category: ['popular','celebration'],  designCount: 36, color: '#F59E0B' },
  { id: 'retirement',    name: 'Retirement',          icon: 'bi-sunset-fill',     category: ['celebration'],            designCount: 20, color: '#A78BFA' },

  // --- Holidays & Religious ---
  { id: 'eid',           name: 'Eid',                 icon: 'bi-moon-stars-fill', category: ['popular','religious'],    designCount: 40, color: '#10B981' },
  { id: 'christmas',     name: 'Christmas',           icon: 'bi-snow',            category: ['popular','celebration'],  designCount: 44, color: '#EF4444' },
  { id: 'newyear',       name: 'New Year',            icon: 'bi-stars',           category: ['popular','celebration'],  designCount: 38, color: '#8B5CF6' },

  // --- Education ---
  { id: 'teacher',       name: "Teacher's Day",       icon: 'bi-book-fill',       category: ['celebration'],            designCount: 24, color: '#059669' },

  // --- Occasions ---
  { id: 'thankyou',      name: 'Thank You',           icon: 'bi-hand-thumbs-up-fill', category: ['popular'],            designCount: 30, color: '#14B8A6' },
  { id: 'bestwishes',    name: 'Best Wishes',         icon: 'bi-stars',           category: ['popular'],               designCount: 28, color: '#F59E0B' },
  { id: 'goodluck',      name: 'Good Luck',           icon: 'bi-lightning-fill',  category: ['popular'],               designCount: 26, color: '#84CC16' },
  { id: 'getwell',       name: 'Get Well Soon',       icon: 'bi-heart-pulse-fill',category: ['popular'],               designCount: 22, color: '#F87171' },
  { id: 'sorry',         name: 'Sorry',               icon: 'bi-emoji-expressionless', category: [],                   designCount: 18, color: '#94A3B8' },
  { id: 'farewell',      name: 'Farewell',            icon: 'bi-airplane-fill',   category: ['celebration'],            designCount: 20, color: '#64748B' },
  { id: 'housewarming',  name: 'Housewarming',        icon: 'bi-house-heart-fill',category: ['celebration'],            designCount: 18, color: '#F97316' },
  { id: 'other',         name: 'Other',               icon: 'bi-three-dots',      category: [],                        designCount: 50, color: '#6B7280' },
];

/** Flat category list for filter chips */
const OCCASION_CATEGORIES = [
  { id: 'all',         label: 'All' },
  { id: 'popular',     label: 'Popular' },
  { id: 'love',        label: 'Love' },
  { id: 'family',      label: 'Family' },
  { id: 'celebration', label: 'Celebration' },
  { id: 'religious',   label: 'Religious' },
];

/**
 * Get occasions filtered by category.
 * @param {string} category - Category ID or 'all'
 * @returns {Array}
 */
function getOccasionsByCategory(category) {
  if (category === 'all') return OCCASIONS;
  return OCCASIONS.filter(o => o.category.includes(category));
}

/**
 * Search occasions by name.
 * @param {string} query
 * @returns {Array}
 */
function searchOccasions(query) {
  const q = query.toLowerCase().trim();
  if (!q) return OCCASIONS;
  return OCCASIONS.filter(o => o.name.toLowerCase().includes(q));
}

/**
 * Get a single occasion by ID.
 * @param {string} id
 * @returns {object|null}
 */
function getOccasionById(id) {
  return OCCASIONS.find(o => o.id === id) || null;
}
