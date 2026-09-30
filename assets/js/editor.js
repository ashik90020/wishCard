/**
 * editor.js — Canvas-based Card Editor
 * Mobile-first touch and pointer event support.
 * Undo/Redo, element drag/resize/rotate, photo upload, text editing.
 */

// ── Canvas Config ─────────────────────────────────────────────────────────
const CANVAS_SIZES = {
  portrait:  { w: 1080, h: 1350 },
  square:    { w: 1080, h: 1080 },
  landscape: { w: 1350, h: 1080 },
};

// ── Editor State ──────────────────────────────────────────────────────────
const EditorState = {
  canvas:     null,
  ctx:        null,
  template:   null,          // cloned template object
  elements:   [],            // array of element objects on canvas
  selected:   null,          // index of selected element, or null
  canvasSize: 'portrait',

  // Display scale (device canvas px vs CSS px)
  scale: 1,
  displayW: 0,
  displayH: 0,

  // Undo/Redo
  history:    [],            // stack of JSON snapshots of elements[]
  histPointer: -1,

  // Drag state
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragElemStartX: 0,
  dragElemStartY: 0,

  // Pinch state
  lastPinchDist: null,
  lastPinchAngle: null,

  // Photo (background) image
  bgImage: null,
  bgImageDataURL: null,

  // Recipient / message auto-fill
  recipientName: '',
  senderName: '',
  message: '',
};

// ── Predefined color palette ───────────────────────────────────────────────
const COLOR_PALETTE = [
  '#FFFFFF','#F1F5F9','#94A3B8','#1E293B','#0F172A',
  '#EF4444','#F97316','#F59E0B','#84CC16','#10B981',
  '#14B8A6','#06B6D4','#3B82F6','#8B5CF6','#EC4899',
  '#FFD700','#FF69B4','#00CED1','#7FFFD4','#ADFF2F',
];

// Emoji packs by category
const EMOJI_PACKS = {
  popular: ['🎉','🎊','🎈','🎁','🌟','✨','💫','🥳','🎂','🍰','🎀','💝','💖','💕','🌹','🌸','🌺','🦋','🎆','🎇'],
  love:    ['❤️','💕','💖','💗','💓','💞','💘','💝','🥰','😍','💑','👫','💏','🌹','🌷','💐','🌸','✨','💍','💎'],
  nature:  ['🌸','🌺','🌻','🌹','🌷','🌿','🍃','🍀','🌈','☀️','🌙','⭐','🌟','🦋','🐝','🌊','🏔️','🌲','🌴','🌵'],
  party:   ['🎉','🎊','🎈','🥳','🍾','🥂','🎂','🎁','🎀','🎆','🎇','🪄','🏆','🥇','👑','⭐','🌟','💫','✨','🎵'],
  animals: ['🐶','🐱','🐰','🦊','🐻','🐼','🐨','🦁','🐯','🦋','🦚','🦜','🐬','🦋','🌈','🐾','🦄','🐙','🦋','🦅'],
  symbols: ['♥️','★','☆','♦','♠','♣','✿','❀','✽','☯','☮','✡','☪','✝','⚡','🔥','💧','🌪️','❄️','🌊'],
};

// ── Initialize Editor ─────────────────────────────────────────────────────

function initEditor() {
  EditorState.canvas = document.getElementById('editorCanvas');
  if (!EditorState.canvas) return;
  EditorState.ctx = EditorState.canvas.getContext('2d');

  // Load state from AppState
  const template = AppState.selectedTemplate;
  if (!template) { window.location.href = 'occasions.html'; return; }

  EditorState.template      = JSON.parse(JSON.stringify(template));
  EditorState.elements      = JSON.parse(JSON.stringify(template.elements || []));
  EditorState.recipientName = AppState.recipientName || '';
  EditorState.senderName    = AppState.senderName    || '';
  EditorState.message       = AppState.customMessage || AppState.selectedWish?.text || '';

  // Auto-fill recipient name and message into appropriate elements
  applyPersonalization();

  // Restore editor history from storage if available
  const savedHistory = loadEditorHistory();
  if (savedHistory.history.length) {
    EditorState.history    = savedHistory.history;
    EditorState.histPointer = savedHistory.pointer;
    EditorState.elements   = JSON.parse(EditorState.history[EditorState.histPointer] || '[]');
  } else {
    pushHistory();
  }

  // Size the canvas
  resizeCanvas();
  window.addEventListener('resize', debounce(resizeCanvas, 200));

  // Render initial frame
  render();

  // Bind pointer events
  bindCanvasEvents();

  // Bind toolbar
  bindToolbar();

  // Update undo/redo button states
  updateHistoryButtons();

  // Update topbar card name
  const nameEl = document.querySelector('.editor-topbar .card-name');
  if (nameEl) nameEl.textContent = EditorState.template.name || 'Your Card';
}

