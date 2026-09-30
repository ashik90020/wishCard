/**
 * Download Module
 * Handles PNG and JPG export from canvas.
 * Supports high-resolution export at 2x scale.
 */

/**
 * Export a canvas element as a PNG download.
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 * @param {number} quality - 0 to 1 (PNG ignores quality; used for JPG)
 */
function downloadCanvasAsPNG(canvas, filename = 'wishly-card') {
  try {
    const dataURL = canvas.toDataURL('image/png');
    triggerDownload(dataURL, `${filename}.png`);
  } catch (err) {
    showToast('Could not export card. Please try again.', 'error');
    console.error('[Download] PNG export failed:', err);
  }
}

/**
 * Export a canvas element as a JPG download.
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 * @param {number} quality - 0 to 1
 */
function downloadCanvasAsJPG(canvas, filename = 'wishly-card', quality = 0.92) {
  try {
    // Draw onto a white-background canvas first (JPG doesn't support transparency)
    const offscreen = document.createElement('canvas');
    offscreen.width  = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);

    const dataURL = offscreen.toDataURL('image/jpeg', quality);
    triggerDownload(dataURL, `${filename}.jpg`);
  } catch (err) {
    showToast('Could not export card. Please try again.', 'error');
    console.error('[Download] JPG export failed:', err);
  }
}

/**
 * Create a temporary anchor and trigger download.
 * @param {string} dataURL
 * @param {string} filename
 */
function triggerDownload(dataURL, filename) {
  const link = document.createElement('a');
  link.href     = dataURL;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert dataURL to Blob for sharing.
 * @param {string} dataURL
 * @returns {Blob}
 */
function dataURLToBlob(dataURL) {
  const [header, base64] = dataURL.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
}

/**
 * Get a sanitized filename from the recipient name.
 * @param {string} recipientName
 * @param {string} occasionName
 * @returns {string}
 */
function buildFilename(recipientName, occasionName) {
  const clean = str => (str || '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const parts = ['wishly'];
  if (occasionName) parts.push(clean(occasionName));
  if (recipientName) parts.push(clean(recipientName));
  return parts.join('_');
}
