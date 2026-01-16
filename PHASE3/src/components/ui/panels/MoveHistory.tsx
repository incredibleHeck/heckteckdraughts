import React from 'react';

const MoveHistory: React.FC = () => {
  return (
    <div className="control-section move-log p-6 rounded-2xl bg-hectic-panel backdrop-blur-xl border border-white/10 flex-1 flex flex-col min-h-0">
      <h3 className="text-hectic-gold font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Move History</h3>
      <div id="move-history" className="flex-1 overflow-y-auto font-mono text-sm custom-scrollbar">
          {/* Move list will be rendered here */}
          <div className="opacity-30 italic text-center py-8">No moves recorded</div>
      </div>
    </div>
  );
};

export default MoveHistory;