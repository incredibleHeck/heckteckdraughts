import React from 'react';

const Board: React.FC = () => {
  return (
    <main className="board-panel">
      <div className="game-board-container">
        <div className="evaluation-gauge" id="evaluation-gauge-container">
          <div className="evaluation-gauge-fill" id="evaluation-gauge-fill" style={{ height: '50%' }}></div>
        </div>

        <div id="game-board" className="game-board">
            {/* Placeholder for the actual board implementation */}
            <div style={{ width: '500px', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333' }}>
                Board Placeholder (10x10)
            </div>
        </div>

        <div className="game-controls">
          <button id="first-move" className="nav-button">|&laquo;</button>
          <button id="undo" className="nav-button">&larr;</button>
          <button id="redo" className="nav-button">&rarr;</button>
          <button id="last-move" className="nav-button">&raquo;|</button>
        </div>
      </div>
    </main>
  );
};

export default Board;
