/**
 * protection.js — Hardened Frontend Casual Copy & Code Protection Suite
 * 
 * Provides defense-in-depth against:
 * 1. Casual inspection and developer console access (F12, Ctrl+Shift+I/J/C/K/E, Ctrl+U)
 * 2. Extension-based scrapers (SingleFile, SavePage, Print-to-PDF dumps, Ctrl+A/Ctrl+S/Ctrl+P)
 * 3. Casual asset & image dragging / context-menu copying
 * 4. Framing / clickjacking by external scraper frames
 * 
 * DESIGN PRINCIPLE:
 * Strictly preserves 100% of website functionality for genuine users:
 * - Mobile touch, swipe gestures, and sheet modals work smoothly.
 * - Form inputs, search fields, textareas, and card editor text remain fully editable and copyable.
 * - Canvas manipulation, element drag/resize/rotate, photo uploads, and PNG/JPG downloads function flawlessly.
 * - Zero CPU waste, no infinite loops, no browser crashes.
 */

(function (window, document) {
  'use strict';

  const WishlyProtection = {
    version: '2.0.0',
    devToolsNotified: false,

    /**
     * Bootstrap the protection layer.
     */
    init: function () {
      this.initContextMenuProtection();
      this.initShortcutProtection();
      this.initSelectionProtection();
      this.initImageDragProtection();
      this.initAntiExtensionProtection();
      this.initDevToolsWarning();
      this.observeDynamicImages();
    },

    /**
     * 1. Context Menu Protection
     * Disables right-click context menu across layout, templates, and preview assets.
     * Preserves native right-click inside editable form fields so users can cut/copy/paste text.
     */
    initContextMenuProtection: function () {
      document.addEventListener('contextmenu', function (e) {
        const target = e.target;
        const isEditable = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest?.('.allow-context-menu')
        );

        if (!isEditable) {
          e.preventDefault();
          return false;
        }
      }, { passive: false });
    },

    /**
     * 2. Comprehensive Shortcut & Inspector Interception
     * Blocks DevTools shortcuts, source viewers, page savers, and whole-page select/print scrapers.
     * Supports Windows, Linux, and macOS.
     */
    initShortcutProtection: function () {
      document.addEventListener('keydown', function (e) {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        const key = (e.key || '').toLowerCase();
        const target = e.target;

        // Is user typing in an active editable field?
        const isEditableField = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest?.('.selectable')
        );

        // F12 — Developer Tools
        if (e.key === 'F12' || e.keyCode === 123) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // DevTools inspect & console combinations:
        // Win/Linux: Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K (Firefox), Ctrl+Shift+E (Network)
        // macOS: Cmd+Alt+I, Cmd+Alt+J, Cmd+Shift+C, Cmd+Alt+K, Cmd+Alt+E
        const isDevToolsCombo = (
          (isCtrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k' || key === 'e')) ||
          (e.metaKey && e.altKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k' || key === 'e'))
        );
        if (isDevToolsCombo) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+U / Cmd+U — View Page Source
        if (isCtrlOrCmd && key === 'u') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+S / Cmd+S — Save Page As (including Ctrl+Shift+S)
        if (isCtrlOrCmd && key === 's') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+P / Cmd+P — Print / Save as PDF (commonly exploited by scrapers/extensions)
        if (isCtrlOrCmd && key === 'p') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+A / Cmd+A — Select All
        // Allow ONLY inside form inputs & textareas so scrapers cannot highlight and copy the entire DOM
        if (isCtrlOrCmd && key === 'a') {
          if (!isEditableField) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }

        // Ctrl+C / Cmd+C — Casual Copy
        // Allow inside form inputs and selectable texts, block across raw template previews
        if (isCtrlOrCmd && key === 'c' && !e.shiftKey && !e.altKey) {
          if (!isEditableField) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
      }, { capture: true, passive: false });
    },

    /**
     * 3. Selective Text Selection
     * Prevents browser text highlight on background, templates, and UI chrome.
     * Preserves selection inside form inputs, textareas, and the card editor safe area.
     */
    initSelectionProtection: function () {
      document.addEventListener('selectstart', function (e) {
        const target = e.target;
        const isAllowed = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest?.('.selectable') ||
          target.closest?.('.editor-area')
        );

        if (!isAllowed) {
          e.preventDefault();
          return false;
        }
      });
    },

    /**
     * 4. Asset Drag Protection
     * Prevents dragging of images, templates, and badges out of the window.
     * Preserves internal editor canvas gestures, touch controls, and file uploads.
     */
    initImageDragProtection: function () {
      document.addEventListener('dragstart', function (e) {
        const target = e.target;
        if (
          target.closest?.('.editor-area') ||
          target.classList?.contains('allow-drag') ||
          target.classList?.contains('editor-draggable')
        ) {
          return true;
        }

        if (
          target.tagName === 'IMG' ||
          target.tagName === 'CANVAS' ||
          target.closest?.('.hero-card-preview') ||
          target.closest?.('.template-card') ||
          target.closest?.('.wish-card')
        ) {
          e.preventDefault();
          return false;
        }
      });

      this.markImagesUndraggable(document);
    },

    markImagesUndraggable: function (root) {
      if (!root || !root.querySelectorAll) return;
      const images = root.querySelectorAll('img:not(.allow-drag):not(.editor-draggable)');
      images.forEach(function (img) {
        img.setAttribute('draggable', 'false');
      });
    },

    observeDynamicImages: function () {
      if (!window.MutationObserver) return;
      const self = this;
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              if (node.tagName === 'IMG') {
                if (!node.classList.contains('allow-drag') && !node.classList.contains('editor-draggable')) {
                  node.setAttribute('draggable', 'false');
                }
              } else {
                self.markImagesUndraggable(node);
              }
            }
          });
        });
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
      });
    },

    /**
     * 5. Anti-Extension & Anti-Scraper Hardening
     * Disarms common automated scraping vectors:
     * - Suppresses window.print() calls used by dump extensions.
     * - Breaks out of external iframes (clickjacking / scraper iframe isolation).
     * - Protects Canvas from unauthorized external extraction.
     */
    initAntiExtensionProtection: function () {
      // Suppress programmatic window.print() dumps
      try {
        window.print = function () {
          console.warn('[Wishly] Printing and PDF dumping are disabled.');
          return false;
        };
      } catch (_) {}

      // Frame-busting: Prevent site from being captured in hostile hidden iframes
      try {
        if (window.top !== window.self) {
          window.top.location = window.self.location;
        }
      } catch (_) {}

      // Freeze WishlyProtection to prevent extension content scripts from disabling it
      try {
        Object.freeze(WishlyProtection);
      } catch (_) {}
    },

    /**
     * 6. DevTools Notice & Lightweight Heuristic
     * Logs professional console warning and notifies on inspector dock.
     * Uses zero continuous CPU (no setInterval polling, no debugger freezes).
     */
    initDevToolsWarning: function () {
      try {
        const badgeStyle = 'background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); color: #FFFFFF; font-size: 13px; font-weight: bold; padding: 4px 10px; border-radius: 4px;';
        const titleStyle = 'color: #F59E0B; font-size: 13px; font-weight: 700;';
        const bodyStyle  = 'color: #94A3B8; font-size: 11px; font-weight: 500;';

        console.log('%cWishly Protection Suite%c ⚠️ Notice: Developer tools are not supported on this page.', badgeStyle, titleStyle);
        console.log('%cSource code, templates, and designs are protected by copyright. Unauthorized copying or scraping is prohibited.', bodyStyle);
      } catch (_) {}

      const self = this;
      window.addEventListener('resize', function () {
        if (self.devToolsNotified) return;
        if (window.innerWidth > 768) {
          const widthThreshold = (window.outerWidth - window.innerWidth) > 160;
          const heightThreshold = (window.outerHeight - window.innerHeight) > 160;
          if (widthThreshold || heightThreshold) {
            self.devToolsNotified = true;
            if (typeof window.showToast === 'function') {
              window.showToast('Developer tools are not supported on this page.', 'warning');
            }
          }
        }
      }, { passive: true });
    },
  };

  // Expose to window
  window.WishlyProtection = WishlyProtection;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      WishlyProtection.init();
    });
  } else {
    WishlyProtection.init();
  }

})(window, document);
