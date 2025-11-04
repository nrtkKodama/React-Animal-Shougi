import React, { useEffect } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import GameUI from './GameUI';
import { Player } from '../types';

interface OfflineGameProps {
    onBack: () => void;
    opponentType: 'human' | 'ai';
}

const OfflineGame: React.FC<OfflineGameProps> = ({ onBack, opponentType }) => {
    const { gameState, selectedPiece, handleSquareClick, handleCapturedPieceClick, resetGame, getHighlights, makeAIMove } = useGameLogic();
    
    useEffect(() => {
        if (opponentType === 'ai' && gameState.currentPlayer === Player.GOTE && !gameState.winner) {
            const timer = setTimeout(() => {
                makeAIMove();
            }, 750); // Simulate AI thinking time
            return () => clearTimeout(timer);
        }
    }, [gameState.currentPlayer, gameState.winner, opponentType, makeAIMove]);

    const isPlayerTurn = opponentType === 'human' || gameState.currentPlayer === Player.SENTE;

    return (
        <GameUI
            gameState={gameState}
            selectedPiece={selectedPiece}
            highlights={getHighlights()}
            playerPerspective={Player.SENTE} // In offline, perspective doesn't need to change
            isMyTurn={isPlayerTurn} // Only allow interaction on player's turn
            onSquareClick={isPlayerTurn ? handleSquareClick : () => {}}
            onCapturedPieceClick={isPlayerTurn ? handleCapturedPieceClick : () => {}}
            onReset={resetGame}
            onBack={onBack}
        />
    );
};

export default OfflineGame;