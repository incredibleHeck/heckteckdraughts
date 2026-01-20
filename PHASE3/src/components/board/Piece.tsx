import React from 'react';
import { PIECE } from '@/engine/constants';
import clsx from 'clsx';

interface PieceProps {
  type: PIECE;
  row: number;
  col: number;
  squareSize: number; // in percentage (used for width/height)
  borderOffset: number; // in percentage (used for origin)
  isDragging?: boolean;
}

const Piece: React.FC<PieceProps> = ({ type, row, col, squareSize, borderOffset, isDragging }) => {
  if (type === PIECE.NONE) return null;

  const getPieceImage = (t: PIECE) => {
    switch (t) {
      case PIECE.WHITE: return 'white_piece.png';
      case PIECE.WHITE_KING: return 'white_king.png';
      case PIECE.BLACK: return 'black_piece.png';
      case PIECE.BLACK_KING: return 'black_king.png';
      default: return '';
    }
  };

  // GPU Acceleration Optimization:
  // Instead of changing top/left (which triggers Layout), we use transform (Compositing only).
  // Origin is set to the top-left of the playing area (borderOffset).
  // Translation is calculated as (col * 100%, row * 100%) relative to the piece's own size.
  
  const style: React.CSSProperties = {
    width: `${squareSize}%`,
    height: `${squareSize}%`,
    left: `${borderOffset}%`,
    top: `${borderOffset}%`,
    transform: `translate(${col * 100}%, ${row * 100}%) scale(${isDragging ? 1.1 : 1})`,
    backgroundImage: `url("/images/${getPieceImage(type)}")`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))'
  };

  return (
    <div
      className={clsx(
        'piece absolute z-10 will-change-transform transition-transform duration-300 ease-in-out pointer-events-none',
        isDragging && 'z-50'
      )}
      style={style}
    />
  );
};

export default Piece;