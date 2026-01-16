import React, { useEffect, useRef } from 'react';
import { Move } from '@/engine/ai/ai.utils';
import { SQUARE_NUMBERS, BOARD_SIZE } from '@/engine/constants';

interface MoveHistoryProps {
  moves: any[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  const getNotation = (move: Move) => {
    const from = SQUARE_NUMBERS[move.from.row * BOARD_SIZE + move.from.col];
    const to = SQUARE_NUMBERS[move.to.row * BOARD_SIZE + move.to.col];
    const separator = move.captures.length > 0 ? 'x' : '-';
    return `${from}${separator}${to}`;
  };

  return (
    <div className="control-section move-log p-6 rounded-2xl bg-hectic-panel backdrop-blur-xl border border-white/10 flex-1 flex flex-col min-h-0">
      <h3 className="text-hectic-gold font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Move History</h3>
      <div 
        ref={scrollRef}
        id="move-history" 
        className="flex-1 overflow-y-auto font-mono text-sm custom-scrollbar space-y-1"
      >
        {moves.length === 0 ? (
          <div className="opacity-30 italic text-center py-8">No moves recorded</div>
        ) : (
          <div className="grid grid-cols-[30px_1fr_1fr] gap-x-2 text-center border-b border-white/5 pb-1 mb-2 opacity-50 text-[10px]">
            <span>#</span>
            <span>White</span>
            <span>Black</span>
          </div>
        )}
        
        {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => (
          <div key={i} className="grid grid-cols-[30px_1fr_1fr] gap-x-2 py-1 border-b border-white/5 hover:bg-white/5 transition-colors rounded">
            <span className="text-white/30 text-[10px] flex items-center justify-center">{i + 1}.</span>
            <span className="text-hectic-gold font-bold">{getNotation(moves[i * 2].move)}</span>
            {moves[i * 2 + 1] && (
              <span className="text-white font-bold">{getNotation(moves[i * 2 + 1].move)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoveHistory;