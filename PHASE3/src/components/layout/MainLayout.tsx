import React from 'react';
import TopNav from './TopNav';
import PlayersBar from './PlayersBar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <TopNav />
      <PlayersBar />
      <div className="game-container">
        {children}
      </div>
    </>
  );
};

export default MainLayout;
