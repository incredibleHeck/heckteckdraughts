import { useState, useCallback, useEffect, useRef } from 'react';
import { Game } from '@/engine/game';
import { useEngine } from './useEngine';
import { AI_CONFIG } from '@/engine/ai-config';
import { PLAYER, SQUARE_NUMBERS, BOARD_SIZE, PIECE } from '@/engine/constants';
import { Move } from '@/engine/board';
import { PDNGenerator } from '@/utils/pdn-generator';
import { PDNParser } from '@/utils/pdn-parser';

export const useGameController = () => {
  // --- Game Settings ---
  const [difficulty, setDifficulty] = useState(6);
  const [gameMode, setGameMode] = useState<'pva' | 'pvp'>('pva');
  const [userColor, setUserColor] = useState<number>(PLAYER.WHITE);
  const [majorityRule, setMajorityRule] = useState(true);

  // --- Engine Bridge ---
  const { isReady, lastResult, findBestMove, abort } = useEngine();
  const [isThinking, setIsThinking] = useState(false);
  const [engineStats, setEngineStats] = useState<any>(null);

  // --- Game State ---
  // We use a ref for the game instance to ensure it persists across renders without recreation
  // but we also need state to trigger re-renders when the game state changes.
  const gameRef = useRef<Game>(new Game());
  const game = gameRef.current; // Shortcut

  const [pieces, setPieces] = useState<Int8Array[]>(() => {
    // Initial Copy
    return game.pieces.map(row => new Int8Array(row));
  });
  
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [highlights, setHighlights] = useState<{row: number, col: number, type: 'selected' | 'hint' | 'last-move'}[]>([]);
  const [gameUpdateKey, setGameUpdateKey] = useState(0);

  // --- Helpers ---
  const refreshBoard = useCallback(() => {
    // We must copy the pieces to trigger React updates
    setPieces(game.pieces.map(row => new Int8Array(row)));
    setMoveHistory([...game.moveHistory]);
    setGameUpdateKey(k => k + 1);
  }, [game]);

  const handleUserColorChange = useCallback((color: number) => {
    setUserColor(color);
    game.reset();
    game.currentPlayer = PLAYER.WHITE; // Always white starts? Or user starts? 
    // Usually White starts. If User is Black, AI is White and should move immediately.
    // We'll handle AI trigger in useEffect.
    refreshBoard();
    setHighlights([]);
    setSelectedSquare(null);
    setEngineStats(null);
  }, [game, refreshBoard]);

  // --- PDN Handlers ---
  const handleExportPDN = useCallback(() => {
    const pdn = PDNGenerator.generate(game);
    const blob = new Blob([pdn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${new Date().toISOString().split('T')[0]}.pdn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [game]);

  const handleImportPDN = useCallback(() => {
    const input = window.prompt("Paste PDN data here:");
    if (!input) return;

    try {
        const moves = PDNParser.parse(input);
        game.reset();
        
        // Replay moves
        // We need to execute moves on the game logic to ensure state/history is consistent
        // PDNParser returns Move objects.
        for (const move of moves) {
            game.makeMove(move);
        }
        refreshBoard();
        alert("Game loaded successfully!");
    } catch (e) {
        console.error(e);
        alert("Failed to load PDN: " + (e as Error).message);
    }
  }, [game, refreshBoard]);

  // --- Interaction Logic ---
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (isThinking) return;
    if (game.gameState !== 'ongoing') return;

    // Prevent moving for AI
    if (gameMode === 'pva' && game.currentPlayer !== userColor) return;

    const piece = game.getPiece(row, col);
    
    // Toggle Selection
    if (selectedSquare && (selectedSquare.row === row && selectedSquare.col === col)) {
      setSelectedSquare(null);
      setHighlights([]);
      return;
    }

    // Select Own Piece
    if (game.isPieceOfCurrentPlayer(piece)) {
      setSelectedSquare({ row, col });
      
      const legalMoves = game.getLegalMoves();
      const pieceMoves = legalMoves.filter(m => m.from.row === row && m.from.col === col);
      
      setHighlights(pieceMoves.map(m => ({
        row: m.to.row,
        col: m.to.col,
        type: 'hint' as const
      })));
    }
  }, [isThinking, game, gameMode, userColor, selectedSquare]);

  const handleMoveAttempt = useCallback((from: {row: number, col: number}, to: {row: number, col: number}) => {
    if (isThinking) return;
    
    const legalMoves = game.getLegalMoves();
    const move = legalMoves.find(m => 
      m.from.row === from.row && m.from.col === from.col && 
      m.to.row === to.row && m.to.col === to.col
    );

    if (move) {
      const success = game.makeMove(move);
      if (success) {
        refreshBoard();
        setSelectedSquare(null);
        setHighlights([{ row: to.row, col: to.col, type: 'last-move' as const }]);
      }
    } else {
      setSelectedSquare(null);
      setHighlights([]);
    }
  }, [isThinking, game, refreshBoard]);

  // --- AI Loop ---
  const isThinkingRef = useRef(false);

  useEffect(() => {
    const isAITurn = gameMode === 'pva' && game.currentPlayer !== userColor;
    
    if (isAITurn && isReady && !isThinkingRef.current && game.gameState === 'ongoing') {
      isThinkingRef.current = true;
      setIsThinking(true);
      
      const config = AI_CONFIG.DIFFICULTY_LEVELS[difficulty];
      const history = game.moveHistory.map(h => h.move);
      
      // Small delay for UX
      setTimeout(() => {
         findBestMove(game.toPosition(), config.maxDepth, config.timeLimit, history);
      }, 500);
    }
  }, [gameUpdateKey, isReady, gameMode, userColor, difficulty, findBestMove, game]);

  // --- AI Response ---
  useEffect(() => {
    if (lastResult) {
      setEngineStats(lastResult);

      if (lastResult.move) {
          const success = game.makeMove(lastResult.move);
          if (success) {
            refreshBoard();
            setHighlights([{ 
              row: lastResult.move.to.row, 
              col: lastResult.move.to.col, 
              type: 'last-move' 
            }]);
          }
      }
      isThinkingRef.current = false;
      setIsThinking(false);
    }
  }, [lastResult, game, refreshBoard]);

  return {
    // Settings
    difficulty, setDifficulty,
    gameMode, setGameMode,
    userColor, handleUserColorChange,
    majorityRule, setMajorityRule,
    
    // State
    pieces,
    moveHistory,
    selectedSquare,
    highlights,
    isThinking,
    engineStats,
    
    // Actions
    handleSquareClick,
    handleMoveAttempt,
    handleExportPDN,
    handleImportPDN
  };
};