import React from 'react';

const AnalysisPanel: React.FC = () => {
  return (
    <div className="control-section analysis p-6 rounded-2xl bg-hectic-panel backdrop-blur-xl border border-white/10" id="analysis-panel">
      <h3 className="text-hectic-gold font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Engine Analysis</h3>
      <div className="space-y-2 font-mono text-sm">
        <div className="flex justify-between">
          <span className="text-white/60">Score:</span> <span id="evaluation-score" className="text-white font-bold">0.0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Best:</span> <span id="best-move" className="text-hectic-gold">--</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Depth:</span> <span id="search-depth" className="text-white">0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Nodes:</span> <span id="search-nodes" className="text-white">0</span>
        </div>
        <div id="material-delta" className="mt-4 pt-2 border-t border-white/10 text-center text-xs uppercase text-hectic-gold/80">Even</div>
      </div>
    </div>
  );
};

export default AnalysisPanel;