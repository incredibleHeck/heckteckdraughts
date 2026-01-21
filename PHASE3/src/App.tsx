import React from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import MainLayout from '@/components/layout/MainLayout';
import AnalysisPanel from '@/components/ui/panels/AnalysisPanel';
import MoveHistory from '@/components/ui/panels/MoveHistory';
import Board from '@/components/board/Board';
import { useGameController } from '@/hooks/useGameController';
import { SQUARE_NUMBERS, BOARD_SIZE } from '@/engine/constants';
import { Move } from '@/engine/board';

function App() {
  const {
    difficulty, setDifficulty,
    gameMode, setGameMode,
    userColor, handleUserColorChange,
    majorityRule, setMajorityRule,
    pieces,
    moveHistory,
    selectedSquare,
    highlights,
    isThinking,
    engineStats,
    handleSquareClick,
    handleMoveAttempt,
    handleExportPDN,
    handleImportPDN
  } = useGameController();

  const translateMoveToNotation = (move: Move) => {
    const from = SQUARE_NUMBERS[move.from.row * BOARD_SIZE + move.from.col];
    const to = SQUARE_NUMBERS[move.to.row * BOARD_SIZE + move.to.col];
    const sep = move.captures.length > 0 ? 'x' : '-';
    return `${from}${sep}${to}`;
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
        onExportPDN={handleExportPDN}
        onImportPDN={handleImportPDN}
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
  );
}

export default App;