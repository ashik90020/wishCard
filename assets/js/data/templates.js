/**
 * Templates Data Module
 * Defines all card templates. Each template specifies editable elements,
 * visual design parameters, and metadata.
 * Structured for easy Laravel API replacement later.
 */

/**
 * Template category filter chips
 */
const TEMPLATE_CATEGORIES = [
  { id: 'all',         label: 'All' },
  { id: 'elegant',     label: 'Elegant' },
  { id: 'romantic',    label: 'Romantic' },
  { id: 'cute',        label: 'Cute' },
  { id: 'modern',      label: 'Modern' },
  { id: 'funny',       label: 'Funny' },
  { id: 'luxury',      label: 'Luxury' },
  { id: 'floral',      label: 'Floral' },
  { id: 'traditional', label: 'Traditional' },
  { id: 'minimal',     label: 'Minimal' },
];

/**
 * Template element types
 */
const ELEMENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  SHAPE: 'shape',
  EMOJI: 'emoji',
  DECORATION: 'decoration', // locked by default
};

/**
 * Generate gradient backgrounds for templates
 */
const GRADIENTS = {
  birthday:      [['#FF6B9D','#C850C0'], ['#FF9A9E','#FECFEF'], ['#F7971E','#FFD200'], ['#F953C6','#B91D73'], ['#4776E6','#8E54E9']],
  wedding:       [['#C9D6FF','#E2E2E2'], ['#f093fb','#f5576c'], ['#D4A5A5','#3D5A80'], ['#e0c3fc','#8ec5fc'], ['#E8E0F7','#C8A2C8']],
  anniversary:   [['#D38312','#A83279'], ['#f7797d','#FBD786'], ['#ee0979','#ff6a00'], ['#c94b4b','#4b134f'], ['#F9D976','#F39F86']],
  engagement:    [['#E879F9','#7C3AED'], ['#f9a8d4','#e879f9'], ['#c084fc','#818cf8'], ['#F3ABFF','#B680F3'], ['#E0B0FF','#6A5ACD']],
  valentine:     [['#FB7185','#F43F5E'], ['#ffecd2','#fcb69f'], ['#f77062','#fe5196'], ['#FFC0CB','#FF1493'], ['#FFB6C1','#FF69B4']],
  friendship:    [['#38BDF8','#818CF8'], ['#a8edea','#fed6e3'], ['#96deda','#50c9c3'], ['#84FAB0','#8FD3F4'], ['#FCCB90','#D57EEB']],
  mother:        [['#FB923C','#F472B6'], ['#ffeaa7','#dfe6e9'], ['#f8cdda','#1d2b64'], ['#FFD1DC','#FF85A2'], ['#FDDB92','#D1FDFF']],
  father:        [['#60A5FA','#1E3A8A'], ['#36d1dc','#5b86e5'], ['#2193b0','#6dd5ed'], ['#1a1a2e','#16213e'], ['#0f2027','#203a43']],
  newbaby:       [['#86EFAC','#6EE7F7'], ['#a8edea','#fed6e3'], ['#d9afd9','#97d9e1'], ['#FCCB90','#D57EEB'], ['#96fbc4','#f9f586']],
  babyshower:    [['#FCA5A5','#FECDD3'], ['#fbc2eb','#a6c1ee'], ['#ffdde1','#ee9ca7'], ['#FDDB92','#D1FDFF'], ['#e0c3fc','#8ec5fc']],
  graduation:    [['#FBBF24','#D97706'], ['#f6d365','#fda085'], ['#f5af19','#f12711'], ['#FFD700','#FFA500'], ['#FDB99B','#F3793B']],
  promotion:     [['#34D399','#059669'], ['#a8ff78','#78ffd6'], ['#11998e','#38ef7d'], ['#56ab2f','#a8e063'], ['#c6ffdd','#f7797d']],
  congratulations:[['#F59E0B','#EF4444'], ['#f5af19','#f12711'], ['#f7971e','#ffd200'], ['#FF6B6B','#FFE66D'], ['#FDC830','#F37335']],
  retirement:    [['#A78BFA','#8B5CF6'], ['#c471ed','#f64f59'], ['#7F7FD5','#91EAE4'], ['#C9FFBF','#FFAFBD'], ['#de6161','#2657eb']],
  eid:           [['#10B981','#059669'], ['#43e97b','#38f9d7'], ['#11998e','#38ef7d'], ['#1D8348','#2ECC71'], ['#00b09b','#96c93d']],
  christmas:     [['#EF4444','#15803D'], ['#c94b4b','#4b134f'], ['#ff416c','#ff4b2b'], ['#43C6AC','#F8FFAE'], ['#1a1a2e','#16213e']],
  newyear:       [['#8B5CF6','#1E1B4B'], ['#0f0c29','#302b63'], ['#000000','#434343'], ['#4776E6','#8E54E9'], ['#7F00FF','#E100FF']],
  teacher:       [['#059669','#065F46'], ['#134E5E','#71B280'], ['#005C97','#363795'], ['#3a7bd5','#3a6073'], ['#56ab2f','#a8e063']],
  thankyou:      [['#14B8A6','#0F766E'], ['#09C6F9','#045DE9'], ['#43C6AC','#F8FFAE'], ['#02AABD','#00CDAC'], ['#11998e','#38ef7d']],
  bestwishes:    [['#F59E0B','#D97706'], ['#f7971e','#ffd200'], ['#FDB99B','#F3793B'], ['#FFC371','#FF5F6D'], ['#F7971E','#FFD200']],
  goodluck:      [['#84CC16','#65A30D'], ['#a8ff78','#78ffd6'], ['#56ab2f','#a8e063'], ['#1D976C','#93F9B9'], ['#00b09b','#96c93d']],
  getwell:       [['#F87171','#FCA5A5'], ['#f093fb','#f5576c'], ['#ee9ca7','#ffdde1'], ['#FFB6C1','#FF69B4'], ['#ffecd2','#fcb69f']],
  sorry:         [['#94A3B8','#64748B'], ['#bdc3c7','#2c3e50'], ['#c9d6ff','#e2e2e2'], ['#eef2ff','#c7d2fe'], ['#CBD5E1','#94A3B8']],
  farewell:      [['#64748B','#334155'], ['#4776E6','#8E54E9'], ['#0f2027','#203a43'], ['#20002c','#cbb4d4'], ['#1a1a2e','#16213e']],
  housewarming:  [['#F97316','#EA580C'], ['#f6d365','#fda085'], ['#f7971e','#ffd200'], ['#ff9966','#ff5e62'], ['#FDDB92','#D1FDFF']],
  other:         [['#6B7280','#374151'], ['#667eea','#764ba2'], ['#f093fb','#f5576c'], ['#4776E6','#8E54E9'], ['#11998e','#38ef7d']],
};

