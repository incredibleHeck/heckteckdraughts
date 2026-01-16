import { useState, useCallback, useEffect, useMemo } from 'react'
import LoadingScreen from '@/components/ui/LoadingScreen'
import MainLayout from '@/components/layout/MainLayout'
import AnalysisPanel from '@/components/ui/panels/AnalysisPanel'
import MoveHistory from '@/components/ui/panels/MoveHistory'
import Board from '@/components/board/Board'
import { useEngine } from '@/hooks/useEngine'
import { Game } from '@/engine/game'
import { Move, isSameMove } from '@/engine/ai/ai.utils'
import { PLAYER, SQUARE_NUMBERS, BOARD_SIZE } from '@/engine/constants'
import { AI_CONFIG } from '@/engine/ai/ai.constants'

function App() {
  // --- Game Settings State ---
  const [difficulty, setDifficulty] = useState(6); // Default World Class
  const [gameMode, setGameMode] = useState<'pva' | 'pvp'>('pva');
  const [userColor, setUserColor] = useState<number>(PLAYER.WHITE);
  const [majorityRule, setMajorityRule] = useState(true);

  // --- Engine Bridge ---
  const { isReady, lastResult, findBestMove, abort } = useEngine();
  const [isThinking, setIsThinking] = useState(false);
  const [engineStats, setEngineStats] = useState<any>(null);

  // --- Game Logic State ---
  const [game] = useState(() => {
    console.log('[App] Initializing Game Engine');
    return new Game();
  });
  const [pieces, setPieces] = useState(game.pieces);
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [highlights, setHighlights] = useState<{row: number, col: number, type: 'selected' | 'hint' | 'last-move'}[]>([]);
  const [moveHistory, setMoveHistory] = useState<any[]>([]);

  // --- Helpers ---
  const refreshBoard = useCallback(() => {
    setPieces([...game.pieces.map(row => new Int8Array(row))]);
    setMoveHistory([...game.moveHistory]);
  }, [game]);

  const translateMoveToNotation = (move: Move) => {
    const from = SQUARE_NUMBERS[move.from.row * BOARD_SIZE + move.from.col];
    const to = SQUARE_NUMBERS[move.to.row * BOARD_SIZE + move.to.col];
    const sep = move.captures.length > 0 ? 'x' : '-';
    return `${from}${sep}${to}`;
  };

  const handleUserColorChange = (color: number) => {
    setUserColor(color);
    game.reset(); // Reset game when color changes
    refreshBoard();
    setHighlights([]);
    setSelectedSquare(null);
  };

  // --- AI Trigger Logic ---
  useEffect(() => {
    const isAITurn = gameMode === 'pva' && game.currentPlayer !== userColor;
    
    if (isAITurn && isReady && !isThinking) {
      console.log('[App] Triggering AI Move');
      setIsThinking(true);
      
      const config = AI_CONFIG.DIFFICULTY_LEVELS[difficulty];
      const history = game.moveHistory.map(h => h.move);
      findBestMove(game.toPosition(), config.maxDepth, config.timeLimit, history);
    }
  }, [game.currentPlayer, gameMode, isReady, difficulty, findBestMove, game, userColor, isThinking]);

  // --- AI Result Handler ---
  useEffect(() => {
    if (lastResult) {
      console.log('[App] AI Move Received:', lastResult);
      setIsThinking(false);
      setEngineStats(lastResult);

      if (lastResult.move) {
        // Execute AI move with a small delay for better UX
        setTimeout(() => {
          game.makeMove(lastResult.move);
          refreshBoard();
          setHighlights([{ 
            row: lastResult.move.to.row, 
            col: lastResult.move.to.col, 
            type: 'last-move' 
          }]);
        }, 500);
      }
    }
  }, [lastResult, game, refreshBoard]);

  // --- Human Interactions ---
  const handleSquareClick = (row: number, col: number) => {
    if (isThinking) return;

    const piece = game.pieces[row][col];
    
    if (selectedSquare && (selectedSquare.row === row && selectedSquare.col === col)) {
      setSelectedSquare(null);
      setHighlights([]);
      return;
    }

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
  };

  const handleMoveAttempt = (from: {row: number, col: number}, to: {row: number, col: number}) => {
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
  };

  return (
    <>
      <LoadingScreen />
      <MainLayout
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        gameMode={gameMode}
        onGameModeChange={setGameMode}
        userColor={userColor}
        onUserColorChange={handleUserColorChange}
        majorityRule={majorityRule}
        onMajorityRuleChange={setMajorityRule}
      >
        <aside className="left-panel">
          <AnalysisPanel 
            score={engineStats?.score}
            bestMove={engineStats?.move ? translateMoveToNotation(engineStats.move) : '--'}
            depth={engineStats?.stats?.depth}
            nodes={engineStats?.stats?.nodes}
            isThinking={isThinking}
          />
          <MoveHistory moves={moveHistory} />
        </aside>
        <Board 
          pieces={pieces}
          selectedSquare={selectedSquare}
          highlights={highlights}
          onSquareClick={handleSquareClick}
          onMoveAttempt={handleMoveAttempt}
        />
      </MainLayout>
    </>
  )
}

export default App