// ── Auto-fill Personalization ─────────────────────────────────────────────

function applyPersonalization() {
  EditorState.elements.forEach(el => {
    if (el.role === 'recipientName') {
      el.content = EditorState.recipientName || el.placeholder || '';
    }
    if (el.role === 'message') {
      el.content = EditorState.message || el.placeholder || '';
    }
    if (el.role === 'senderName') {
      if (EditorState.senderName) {
        el.content = (el.prefix || '') + EditorState.senderName;
      } else {
        el.content = '';
      }
    }
  });
}

// ── Canvas Sizing ─────────────────────────────────────────────────────────

function resizeCanvas() {
  const area = document.querySelector('.editor-canvas-area');
  if (!area) return;

  const areaW = area.clientWidth  - 24;
  const areaH = area.clientHeight - 24;

  const { w: natW, h: natH } = CANVAS_SIZES[EditorState.canvasSize];
  const ratio = natW / natH;

  let dispW = areaW;
  let dispH = areaW / ratio;

  if (dispH > areaH) { dispH = areaH; dispW = areaH * ratio; }

  EditorState.displayW = dispW;
  EditorState.displayH = dispH;
  EditorState.scale    = natW / dispW;

  const wrapper = document.querySelector('.canvas-wrapper');
  if (wrapper) { wrapper.style.width = dispW + 'px'; wrapper.style.height = dispH + 'px'; }

  // The actual canvas stays at high resolution
  EditorState.canvas.width  = natW;
  EditorState.canvas.height = natH;
  EditorState.canvas.style.width  = dispW + 'px';
  EditorState.canvas.style.height = dispH + 'px';

  render();
}

// ── Render ────────────────────────────────────────────────────────────────

function render() {
  const { canvas, ctx, template, elements, selected, scale } = EditorState;
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background
  drawBackground(ctx, W, H, template);

  // Elements
  elements.forEach((el, i) => {
    drawElement(ctx, el, W, H, i === selected);
  });
}

// ── Background Renderer ───────────────────────────────────────────────────

function drawBackground(ctx, W, H, template) {
  if (EditorState.bgImage) {
    // User-uploaded background image
    ctx.save();
    ctx.drawImage(EditorState.bgImage, 0, 0, W, H);
    // Semi-transparent overlay for readability
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    return;
  }

  // Gradient background from template
  if (template && template.gradient) {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, template.gradient[0] || '#7C3AED');
    grad.addColorStop(1, template.gradient[1] || '#EC4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative overlay pattern
    drawDecorativePattern(ctx, W, H, template);
  } else {
    ctx.fillStyle = '#1A1033';
    ctx.fillRect(0, 0, W, H);
  }
}

