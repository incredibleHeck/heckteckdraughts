/**
 * Ruthless DOM Helpers
 * - Optimized for zero-stutter rendering
 * - Uses DocumentFragments for mass updates
 * - Targeted CSS Variable manipulation
 */

/**
 * Creates a DOM element with specified attributes and properties
 */
export function createElement(tag, attributes = {}, properties = {}) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== null && value !== undefined) element.setAttribute(key, value);
  });
  Object.entries(properties).forEach(([key, value]) => {
    element[key] = value;
  });
  return element;
}

/**
 * Creates a game board square element
 * Optimized: Now includes Z-index and layout hints
 */
export function createSquare(row, col, isDark) {
  return createElement("div", {
    class: `square ${isDark ? "dark" : "light"}`,
    "data-row": row,
    "data-col": col,
    style: `--row: ${row}; --col: ${col};`, // Uses CSS variables for animation
  });
}

/**
 * Creates a game piece element
 * Optimized: Uses transform-based positioning for smooth animations
 */
export function createPiece(pieceType, isKing, row, col) {
  const isBlack = pieceType === 2 || pieceType === 4;
  const piece = createElement("div", {
    class: `piece ${isBlack ? "black" : "white"}${isKing ? " king" : ""}`,
    style: `transform: translate(calc(${col} * 100%), calc(${row} * 100%));`,
    "data-piece-id": `p-${row}-${col}`,
  });

  if (isKing) {
    piece.appendChild(createElement("div", { class: "crown" }));
  }

  return piece;
}

/**
 * Mass History Update
 * Optimized: Uses DocumentFragment to prevent 50+ reflows
 */
export function updateMoveHistory(elementId, moves, currentMove) {
  const container = document.getElementById(elementId);
  if (!container) return;

  const fragment = document.createDocumentFragment();

  // Group moves by pairs (White/Black) for standard notation look
  for (let i = 0; i < moves.length; i += 2) {
    const turnNum = Math.floor(i / 2) + 1;
    const row = createElement("div", { class: "history-row" });

    row.appendChild(
      createElement(
        "span",
        { class: "turn-number" },
        { textContent: `${turnNum}.` }
      )
    );

    // White Move
    row.appendChild(createMoveSpan(moves[i], i, currentMove));

    // Black Move (if exists)
    if (moves[i + 1]) {
      row.appendChild(createMoveSpan(moves[i + 1], i + 1, currentMove));
    }

    fragment.appendChild(row);
  }

  container.replaceChildren(fragment); // Instant swap, no "innerHTML" flickering

  // Targeted scroll
  const current = container.querySelector(".current");
  if (current) current.scrollIntoView({ behavior: "auto", block: "nearest" });
}

function createMoveSpan(move, index, currentMove) {
  return createElement(
    "span",
    {
      class: `move-item${index === currentMove ? " current" : ""}`,
      "data-index": index,
    },
    { textContent: move.notation }
  );
}

/**
 * Evaluation Gauge Update
 * Optimized: Uses CSS variables for the evaluation bar
 */
export function updateEvaluationUI(gaugeId, score) {
  const gauge = document.getElementById(gaugeId);
  if (!gauge) return;

  // Convert centipawns to percentage (0 = white wins, 100 = black wins, 50 = draw)
  // Clamp score between -5 and +5 for the visual bar
  const clampedScore = Math.max(-500, Math.min(500, score));
  const percentage = 50 - clampedScore / 10;

  gauge.style.setProperty("--eval-percent", `${percentage}%`);
}
