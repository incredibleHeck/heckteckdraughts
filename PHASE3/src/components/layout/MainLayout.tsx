import React from 'react';
import TopNav from './TopNav';
import PlayersBar from './PlayersBar';

interface MainLayoutProps {
  children: React.ReactNode;
  // Nav Props
  difficulty: number;
  onDifficultyChange: (level: number) => void;
  gameMode: 'pva' | 'pvp';
  onGameModeChange: (mode: 'pva' | 'pvp') => void;
  userColor: number;
  onUserColorChange: (color: number) => void;
  majorityRule: boolean;
  onMajorityRuleChange: (enabled: boolean) => void;
  onExportPDN: () => void;
  onImportPDN: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children,
  difficulty,
  onDifficultyChange,
  gameMode,
  onGameModeChange,
  userColor,
  onUserColorChange,
  majorityRule,
  onMajorityRuleChange,
  onExportPDN,
  onImportPDN
}) => {
  return (
    <>
      <TopNav 
        difficulty={difficulty}
        onDifficultyChange={onDifficultyChange}
        gameMode={gameMode}
        onGameModeChange={onGameModeChange}
        userColor={userColor}
        onUserColorChange={onUserColorChange}
        majorityRule={majorityRule}
        onMajorityRuleChange={onMajorityRuleChange}
        onEditModeToggle={() => console.log('Edit Mode')}
        onImportFen={() => console.log('Import FEN')}
        onScreenshot={() => console.log('Screenshot')}
        onExportPDN={onExportPDN}
        onImportPDN={onImportPDN}
      />
      <PlayersBar />
      <div className="game-container">
        {children}
      </div>
    </>
  );
};

export default MainLayout;