/** Add subtle decorative circles/shapes to the background */
function drawDecorativePattern(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.08;

  // Large circle top-right
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.12, W * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();

  // Small circle bottom-left
  ctx.beginPath();
  ctx.arc(W * 0.12, H * 0.88, W * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Medium circle center-left
  ctx.beginPath();
  ctx.arc(W * 0.05, H * 0.45, W * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Element Renderer ──────────────────────────────────────────────────────

function drawElement(ctx, el, W, H, isSelected) {
  if (!el.content && el.role !== 'decoration') return;

  const x = Math.round(el.x * W);
  const y = Math.round(el.y * H);

  ctx.save();
  ctx.translate(x, y);
  if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

  switch (el.type) {
    case 'text':
    case 'emoji':
      drawTextElement(ctx, el, W, H, isSelected);
      break;
    case 'image':
      drawImageElement(ctx, el, W, isSelected);
      break;
    case 'shape':
      drawShapeElement(ctx, el, isSelected);
      break;
  }

  ctx.restore();
}

function drawTextElement(ctx, el, W, H, isSelected) {
  const fontSize  = el.fontSize || 40;
  const fontWeight = el.fontWeight || 'normal';
  const fontFamily = el.fontFamily || 'Outfit';
  const color      = el.color || '#FFFFFF';
  const align      = el.align || 'center';
  const text       = el.content || '';
  const maxWidth   = el.maxWidth ? Math.round(el.maxWidth * W) : W * 0.85;

  ctx.font = `${el.fontStyle === 'italic' ? 'italic ' : ''}${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  // Wrap text
  const lines = wrapText(ctx, text, maxWidth);
  const lineH = fontSize * 1.35;
  const totalH = lines.length * lineH;
  const startY = -(totalH / 2) + (lineH / 2);

  lines.forEach((line, i) => {
    const ly = startY + i * lineH;
    ctx.fillText(line, 0, ly);
  });

  // Selection indicator
  if (isSelected) {
    const pad = 16;
    const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
    const rx = align === 'center' ? -(textW / 2) - pad : -pad;
    const ry = -(totalH / 2) - pad;
    const rw = textW + pad * 2;
    const rh = totalH + pad * 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.setLineDash([]);

    // Drag handle
    ctx.fillStyle = '#7C3AED';
    ctx.beginPath();
    ctx.arc(rx + rw, ry, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('↗', rx + rw, ry + 1);
  }
}

function drawImageElement(ctx, el, W, isSelected) {
  if (!el._img) return;
  const size = (el.scale || 1) * (el.baseSize || W * 0.4);
  ctx.drawImage(el._img, -size / 2, -size / 2, size, size);

  if (isSelected) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20);
    ctx.setLineDash([]);
  }
}

function drawShapeElement(ctx, el, isSelected) {
  const size = (el.scale || 1) * (el.baseSize || 80);
  ctx.fillStyle = el.color || '#FFFFFF';
  ctx.globalAlpha = el.opacity || 1;

  if (el.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (el.shape === 'star') {
    drawStar(ctx, 0, 0, 5, size / 2, size / 4);
    ctx.fill();
  } else {
    ctx.fillRect(-size / 2, -size / 2, size, size);
  }

  ctx.globalAlpha = 1;
  if (isSelected) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(-size / 2 - 8, -size / 2 - 8, size + 16, size + 16);
    ctx.setLineDash([]);
  }
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return [''];
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

// ── Undo / Redo ────────────────────────────────────────────────────────────

function pushHistory() {
  // Trim forward history
  EditorState.history = EditorState.history.slice(0, EditorState.histPointer + 1);
  // Push a deep clone
  EditorState.history.push(JSON.stringify(EditorState.elements));
  EditorState.histPointer = EditorState.history.length - 1;

  // Trim overflow
  if (EditorState.history.length > 30) {
    EditorState.history.shift();
    EditorState.histPointer--;
  }

  saveEditorHistory(EditorState.history, EditorState.histPointer);
  updateHistoryButtons();
}

function undo() {
  if (EditorState.histPointer <= 0) return;
  EditorState.histPointer--;
  EditorState.elements = JSON.parse(EditorState.history[EditorState.histPointer]);
  EditorState.selected = null;
  render();
  updateHistoryButtons();
}

function redo() {
  if (EditorState.histPointer >= EditorState.history.length - 1) return;
  EditorState.histPointer++;
  EditorState.elements = JSON.parse(EditorState.history[EditorState.histPointer]);
  EditorState.selected = null;
  render();
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const undoBtn = document.getElementById('btnUndo');
  const redoBtn = document.getElementById('btnRedo');
  if (undoBtn) undoBtn.disabled = EditorState.histPointer <= 0;
  if (redoBtn) redoBtn.disabled = EditorState.histPointer >= EditorState.history.length - 1;
}

// ── Canvas Pointer Events (Touch + Mouse) ─────────────────────────────────

function getCanvasXY(e) {
  const rect = EditorState.canvas.getBoundingClientRect();
  let clientX, clientY;

  if (e.touches && e.touches.length) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  // Convert to canvas natural coordinates
  const displayX = clientX - rect.left;
  const displayY = clientY - rect.top;
  return {
    x: displayX * EditorState.scale,
    y: displayY * EditorState.scale,
  };
}

function bindCanvasEvents() {
  const canvas = EditorState.canvas;

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
  canvas.addEventListener('pointermove', onPointerMove, { passive: false });
  canvas.addEventListener('pointerup',   onPointerUp,   { passive: false });
  canvas.addEventListener('pointercancel', onPointerUp, { passive: false });

  // Double tap to edit text
  let lastTap = 0;
  canvas.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTap < 300) { onDoubleTap(e); }
    lastTap = now;
  });
}

function onPointerDown(e) {
  e.preventDefault();
  const { x, y } = getCanvasXY(e);
  const W = EditorState.canvas.width;
  const H = EditorState.canvas.height;

  // Find hit element (search in reverse so top elements get priority)
  let hit = null;
  for (let i = EditorState.elements.length - 1; i >= 0; i--) {
    if (hitTestElement(EditorState.elements[i], x, y, W, H)) { hit = i; break; }
  }

  EditorState.selected    = hit;
  EditorState.isDragging  = hit !== null;
  EditorState.dragStartX  = x;
  EditorState.dragStartY  = y;

  if (hit !== null) {
    const el = EditorState.elements[hit];
    EditorState.dragElemStartX = el.x;
    EditorState.dragElemStartY = el.y;
  }

  render();
  updateToolbarActiveStates();
}

function onPointerMove(e) {
  e.preventDefault();
  if (!EditorState.isDragging || EditorState.selected === null) return;

  const { x, y } = getCanvasXY(e);
  const W = EditorState.canvas.width;
  const H = EditorState.canvas.height;

  const dx = (x - EditorState.dragStartX) / W;
  const dy = (y - EditorState.dragStartY) / H;

  const el = EditorState.elements[EditorState.selected];
  el.x = clamp(EditorState.dragElemStartX + dx, 0.02, 0.98);
  el.y = clamp(EditorState.dragElemStartY + dy, 0.02, 0.98);

  render();
}

function onPointerUp(e) {
  if (EditorState.isDragging) {
    pushHistory();
  }
  EditorState.isDragging = false;
}

function onDoubleTap(e) {
  if (EditorState.selected === null) return;
  const el = EditorState.elements[EditorState.selected];
  if (el.type === 'text' || el.type === 'emoji') {
    openTextEditor(EditorState.selected);
  }
}

/** Hit-test an element at canvas coordinate (x, y). */
function hitTestElement(el, x, y, W, H) {
  const ex = el.x * W;
  const ey = el.y * H;
  const hitRadius = 80 * Math.max(1, el.scale || 1);
  const dx = x - ex;
  const dy = y - ey;
  return Math.sqrt(dx * dx + dy * dy) < hitRadius;
}

// ── Toolbar Binding ────────────────────────────────────────────────────────

function bindToolbar() {
  // Back button
  document.getElementById('btnEditorBack')?.addEventListener('click', () => history.back());

  // Undo / Redo
  document.getElementById('btnUndo')?.addEventListener('click', undo);
  document.getElementById('btnRedo')?.addEventListener('click', redo);

  // Tool buttons open sheets
  document.querySelectorAll('.toolbar-tool[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      handleToolClick(tool);
    });
  });

  // Preview button
  document.getElementById('btnPreview')?.addEventListener('click', showPreview);
}

function handleToolClick(tool) {
  const toolSheetMap = {
    text:       'sheetText',
    elements:   'sheetElements',
    photo:      null,       // triggers file input
    background: 'sheetBackground',
    more:       'sheetMore',
  };

  if (tool === 'photo') {
    document.getElementById('photoFileInput')?.click();
    return;
  }

  const sheetId = toolSheetMap[tool];
  if (sheetId) {
    populateSheet(tool);
    openSheet(sheetId);
  }

  // Mark active
  document.querySelectorAll('.toolbar-tool').forEach(b => b.classList.remove('active'));
  document.querySelector(`.toolbar-tool[data-tool="${tool}"]`)?.classList.add('active');
}

function updateToolbarActiveStates() {
  // No persistent tool active state needed in this design
}

// ── Sheet Population ──────────────────────────────────────────────────────

function populateSheet(tool) {
  if (tool === 'text') populateTextSheet();
  if (tool === 'elements') populateElementsSheet();
  if (tool === 'background') populateBackgroundSheet();
}

function populateTextSheet() {
  // Sync current selected element values into the text sheet controls
  const el = EditorState.selected !== null ? EditorState.elements[EditorState.selected] : null;
  if (!el || (el.type !== 'text')) return;

  const fontSizeSlider = document.getElementById('textFontSize');
  const fontSizeVal    = document.getElementById('textFontSizeVal');
  const colorPalette   = document.getElementById('textColorPalette');
  const fontSelect     = document.getElementById('textFontFamily');
  const alignBtns      = document.querySelectorAll('[data-align]');
  const boldBtn        = document.getElementById('btnBold');
  const italicBtn      = document.getElementById('btnItalic');

  if (fontSizeSlider) {
    fontSizeSlider.value = el.fontSize || 40;
    if (fontSizeVal) fontSizeVal.textContent = fontSizeSlider.value;
  }

  if (fontSelect) fontSelect.value = el.fontFamily || 'Outfit';

  alignBtns.forEach(b => b.classList.toggle('active', b.dataset.align === (el.align || 'center')));
  if (boldBtn)   boldBtn.classList.toggle('active',   el.fontWeight === 'bold');
  if (italicBtn) italicBtn.classList.toggle('active', el.fontStyle  === 'italic');

  // Highlight active color
  if (colorPalette) {
    colorPalette.querySelectorAll('.color-swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color === (el.color || '#FFFFFF'));
    });
  }
}

function populateElementsSheet() {
  // Elements sheet shows emoji grid; already built from HTML
}

function populateBackgroundSheet() {
  const template = EditorState.template;
  const container = document.getElementById('bgGradientRow');
  if (!container || !template) return;

  // Already rendered; just mark active
  const currentGrad = JSON.stringify(EditorState.template.gradient);
  container.querySelectorAll('.bg-swatch[data-gradient]').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.gradient === currentGrad);
  });
}

// ── Text Sheet Event Handlers ─────────────────────────────────────────────

function bindTextSheetEvents() {
  // Font size slider
  const slider = document.getElementById('textFontSize');
  const valEl  = document.getElementById('textFontSizeVal');
  slider?.addEventListener('input', () => {
    if (valEl) valEl.textContent = slider.value;
    updateSelectedElement({ fontSize: parseInt(slider.value) });
  });

  slider?.addEventListener('change', pushHistory);

  // Font family
  document.getElementById('textFontFamily')?.addEventListener('change', e => {
    updateSelectedElement({ fontFamily: e.target.value });
    pushHistory();
  });

  // Alignment
  document.querySelectorAll('[data-align]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-align]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateSelectedElement({ align: btn.dataset.align });
      pushHistory();
    });
  });

  // Bold
  document.getElementById('btnBold')?.addEventListener('click', () => {
    const el = getSelectedEl();
    if (!el) return;
    const isBold = el.fontWeight === 'bold';
    document.getElementById('btnBold').classList.toggle('active', !isBold);
    updateSelectedElement({ fontWeight: isBold ? 'normal' : 'bold' });
    pushHistory();
  });

  // Italic
  document.getElementById('btnItalic')?.addEventListener('click', () => {
    const el = getSelectedEl();
    if (!el) return;
    const isItalic = el.fontStyle === 'italic';
    document.getElementById('btnItalic').classList.toggle('active', !isItalic);
    updateSelectedElement({ fontStyle: isItalic ? 'normal' : 'italic' });
    pushHistory();
  });

  // Color swatches
  document.getElementById('textColorPalette')?.addEventListener('click', e => {
    const sw = e.target.closest('.color-swatch[data-color]');
    if (!sw) return;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    updateSelectedElement({ color: sw.dataset.color });
    pushHistory();
    render();
  });

  // Custom color picker
  document.getElementById('textColorCustom')?.addEventListener('input', e => {
    updateSelectedElement({ color: e.target.value });
    render();
  });

  document.getElementById('textColorCustom')?.addEventListener('change', pushHistory);

  // Letter spacing
  document.getElementById('textLetterSpacing')?.addEventListener('input', e => {
    updateSelectedElement({ letterSpacing: parseFloat(e.target.value) });
    render();
  });

  document.getElementById('textLetterSpacing')?.addEventListener('change', pushHistory);
}

// ── Element Sheet Event Handlers ──────────────────────────────────────────

function bindElementsSheetEvents() {
  // Emoji buttons
  document.querySelectorAll('.emoji-btn[data-emoji]').forEach(btn => {
    btn.addEventListener('click', () => {
      addEmojiElement(btn.dataset.emoji);
      closeSheet('sheetElements');
    });
  });

  // Shape/sticker buttons
  document.querySelectorAll('.element-btn[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => {
      addShapeElement(btn.dataset.shape, btn.dataset.color || '#FFFFFF');
      closeSheet('sheetElements');
    });
  });

  // Emoji category chips
  initChips('#emojiCategoryChips', category => {
    renderEmojiPack(category);
  });
}

// ── Background Sheet Events ────────────────────────────────────────────────

function bindBackgroundSheetEvents() {
  // Gradient swatches
  document.getElementById('bgGradientRow')?.addEventListener('click', e => {
    const sw = e.target.closest('.bg-swatch[data-gradient]');
    if (!sw) return;
    try {
      const grad = JSON.parse(sw.dataset.gradient);
      EditorState.template.gradient = grad;
      EditorState.bgImage = null;
      EditorState.bgImageDataURL = null;
      document.querySelectorAll('.bg-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      pushHistory();
      render();
    } catch {}
  });

  // Solid color background
  document.getElementById('bgSolidColor')?.addEventListener('input', e => {
    const color = e.target.value;
    EditorState.template.gradient = [color, color];
    EditorState.bgImage = null;
    render();
  });

  document.getElementById('bgSolidColor')?.addEventListener('change', pushHistory);

  // Upload background image
  document.getElementById('bgImageInput')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image is too large. Max 10MB.', 'warning');
      return;
    }
    try {
      const dataURL = await compressImage(file, 1920, 0.85);
      const img = new Image();
      img.onload = () => {
        EditorState.bgImage = img;
        EditorState.bgImageDataURL = dataURL;
        pushHistory();
        render();
        closeSheet('sheetBackground');
      };
      img.src = dataURL;
    } catch {
      showToast('Could not load image. Try another.', 'error');
    }
  });
}

// ── Photo Upload (as canvas element) ─────────────────────────────────────

function bindPhotoUploadEvents() {
  document.getElementById('photoFileInput')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('Image too large. Max 15MB.', 'warning');
      return;
    }
    try {
      const dataURL = await compressImage(file, 1200, 0.85);
      const img = new Image();
      img.onload = () => {
        const newEl = {
          id:    'photo_' + Date.now(),
          type:  'image',
          locked: false,
          x: 0.5, y: 0.5,
          baseSize: EditorState.canvas.width * 0.5,
          scale: 1,
          rotation: 0,
          _img: img,
          _dataURL: dataURL,
          role: 'photo',
        };
        EditorState.elements.push(newEl);
        EditorState.selected = EditorState.elements.length - 1;
        pushHistory();
        render();
        showToast('Photo added! Drag to reposition.', 'success');
      };
      img.src = dataURL;
    } catch {
      showToast('Could not load photo. Try another.', 'error');
    }
  });
}

// ── Element Add Helpers ────────────────────────────────────────────────────

function addEmojiElement(emoji) {
  const el = {
    id:       'emoji_' + Date.now(),
    type:     'emoji',
    locked:   false,
    content:  emoji,
    x: 0.5, y: 0.5,
    fontSize: 120,
    align:    'center',
    color:    '#FFFFFF',
    role:     'user_emoji',
    scale:    1,
  };
  EditorState.elements.push(el);
  EditorState.selected = EditorState.elements.length - 1;
  pushHistory();
  render();
  showToast('Emoji added! Drag to move it.', 'info');
}

function addShapeElement(shape, color) {
  const el = {
    id:       'shape_' + Date.now(),
    type:     'shape',
    locked:   false,
    shape,
    x: 0.5, y: 0.5,
    baseSize: 150,
    scale:    1,
    color:    color || '#FFFFFF',
    opacity:  0.8,
    rotation: 0,
    role:     'user_shape',
  };
  EditorState.elements.push(el);
  EditorState.selected = EditorState.elements.length - 1;
  pushHistory();
  render();
}

// ── Delete Selected Element ────────────────────────────────────────────────

function deleteSelected() {
  if (EditorState.selected === null) {
    showToast('Tap an element first to select it.', 'info');
    return;
  }
  const el = EditorState.elements[EditorState.selected];
  // Prevent deleting core template elements without confirmation
  if (['header','recipientName','message','senderName','decorEmoji'].includes(el.role)) {
    if (!confirm('Remove this template element?')) return;
  }
  EditorState.elements.splice(EditorState.selected, 1);
  EditorState.selected = null;
  pushHistory();
  render();
  showToast('Element removed.', 'info');
}

// ── Text Editor Popup (inline editing) ────────────────────────────────────

function openTextEditor(elIndex) {
  const el = EditorState.elements[elIndex];
  if (!el) return;

  // Create a small floating input
  const existing = document.getElementById('inlineTextEdit');
  if (existing) existing.remove();

  const wrap = document.createElement('div');
  wrap.id = 'inlineTextEdit';
  wrap.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    width:calc(100% - 2rem); max-width:420px; z-index:3000;
    background:var(--bg-elevated); border:1.5px solid var(--border);
    border-radius:var(--radius-lg); padding:1rem; box-shadow:var(--shadow-lg);
  `;

  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
      <span style="font-weight:700;font-size:0.9rem">Edit Text</span>
      <button id="inlineTextClose" style="background:none;border:none;color:var(--text-muted);font-size:1.2rem;cursor:pointer">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
    <textarea id="inlineTextArea" rows="3" style="
      width:100%; background:var(--bg-card); border:1.5px solid var(--border);
      border-radius:var(--radius); color:var(--text); font-family:var(--font-main);
      font-size:1rem; padding:0.75rem; outline:none; resize:vertical;
    " maxlength="300">${el.content || ''}</textarea>
    <div style="display:flex;justify-content:space-between;margin-top:0.75rem">
      <span id="inlineCharCount" style="font-size:0.75rem;color:var(--text-muted)">0 / 300</span>
      <button id="inlineTextApply" class="btn-primary-custom" style="padding:0.5rem 1.25rem;min-height:40px;font-size:0.9rem">
        Apply
      </button>
    </div>
  `;
  document.body.appendChild(wrap);

  const textarea = document.getElementById('inlineTextArea');
  const charCount = document.getElementById('inlineCharCount');

  textarea.addEventListener('input', () => {
    charCount.textContent = `${textarea.value.length} / 300`;
    el.content = textarea.value;
    render();
  });

  charCount.textContent = `${(el.content || '').length} / 300`;

  document.getElementById('inlineTextApply').addEventListener('click', () => {
    el.content = textarea.value;
    pushHistory();
    render();
    wrap.remove();
  });

  document.getElementById('inlineTextClose').addEventListener('click', () => {
    wrap.remove();
  });

  textarea.focus();
}

// ── Preview Mode ───────────────────────────────────────────────────────────

function showPreview() {
  // Deselect and re-render cleanly
  EditorState.selected = null;
  render();

  const overlay = document.getElementById('previewOverlay');
  if (!overlay) return;

  // Clone canvas content to preview canvas
  const previewCanvas = document.getElementById('previewCanvas');
  if (previewCanvas) {
    previewCanvas.width  = EditorState.canvas.width;
    previewCanvas.height = EditorState.canvas.height;
    previewCanvas.getContext('2d').drawImage(EditorState.canvas, 0, 0);
  }

  overlay.classList.remove('d-none');
  overlay.style.animation = 'none';
  overlay.offsetHeight;
  overlay.style.animation = '';
}

function hidePreview() {
  const overlay = document.getElementById('previewOverlay');
  if (overlay) overlay.classList.add('d-none');
}

function bindPreviewEvents() {
  document.getElementById('btnHidePreview')?.addEventListener('click', hidePreview);

  document.getElementById('btnDownloadPNG')?.addEventListener('click', () => {
    const filename = buildFilename(AppState.recipientName, AppState.selectedOccasion?.name);
    downloadCanvasAsPNG(EditorState.canvas, filename);
    showToast('Card downloaded as PNG!', 'success');
  });

  document.getElementById('btnDownloadJPG')?.addEventListener('click', () => {
    const filename = buildFilename(AppState.recipientName, AppState.selectedOccasion?.name);
    downloadCanvasAsJPG(EditorState.canvas, filename);
    showToast('Card downloaded as JPG!', 'success');
  });

  document.getElementById('btnShareCard')?.addEventListener('click', async () => {
    const filename = buildFilename(AppState.recipientName, AppState.selectedOccasion?.name);
    const message  = AppState.customMessage || AppState.selectedWish?.text || 'Check out this card!';
    await shareCard(EditorState.canvas, message, filename);
  });

  document.getElementById('btnCreateAnother')?.addEventListener('click', () => {
    AppState.reset();
    window.location.href = 'index.html';
  });
}

// ── Helper to Get Selected Element ────────────────────────────────────────

function getSelectedEl() {
  if (EditorState.selected === null) return null;
  return EditorState.elements[EditorState.selected] || null;
}

/** Update a single property on the selected element and re-render. */
function updateSelectedElement(patch) {
  const el = getSelectedEl();
  if (!el) return;
  Object.assign(el, patch);
  render();
}

// ── Emoji Pack Renderer ────────────────────────────────────────────────────

function renderEmojiPack(category) {
  const grid = document.getElementById('emojiGrid');
  if (!grid) return;
  const emojis = EMOJI_PACKS[category] || EMOJI_PACKS.popular;
  grid.innerHTML = emojis.map(e =>
    `<button class="emoji-btn" data-emoji="${e}" aria-label="${e}">${e}</button>`
  ).join('');
  // Re-bind after re-render
  grid.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addEmojiElement(btn.dataset.emoji);
      closeSheet('sheetElements');
    });
  });
}

// ── Initialize on DOM Ready ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('editorCanvas')) return;

  initEditor();
  bindTextSheetEvents();
  bindElementsSheetEvents();
  bindBackgroundSheetEvents();
  bindPhotoUploadEvents();
  bindPreviewEvents();

  // Delete key for desktop
  document.addEventListener('keydown', e => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && EditorState.selected !== null) {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      deleteSelected();
    }
    if (e.ctrlKey && e.key === 'z') undo();
    if (e.ctrlKey && e.key === 'y') redo();
  });

  // More sheet - delete and resize
  document.getElementById('btnDeleteElement')?.addEventListener('click', deleteSelected);

  document.getElementById('elScaleSlider')?.addEventListener('input', e => {
    updateSelectedElement({ scale: parseFloat(e.target.value) });
    render();
  });

  document.getElementById('elScaleSlider')?.addEventListener('change', pushHistory);

  document.getElementById('elRotateSlider')?.addEventListener('input', e => {
    updateSelectedElement({ rotation: parseFloat(e.target.value) });
    render();
  });

  document.getElementById('elRotateSlider')?.addEventListener('change', pushHistory);

  document.getElementById('elOpacitySlider')?.addEventListener('input', e => {
    updateSelectedElement({ opacity: parseFloat(e.target.value) });
    render();
  });

  document.getElementById('elOpacitySlider')?.addEventListener('change', pushHistory);
});
