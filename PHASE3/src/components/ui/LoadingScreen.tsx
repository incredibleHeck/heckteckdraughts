import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    // This would normally be called when the engine is ready
    // For now, we simulate a delay
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setIsRemoved(true), 600);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isRemoved) return null;

  return (
    <div 
      id="loading-screen" 
      className="loading-screen"
      style={{ 
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'all' : 'none'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <h2 style={{ color: '#ffc857', marginTop: '20px' }}>Hectic Draughts</h2>
        <p id="loading-status" style={{ color: '#b0b3b8' }}>Initializing Engine...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
