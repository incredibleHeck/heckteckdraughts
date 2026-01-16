import React, { useMemo } from 'react';
import { BOARD_SIZE, SQUARE_NUMBERS, isDarkSquare, PIECE } from '@/engine/constants';
import Piece from './Piece';
import clsx from 'clsx';

interface BoardProps {
  pieces?: Int8Array[];
  onSquareClick?: (row: number, col: number) => void;
  onMoveAttempt?: (from: { row: number; col: number }, to: { row: number; col: number }) => void;
  selectedSquare?: { row: number; col: number } | null;
  highlights?: { row: number; col: number; type: 'selected' | 'hint' | 'last-move' }[];
}

const Board: React.FC<BoardProps> = ({ pieces, onSquareClick, onMoveAttempt, selectedSquare, highlights = [] }) => {
  // Constants from legacy board-renderer
  const BORDER_PERCENT = 2.3;
  const PLAYING_AREA_PERCENT = 100 - BORDER_PERCENT * 2;
  const SQUARE_PERCENT = PLAYING_AREA_PERCENT / BOARD_SIZE;

  const handleSquareClick = (row: number, col: number) => {
    if (selectedSquare) {
      if (selectedSquare.row !== row || selectedSquare.col !== col) {
        onMoveAttempt?.(selectedSquare, { row, col });
      } else {
        onSquareClick?.(row, col); // Toggle selection
      }
    } else {
      onSquareClick?.(row, col);
    }
  };

  const squares = useMemo(() => {
    const items = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const dark = isDarkSquare(row, col);
        const squareNumber = SQUARE_NUMBERS[row * BOARD_SIZE + col];
        
        const highlight = highlights.find(h => h.row === row && h.col === col);
        const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;

        items.push(
          <div
            key={`${row}-${col}`}
            className={clsx(
              'board-square absolute flex items-center justify-center transition-all duration-200 z-20',
              dark && 'playable cursor-pointer',
              isSelected && 'selected-square bg-hectic-gold/30 shadow-[inset_0_0_20px_rgba(255,200,87,0.6)] ring-2 ring-hectic-gold',
              highlight?.type === 'hint' && 'after:content-[""] after:block after:w-3 after:h-3 after:bg-white/30 after:rounded-full after:shadow-lg hover:after:bg-hectic-gold/50',
              highlight?.type === 'last-move' && 'bg-hectic-gold/20'
            )}
            style={{
              width: `${SQUARE_PERCENT}%`,
              height: `${SQUARE_PERCENT}%`,
              left: `${BORDER_PERCENT + col * SQUARE_PERCENT}%`,
              top: `${BORDER_PERCENT + row * SQUARE_PERCENT}%`,
            }}
            onClick={() => dark && handleSquareClick(row, col)}
          >
            {dark && (
              <span className="square-number absolute top-1 left-1 text-[8px] opacity-20 pointer-events-none font-mono">
                {squareNumber}
              </span>
            )}
          </div>
        );
      }
    }
    return items;
  }, [highlights, selectedSquare, handleSquareClick]);

  const renderedPieces = useMemo(() => {
    if (!pieces) return null;
    const items = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const type = pieces[r][c];
        if (type !== PIECE.NONE) {
          items.push(
            <Piece
              key={`${r}-${c}`}
              type={type}
              row={r}
              col={c}
              squareSize={SQUARE_PERCENT}
              borderOffset={BORDER_PERCENT}
            />
          );
        }
      }
    }
    return items;
  }, [pieces, SQUARE_PERCENT, BORDER_PERCENT]);

  return (
    <main className="board-panel flex-1 flex justify-center py-8">
      <div className="game-board-container relative p-6 rounded-2xl bg-hectic-panel backdrop-blur-xl border border-white/10 shadow-2xl">
        {/* Evaluation Gauge */}
        <div className="evaluation-gauge absolute -left-6 top-0 bottom-0 w-3 bg-[#34495e] rounded-full overflow-hidden border border-white/10">
          <div 
            className="evaluation-gauge-fill absolute bottom-0 w-full bg-[#ecf0f1] transition-all duration-700 ease-out" 
            style={{ height: '50%' }}
          ></div>
        </div>

        {/* The Board */}
        <div 
          id="game-board" 
          className="game-board relative w-[600px] aspect-square border-4 border-black/50 shadow-inner overflow-hidden"
          style={{
            backgroundImage: 'url("/images/flipped_board.jpg")',
            backgroundSize: '100% 100%',
          }}
        >
          {squares}
          {renderedPieces}
        </div>

        {/* Controls */}
        <div className="game-controls flex justify-center gap-4 mt-6">
          <button className="nav-button p-3 rounded-lg bg-white/5 hover:bg-hectic-gold hover:text-black transition-all border border-white/10 shadow-lg">|&laquo;</button>
          <button className="nav-button p-3 rounded-lg bg-white/5 hover:bg-hectic-gold hover:text-black transition-all border border-white/10 shadow-lg">&larr;</button>
          <button className="nav-button p-3 rounded-lg bg-white/5 hover:bg-hectic-gold hover:text-black transition-all border border-white/10 shadow-lg">&rarr;</button>
          <button className="nav-button p-3 rounded-lg bg-white/5 hover:bg-hectic-gold hover:text-black transition-all border border-white/10 shadow-lg">&raquo;|</button>
        </div>
      </div>
    </main>
  );
};

export default Board;
