import React from 'react';

interface TopNavProps {
  difficulty: number;
  onDifficultyChange: (level: number) => void;
  gameMode: 'pva' | 'pvp';
  onGameModeChange: (mode: 'pva' | 'pvp') => void;
  userColor: number;
  onUserColorChange: (color: number) => void;
  majorityRule: boolean;
  onMajorityRuleChange: (enabled: boolean) => void;
  onEditModeToggle: () => void;
  onImportFen: () => void;
  onScreenshot: () => void;
  onExportPDN: () => void;
  onImportPDN: () => void;
}

const TopNav: React.FC<TopNavProps> = ({
  difficulty,
  onDifficultyChange,
  gameMode,
  onGameModeChange,
  userColor,
  onUserColorChange,
  majorityRule,
  onMajorityRuleChange,
  onEditModeToggle,
  onImportFen,
  onScreenshot,
  onExportPDN,
  onImportPDN
}) => {
  return (
    <nav className="top-nav sticky top-0 z-50 w-full border-b border-white/10 bg-hectic-panel backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-hectic-gold">AI Level:</label>
            <select 
              id="difficulty-level" 
              className="nav-select bg-black/30 text-white rounded px-2 py-1 text-sm border border-white/10 cursor-pointer outline-none focus:border-hectic-gold/50"
              value={difficulty}
              onChange={(e) => onDifficultyChange(parseInt(e.target.value))}
            >
              <option value="1">Beginner</option>
              <option value="2">Casual</option>
              <option value="3">Club</option>
              <option value="4">Master</option>
              <option value="5">Grandmaster</option>
              <option value="6">World Class (Ruthless)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-hectic-gold">Mode:</label>
            <select 
              id="game-mode" 
              className="nav-select bg-black/30 text-white rounded px-2 py-1 text-sm border border-white/10 cursor-pointer outline-none focus:border-hectic-gold/50"
              value={gameMode}
              onChange={(e) => onGameModeChange(e.target.value as 'pva' | 'pvp')}
            >
              <option value="pva">Vs. AI</option>
              <option value="pvp">Local PvP</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-hectic-gold">Play As:</label>
            <select 
              id="player-color" 
              className="nav-select bg-black/30 text-white rounded px-2 py-1 text-sm border border-white/10 cursor-pointer outline-none focus:border-hectic-gold/50"
              value={userColor}
              onChange={(e) => onUserColorChange(parseInt(e.target.value))}
            >
              <option value="1">White</option>
              <option value="2">Black</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm group">
              <input 
                type="checkbox" 
                id="max-capture-rule" 
                className="accent-hectic-gold w-4 h-4 cursor-pointer" 
                checked={majorityRule}
                onChange={(e) => onMajorityRuleChange(e.target.checked)}
              />
              <span className="text-white/80 group-hover:text-white transition-colors">Majority Rule</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onExportPDN} className="nav-tab px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10">💾 Save PDN</button>
          <button onClick={onImportPDN} className="nav-tab px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10">📂 Load PDN</button>
          <button onClick={onEditModeToggle} className="nav-tab px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10">✏️ Edit</button>
          <button onClick={onImportFen} className="nav-tab px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10">📥 FEN</button>
          <button onClick={onScreenshot} className="nav-tab px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10">📸 Screenshot</button>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
