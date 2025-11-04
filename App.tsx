import React, { useState } from 'react';
import Home from './components/Home';
import OfflineGame from './components/OfflineGame';
import OnlineGame from './components/OnlineGame';

export enum GameMode {
  NONE,
  OFFLINE_PLAYER,
  OFFLINE_AI,
  ONLINE
}

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.NONE);

  const renderContent = () => {
    switch (gameMode) {
      case GameMode.OFFLINE_PLAYER:
        return <OfflineGame onBack={() => setGameMode(GameMode.NONE)} opponentType="human" />;
      case GameMode.OFFLINE_AI:
        return <OfflineGame onBack={() => setGameMode(GameMode.NONE)} opponentType="ai" />;
      case GameMode.ONLINE:
        return <OnlineGame onBack={() => setGameMode(GameMode.NONE)} />;
      case GameMode.NONE:
      default:
        return <Home setGameMode={setGameMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-200 text-stone-800 flex flex-col items-center justify-center p-2 sm:p-4 font-sans">
      {renderContent()}
    </div>
  );
};

export default App;