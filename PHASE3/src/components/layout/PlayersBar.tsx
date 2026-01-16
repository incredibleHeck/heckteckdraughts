import React from 'react';

const PlayersBar: React.FC = () => {
  return (
    <div className="players-bar">
      <div className="player-card white-player">
        <div className="player-name">White</div>
        <div className="graveyard" id="white-graveyard"></div>
        <div className="player-stats">
          <span className="timer" id="white-timer">05:00</span>
        </div>
      </div>

      <div className="vs-separator">VS</div>

      <div className="player-card black-player">
        <div className="player-name">Black</div>
        <div className="graveyard" id="black-graveyard"></div>
        <div className="player-stats">
          <span className="timer" id="black-timer">05:00</span>
        </div>
      </div>
    </div>
  );
};

export default PlayersBar;
