import React from 'react';

const TopNav: React.FC = () => {
  return (
    <nav className="top-nav sticky top-0 z-50 w-full border-b border-white/10 bg-hectic-panel backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-hectic-gold">AI Level:</label>
            <select id="difficulty-level" className="nav-select bg-black/30 text-white rounded px-2 py-1 text-sm border border-white/10" defaultValue="6">
              <option value="1">Beginner</option>
              <option value="6">Grandmaster (Ruthless)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-hectic-gold">Mode:</label>
            <select id="game-mode" className="nav-select bg-black/30 text-white rounded px-2 py-1 text-sm border border-white/10" defaultValue="pva">
              <option value="pva">Vs. AI</option>
              <option value="pvp">Local PvP</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" id="max-capture-rule" className="accent-hectic-gold" defaultChecked />
              <span className="text-white/80">Majority Rule</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button id="edit-mode" className="nav-tab px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10">✏️ Edit</button>
          <button id="import-fen" className="nav-tab px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10">📥 FEN</button>
          <button id="save-png" className="nav-tab px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10">📸 Screenshot</button>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;