import React from 'react';
import { PIECE } from '@/engine/constants';
import clsx from 'clsx';

interface PieceProps {
  type: PIECE;
  row: number;
  col: number;
  squareSize: number; // in percentage
  borderOffset: number; // in percentage
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

  const x = borderOffset + col * squareSize;
  const y = borderOffset + row * squareSize;

  return (
    <div
      className={clsx(
        'piece absolute z-10 will-change-transform transition-all duration-300 ease-in-out pointer-events-none',
        isDragging && 'z-50 scale-110'
      )}
      style={{
        width: `${squareSize}%`,
        height: `${squareSize}%`,
        left: `${x}%`,
        top: `${y}%`,
        backgroundImage: `url("/images/${getPieceImage(type)}")`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))'
      }}
    />
  );
};

export default Piece;
