import React from 'react';
import clsx from 'clsx';

interface AnalysisPanelProps {
  score?: number;
  bestMove?: string;
  depth?: number;
  nodes?: number;
  isThinking?: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  score = 0,
  bestMove = '--',
  depth = 0,
  nodes = 0,
  isThinking = false
}) => {
  return (
    <div className="control-section analysis p-6 rounded-2xl bg-hectic-panel backdrop-blur-xl border border-white/10" id="analysis-panel">
      <h3 className="text-hectic-gold font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center justify-between">
        Engine Analysis
        {isThinking && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hectic-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-hectic-gold"></span>
          </span>
        )}
      </h3>
      <div className="space-y-2 font-mono text-sm">
        <div className="flex justify-between">
          <span className="text-white/60">Score:</span> 
          <span id="evaluation-score" className={clsx("font-bold", score > 0 ? "text-green-400" : score < 0 ? "text-red-400" : "text-white")}>
            {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Best:</span> 
          <span id="best-move" className="text-hectic-gold font-bold">{bestMove}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Depth:</span> 
          <span id="search-depth" className="text-white">{depth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Nodes:</span> 
          <span id="search-nodes" className="text-white">{nodes.toLocaleString()}</span>
        </div>
        <div id="material-delta" className="mt-4 pt-2 border-t border-white/10 text-center text-xs uppercase text-hectic-gold/80 font-bold">
          {score === 0 ? 'Even' : score > 0 ? 'White is Winning' : 'Black is Winning'}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;