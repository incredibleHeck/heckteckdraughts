/**
 * Ruthless AI Controller
 * The Bridge between the UI and the High-Performance Worker.
 * * * Features:
 * - Robust Worker Instantiation (Module-based)
 * - Request/Response correlation (Promises)
 * - Stat forwarding (Depth, Nodes, NPS)
 */

export class AIController {
  constructor() {
    this.worker = null;
    this.requestId = 0;
    this.pending = new Map();
    this.ready = false;

    // Singleton initialization promise
    this.bootPromise = null;
  }

  /**
   * Boot the Engine
   */
  async init() {
    if (this.bootPromise) return this.bootPromise;

    this.bootPromise = new Promise((resolve, reject) => {
      try {
        // Modern Module Worker Import
        this.worker = new Worker(
          new URL("./src/engine/ai/ai-worker.js", import.meta.url),
          { type: "module" }
        );

        this.worker.onerror = (err) => {
          console.error("🔥 AI Worker Crashed:", err);
          reject(err);
        };

        this.worker.onmessage = (e) => this._handleMessage(e, resolve);

        // Ping the worker to start
        this._send("initialize");
      } catch (e) {
        console.error("Failed to spawn AI Worker:", e);
        reject(e);
      }
    });

    return this.bootPromise;
  }

  /**
   * Request a Move
   * @param {Object} position - The current board state { pieces, currentPlayer }
   * @returns {Promise<Object>} - { move, stats }
   */
  async getBestMove(position) {
    if (!this.ready) await this.init();

    // Strip UI-specific data from position (Optimization)
    const cleanPosition = {
      pieces: position.pieces,
      currentPlayer: position.currentPlayer,
    };

    return this._sendRequest("getMove", { position: cleanPosition });
  }

  /**
   * Set Difficulty (1-6)
   */
  setDifficulty(level) {
    // Fire and forget (no await needed usually, but we track it internally)
    this._send("setDifficulty", { level });
  }

  /**
   * Reset/New Game
   */
  newGame() {
    this._send("newGame");
  }

  /**
   * Get Engine Diagnostics (Memory Usage, etc)
   */
  getStats() {
    this._send("getStatus");
  }

  terminate() {
    if (this.worker) this.worker.terminate();
    this.worker = null;
    this.ready = false;
    this.bootPromise = null;
  }

  // ============================================================
  // INTERNAL MESSAGING
  // ============================================================

  _send(type, data = {}) {
    if (this.worker) {
      this.worker.postMessage({ type, data, requestId: 0 });
    }
  }

  _sendRequest(type, data = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ type, data, requestId: id });
    });
  }

  _handleMessage(e, initResolve) {
    const { type, data, requestId, error } = e.data;

    // 1. Initialization Handshake
    if (type === "initialized") {
      console.log(`✅ ${data.version} Online.`);
      this.ready = true;
      if (initResolve) initResolve();
      return;
    }

    // 2. Request/Response Handling
    if (requestId && this.pending.has(requestId)) {
      const { resolve, reject } = this.pending.get(requestId);
      this.pending.delete(requestId);

      if (error) {
        console.error("AI Error:", error);
        reject(new Error(error));
      } else {
        // For 'moveResult', we resolve with the whole data object
        // containing { move, stats } so the UI can show nodes/depth.
        resolve(data);
      }
      return;
    }

    // 3. One-way Updates (Logs, Status)
    if (type === "statusResult") {
      console.log("📊 Engine Stats:", data);
    }
  }
}

// Export Singleton
export const AI = new AIController();
