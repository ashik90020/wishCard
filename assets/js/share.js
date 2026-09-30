/**
 * Share Module
 * Uses Web Share API when available, with fallback for unsupported browsers.
 */

/**
 * Share the card image using Web Share API.
 * Falls back to download + copy-message flow if not supported.
 * @param {HTMLCanvasElement} canvas
 * @param {string} message - The wish message text
 * @param {string} filename
 */
async function shareCard(canvas, message = '', filename = 'wishly-card') {
  const supported = !!navigator.share && !!navigator.canShare;

  if (supported) {
    try {
      const dataURL = canvas.toDataURL('image/png');
      const blob    = dataURLToBlob(dataURL);
      const file    = new File([blob], `${filename}.png`, { type: 'image/png' });

      const shareData = {
        title: 'My Wishly Card 💌',
        text:  message || 'I made this card for you!',
        files: [file],
      };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[Share] Web Share API failed, falling back:', err);
      } else {
        return; // User cancelled
      }
    }
  }

  // Fallback: show custom share modal
  showShareFallbackModal(canvas, message, filename);
}

/**
 * Show a simple share fallback modal with download + copy-message buttons.
 */
function showShareFallbackModal(canvas, message, filename) {
  const existing = document.getElementById('shareFallbackModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'shareFallbackModal';
  modal.innerHTML = `
    <div class="modal fade" id="shareFallbackModalInner" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Share Your Card</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center pt-2">
            <p class="text-muted small mb-4">Your browser doesn't support direct sharing. Download the card and share it manually.</p>
            <div class="d-grid gap-2">
              <button id="shareFallbackDownload" class="btn btn-primary btn-lg rounded-3">
                <i class="bi bi-download me-2"></i> Download Card
              </button>
              <button id="shareFallbackCopy" class="btn btn-outline-secondary rounded-3">
                <i class="bi bi-clipboard me-2"></i> Copy Message Text
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const bsModal = new bootstrap.Modal(document.getElementById('shareFallbackModalInner'));
  bsModal.show();

  document.getElementById('shareFallbackDownload').addEventListener('click', () => {
    downloadCanvasAsPNG(canvas, filename);
    bsModal.hide();
  });

  document.getElementById('shareFallbackCopy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message);
      showToast('Message copied to clipboard!', 'success');
    } catch {
      showToast('Could not copy. Please copy manually.', 'warning');
    }
    bsModal.hide();
  });
}