/** Get gradients for an occasion (fallback to generic set) */
function getGradientsForOccasion(occasionId) {
  return GRADIENTS[occasionId] || GRADIENTS['other'];
}

/**
 * Core template definition builder.
 * Used to generate 6 templates per occasion dynamically.
 * @param {string} occasionId
 * @param {string} occasionName
 * @returns {Array<object>}
 */
function buildTemplatesForOccasion(occasionId, occasionName) {
  const gradients = getGradientsForOccasion(occasionId);
  const styles = [
    { id: 'elegant',     name: 'Elegant',     emoji: '✨', font: 'Playfair Display', accent: '#fff' },
    { id: 'modern',      name: 'Modern',      emoji: '💫', font: 'Outfit',           accent: '#fff' },
    { id: 'romantic',    name: 'Romantic',    emoji: '💖', font: 'Dancing Script',   accent: '#fff' },
    { id: 'cute',        name: 'Cute',        emoji: '🎀', font: 'Nunito',           accent: '#fff' },
    { id: 'luxury',      name: 'Luxury',      emoji: '👑', font: 'Cormorant Garamond', accent: '#FFD700' },
    { id: 'minimal',     name: 'Minimal',     emoji: '○',  font: 'Inter',            accent: '#333' },
  ];

  return styles.map((style, i) => {
    const gradient = gradients[i % gradients.length];
    return {
      id: `${occasionId}_${style.id}`,
      occasionId,
      occasionName,
      name: `${style.name} ${occasionName}`,
      category: style.id,
      gradient,
      fontFamily: style.font,
      accentColor: style.accent,
      emoji: style.emoji,
      // Editable text layers
      elements: [
        {
          id: 'header',
          type: ELEMENT_TYPES.TEXT,
          locked: false,
          content: `Happy ${occasionName}`,
          x: 0.5, y: 0.18,        // relative positions (0-1)
          fontSize: 42,
          fontWeight: 'bold',
          fontFamily: style.font,
          color: style.accent,
          align: 'center',
          role: 'header',
        },
        {
          id: 'recipientName',
          type: ELEMENT_TYPES.TEXT,
          locked: false,
          content: '',             // filled by user input
          x: 0.5, y: 0.32,
          fontSize: 56,
          fontWeight: '800',
          fontFamily: style.font,
          color: style.accent,
          align: 'center',
          role: 'recipientName',
          placeholder: 'Your Name',
        },
        {
          id: 'decorEmoji',
          type: ELEMENT_TYPES.EMOJI,
          locked: false,
          content: style.emoji,
          x: 0.5, y: 0.50,
          fontSize: 72,
          align: 'center',
          role: 'decoration',
        },
        {
          id: 'message',
          type: ELEMENT_TYPES.TEXT,
          locked: false,
          content: '',             // filled by wish selection
          x: 0.5, y: 0.65,
          fontSize: 22,
          fontWeight: 'normal',
          fontFamily: style.font,
          color: style.accent,
          align: 'center',
          maxWidth: 0.82,          // relative to canvas width
          role: 'message',
          placeholder: 'Your message here...',
        },
        {
          id: 'senderName',
          type: ELEMENT_TYPES.TEXT,
          locked: false,
          content: '',             // filled by user input; hidden if empty
          x: 0.5, y: 0.88,
          fontSize: 20,
          fontWeight: '600',
          fontFamily: style.font,
          color: style.accent,
          align: 'center',
          role: 'senderName',
          prefix: 'With love, ',
          placeholder: '',
        },
      ],
    };
  });
}

