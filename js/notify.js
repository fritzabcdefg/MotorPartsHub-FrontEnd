// ─────────────────────────────────────────────────────────
// MotorPartsHub Global Notification System
// Drop-in replacement for alert(). Include this script on
// every page, then call notify(message, type) anywhere.
// ─────────────────────────────────────────────────────────
(function (global) {

  const CONTAINER_ID = 'mph-notify-container';
  const AUTO_DISMISS_MS = 4500;

  // Icons per notification type
  const ICONS = {
    success: '✅',
    error:   '⚠️',
    info:    'ℹ️',
    warning: '⚠️'
  };

  // Accent colors per type — matches Midnight Violet theme
  const COLORS = {
    success: { border: 'rgba(40, 167, 69, 0.4)',  bar: '#28a745' },
    error:   { border: 'rgba(244, 67, 54, 0.4)',   bar: '#f44336' },
    info:    { border: 'rgba(168, 107, 255, 0.4)', bar: '#a86bff' },
    warning: { border: 'rgba(255, 152, 0, 0.4)',   bar: '#ff9800' }
  };

  function ensureContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column-reverse', // newest toast pushes others up
        gap: '10px',
        zIndex: '999999',
        maxWidth: '360px',
        width: 'calc(100% - 40px)'
      });
      document.body.appendChild(container);
    }
    return container;
  }

  function injectStylesOnce() {
    if (document.getElementById('mph-notify-styles')) return;
    const style = document.createElement('style');
    style.id = 'mph-notify-styles';
    style.textContent = `
      @keyframes mph-toast-in {
        from { opacity: 0; transform: translateX(30px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes mph-toast-out {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(30px); }
      }
      .mph-toast {
        background: #0f0a1c;
        border: 1px solid rgba(168, 107, 255, 0.2);
        border-radius: 10px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
        padding: 14px 16px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        animation: mph-toast-in 0.25s ease-out;
        position: relative;
        overflow: hidden;
        font-family: 'Segoe UI', Arial, sans-serif;
      }
      .mph-toast.mph-toast-closing {
        animation: mph-toast-out 0.2s ease-in forwards;
      }
      .mph-toast-bar {
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 4px;
      }
      .mph-toast-icon { font-size: 1.1rem; line-height: 1.3; flex-shrink: 0; }
      .mph-toast-body { flex: 1; min-width: 0; }
      .mph-toast-msg {
        color: #ffffff;
        font-size: 0.9rem;
        line-height: 1.4;
        word-wrap: break-word;
        margin: 0;
      }
      .mph-toast-close {
        background: none;
        border: none;
        color: #665588;
        font-size: 1.1rem;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        flex-shrink: 0;
        transition: color 0.15s;
      }
      .mph-toast-close:hover { color: #ffffff; }
      .mph-toast-progress {
        position: absolute;
        bottom: 0; left: 0;
        height: 2px;
        background: rgba(168, 107, 255, 0.3);
        animation: mph-progress-shrink linear forwards;
      }
      @keyframes mph-progress-shrink {
        from { width: 100%; }
        to   { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show a toast notification.
   * @param {string} message - The text to display
   * @param {string} type - 'success' | 'error' | 'info' | 'warning' (default: 'info')
   * @param {number} duration - ms before auto-dismiss (default 4500, pass 0 to disable auto-dismiss)
   */
  function notify(message, type = 'info', duration = AUTO_DISMISS_MS) {
    injectStylesOnce();
    const container = ensureContainer();
    const colors = COLORS[type] || COLORS.info;
    const icon = ICONS[type] || ICONS.info;

    const toast = document.createElement('div');
    toast.className = 'mph-toast';
    toast.style.borderColor = colors.border;

    toast.innerHTML = `
      <div class="mph-toast-bar" style="background:${colors.bar};"></div>
      <span class="mph-toast-icon">${icon}</span>
      <div class="mph-toast-body">
        <p class="mph-toast-msg"></p>
      </div>
      <button class="mph-toast-close" aria-label="Close">&times;</button>
      ${duration > 0 ? `<div class="mph-toast-progress" style="background:${colors.bar}; animation-duration:${duration}ms;"></div>` : ''}
    `;

    // Set text via textContent (not innerHTML) to avoid XSS if message includes user input
    toast.querySelector('.mph-toast-msg').textContent = message;

    function closeToast() {
      if (!toast.parentNode) return;
      toast.classList.add('mph-toast-closing');
      setTimeout(() => toast.remove(), 200);
    }

    toast.querySelector('.mph-toast-close').addEventListener('click', closeToast);

    if (duration > 0) {
      setTimeout(closeToast, duration);
    }

    container.appendChild(toast);
  }

  // Expose globally
  global.notify = notify;

})(window);