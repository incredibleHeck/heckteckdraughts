/**
 * Ruthless Notification System
 * - Decoupled Styling (CSS Class Based)
 * - Atomic Multi-Notification Support
 * - Targetable IDs for specific game states
 */

export class Notification {
  constructor() {
    this.container = document.getElementById("notification-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "notification-container";
      document.body.appendChild(this.container);
    }
    this.activeNotifications = new Map();
  }

  /**
   * Show a notification and return a unique ID
   */
  show(message, options = {}) {
    const {
      type = "info",
      duration = 3000,
      id = Date.now().toString(),
    } = options;

    // Create element
    const el = document.createElement("div");
    el.className = `notification ${type}`;
    el.innerHTML = `<span class="notif-text">${message}</span>`;

    // Add to DOM
    this.container.appendChild(el);
    this.activeNotifications.set(id, el);

    // Trigger Entrance Animation (handled by CSS)
    requestAnimationFrame(() => el.classList.add("show"));

    // Auto-close if duration is set
    if (duration > 0) {
      setTimeout(() => this.close(id), duration);
    }

    return id; // Return ID so caller can close it manually
  }

  /**
   * Close a specific notification by ID
   */
  close(id) {
    const el = this.activeNotifications.get(id);
    if (!el) return;

    el.classList.remove("show");
    el.addEventListener(
      "transitionend",
      () => {
        el.remove();
        this.activeNotifications.delete(id);
      },
      { once: true }
    );
  }

  // Helper Methods for the Engine
  success(msg, opts) {
    return this.show(msg, { ...opts, type: "success" });
  }
  warning(msg, opts) {
    return this.show(msg, { ...opts, type: "warning" });
  }
  error(msg, opts) {
    return this.show(msg, { ...opts, type: "error" });
  }
  info(msg, opts) {
    return this.show(msg, { ...opts, type: "info" });
  }

  /**
   * Specific to AI Thinking state
   */
  clearAll() {
    this.activeNotifications.forEach((_, id) => this.close(id));
  }
}