/**
 * Master template list.
 * Built dynamically for all occasions.
 * To add new occasions, push to OCCASIONS and this auto-builds templates.
 */
const ALL_TEMPLATES = (function () {
  const occasionDefs = [
    ['birthday',       'Birthday'],
    ['wedding',        'Wedding'],
    ['anniversary',    'Anniversary'],
    ['engagement',     'Engagement'],
    ['valentine',      "Valentine's Day"],
    ['friendship',     'Friendship'],
    ['mother',         "Mother's Day"],
    ['father',         "Father's Day"],
    ['newbaby',        'New Baby'],
    ['babyshower',     'Baby Shower'],
    ['graduation',     'Graduation'],
    ['promotion',      'Promotion'],
    ['congratulations','Congratulations'],
    ['retirement',     'Retirement'],
    ['eid',            'Eid'],
    ['christmas',      'Christmas'],
    ['newyear',        'New Year'],
    ['teacher',        "Teacher's Day"],
    ['thankyou',       'Thank You'],
    ['bestwishes',     'Best Wishes'],
    ['goodluck',       'Good Luck'],
    ['getwell',        'Get Well Soon'],
    ['sorry',          'Sorry'],
    ['farewell',       'Farewell'],
    ['housewarming',   'Housewarming'],
    ['other',          'Other'],
  ];

  let all = [];
  occasionDefs.forEach(([id, name]) => {
    all = all.concat(buildTemplatesForOccasion(id, name));
  });
  return all;
})();

/**
 * Get templates for a specific occasion.
 * @param {string} occasionId
 * @returns {Array}
 */
function getTemplatesByOccasion(occasionId) {
  return ALL_TEMPLATES.filter(t => t.occasionId === occasionId);
}

/**
 * Filter templates by category within an occasion.
 * @param {string} occasionId
 * @param {string} category - 'all' or specific category
 * @returns {Array}
 */
function filterTemplates(occasionId, category) {
  const base = getTemplatesByOccasion(occasionId);
  if (category === 'all') return base;
  return base.filter(t => t.category === category);
}

/**
 * Get a single template by ID.
 * @param {string} templateId
 * @returns {object|null}
 */
function getTemplateById(templateId) {
  return ALL_TEMPLATES.find(t => t.id === templateId) || null;
}

/**
 * Deep clone a template (safe to modify without affecting master).
 * @param {string} templateId
 * @returns {object|null}
 */
function cloneTemplate(templateId) {
  const t = getTemplateById(templateId);
  return t ? JSON.parse(JSON.stringify(t)) : null;
}
