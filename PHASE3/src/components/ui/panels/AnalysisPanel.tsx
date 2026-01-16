import React from 'react';

const AnalysisPanel: React.FC = () => {
  return (
    <div className="control-section analysis" id="analysis-panel">
      <h3>Engine Analysis</h3>
      <div className="evaluation">
        <span>Score:</span> <span id="evaluation-score">0.0</span>
      </div>
      <div className="evaluation">
        <span>Best:</span> <span id="best-move">--</span>
      </div>
      <div className="evaluation">
        <span>Depth:</span> <span id="search-depth">0</span>
      </div>
      <div className="evaluation">
        <span>Nodes:</span> <span id="search-nodes">0</span>
      </div>
      <div id="material-delta">Even</div>
    </div>
  );
};

export default AnalysisPanel;
