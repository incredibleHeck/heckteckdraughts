import React from 'react';

const PlayersBar: React.FC = () => {
  return (
    <div className="players-bar flex items-center justify-center gap-8 py-4 px-6 bg-hectic-panel/50 backdrop-blur-sm border-b border-white/5">
      <div className="player-card white-player flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 min-w-[200px]">
        <div className="player-name text-lg font-bold text-white uppercase tracking-wider">White</div>
        <div className="graveyard flex flex-wrap gap-1 p-2 bg-black/30 rounded-lg min-h-[40px] w-full" id="white-graveyard"></div>
        <div className="player-stats">
          <span className="timer font-mono text-2xl text-hectic-gold" id="white-timer">05:00</span>
        </div>
      </div>

      <div className="vs-separator text-hectic-gold font-black italic text-xl opacity-50">VS</div>

      <div className="player-card black-player flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 min-w-[200px]">
        <div className="player-name text-lg font-bold text-white uppercase tracking-wider">Black</div>
        <div className="graveyard flex flex-wrap gap-1 p-2 bg-black/30 rounded-lg min-h-[40px] w-full" id="black-graveyard"></div>
        <div className="player-stats">
          <span className="timer font-mono text-2xl text-hectic-gold" id="black-timer">05:00</span>
        </div>
      </div>
    </div>
  );
};

export default PlayersBar;