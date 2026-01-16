import React from 'react';

const TopNav: React.FC = () => {
  return (
    <nav className="top-nav">
      <div className="nav-container">
        <div className="nav-group">
          <div className="nav-control">
            <label>AI Level:</label>
            <select id="difficulty-level" className="nav-select" defaultValue="6">
              <option value="1">Beginner</option>
              <option value="6">Grandmaster (Ruthless)</option>
            </select>
          </div>
          <div className="nav-control">
            <label>Mode:</label>
            <select id="game-mode" className="nav-select" defaultValue="pva">
              <option value="pva">Vs. AI</option>
              <option value="pvp">Local PvP</option>
            </select>
          </div>
          <div className="nav-control">
            <label className="nav-checkbox">
              <input type="checkbox" id="max-capture-rule" defaultChecked />
              <span>Majority Rule</span>
            </label>
          </div>
        </div>

        <div className="nav-group">
          <button id="edit-mode" className="nav-tab">✏️ Edit</button>
          <button id="import-fen" className="nav-tab">📥 FEN</button>
          <button id="save-png" className="nav-tab">📸 Screenshot</button>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
