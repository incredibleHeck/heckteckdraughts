/**
 * Ruthless Settings Manager
 * - Reactive state management
 * - Decoupled from DOM generation
 * - Batch update support
 */

export class Settings {
  constructor() {
    this.storageKey = "hectic-draughts-settings";
    this.defaults = {
      highlightMoves: true,
      showNumbers: true,
      enableDragDrop: true,
      confirmMoves: false,
      theme: "classic",
      notation: "numeric",
    };

    this.settings = this._load();
    this.listeners = new Map();
  }

  _load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored
        ? { ...this.defaults, ...JSON.parse(stored) }
        : { ...this.defaults };
    } catch (e) {
      return { ...this.defaults };
    }
  }

  /**
   * Get a setting value
   */
  get(key) {
    return this.settings[key];
  }

  /**
   * Atomic Update with Notification
   */
  set(key, value) {
    if (this.settings[key] === value) return;

    this.settings[key] = value;
    localStorage.setItem(this.storageKey, JSON.stringify(this.settings));

    // Notify specific key listeners (e.g., just 'showNumbers')
    this._emit(key, value);
    // Notify global listeners
    this._emit("change", this.settings);
  }

  /**
   * Observer Pattern Implementation
   */
  onChange(key, callback) {
    if (!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key).push(callback);
  }

  _emit(key, data) {
    const callbacks = this.listeners.get(key);
    if (callbacks) callbacks.forEach((cb) => cb(data));
  }

  reset() {
    this.settings = { ...this.defaults };
    localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    this._emit("change", this.settings);
  }
}
