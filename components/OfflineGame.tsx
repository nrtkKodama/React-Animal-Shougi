
import React from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import GameUI from './GameUI';
import { Player } from '../types';

interface OfflineGameProps {
    onBack: () => void;
}

const OfflineGame: React.FC<OfflineGameProps> = ({ onBack }) => {
    const { gameState, selectedPiece, handleSquareClick, handleCapturedPieceClick, resetGame, getHighlights } = useGameLogic();
    
    return (
        <GameUI
            gameState={gameState}
            selectedPiece={selectedPiece}
            highlights={getHighlights()}
            playerPerspective={Player.SENTE} // In offline, perspective doesn't need to change
            isMyTurn={true} // In offline, it's always "my" turn to move the pieces
            onSquareClick={handleSquareClick}
            onCapturedPieceClick={handleCapturedPieceClick}
            onReset={resetGame}
            onBack={onBack}
        />
    );
};

export default OfflineGame;
