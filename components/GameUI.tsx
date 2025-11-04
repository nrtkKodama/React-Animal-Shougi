
import React from 'react';
import { GameState, PieceType, Position, Player } from '../types';
import Board from './Board';
import CapturedPieces from './CapturedPieces';

interface GameUIProps {
    gameState: GameState;
    selectedPiece: { source: 'board' | 'captured', pos?: Position, pieceType?: PieceType } | null;
    highlights: Position[];
    playerPerspective: Player;
    isMyTurn: boolean;
    onSquareClick: (pos: Position) => void;
    onCapturedPieceClick: (pieceType: PieceType) => void;
    onReset: () => void;
    onBack: () => void;
    onlineStatus?: string;
}

const GameUI: React.FC<GameUIProps> = ({
    gameState,
    selectedPiece,
    highlights,
    playerPerspective,
    isMyTurn,
    onSquareClick,
    onCapturedPieceClick,
    onReset,
    onBack,
    onlineStatus,
}) => {
    const { board, currentPlayer, capturedPieces, winner, isCheck } = gameState;
    const opponent = playerPerspective === Player.SENTE ? Player.GOTE : Player.SENTE;

    const getStatusMessage = () => {
        if (winner !== null) return `Player ${winner + 1} wins!`;
        if (onlineStatus) return onlineStatus;
        let message = `Player ${currentPlayer + 1}'s turn`;
        if(isCheck) message += " (Check!)";
        return message;
    }

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
             <div className="w-full flex justify-between items-center mb-2 px-2">
                <button onClick={onBack} className="bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded transition-colors">
                    Back
                </button>
                <div className="text-center font-bold text-lg p-2 bg-white/50 rounded-lg">
                    {getStatusMessage()}
                </div>
                 <button onClick={onReset} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
                    New Game
                </button>
            </div>
            
            <div className="flex flex-col items-center w-full">
                {/* Opponent's captured pieces */}
                <div className="mb-2 w-full md:w-auto">
                    <CapturedPieces
                        pieces={capturedPieces[opponent]}
                        player={opponent}
                        onPieceClick={() => {}}
                        isCurrentPlayer={currentPlayer === opponent}
                        isOpponent={true}
                    />
                </div>

                {/* Board */}
                <div className="my-2">
                    <Board 
                        board={board} 
                        onSquareClick={onSquareClick}
                        highlights={isMyTurn ? highlights : []}
                        selectedPos={selectedPiece?.source === 'board' ? selectedPiece.pos : undefined}
                        playerPerspective={playerPerspective}
                    />
                </div>

                {/* Player's captured pieces */}
                 <div className="mt-2 w-full md:w-auto">
                    <CapturedPieces
                        pieces={capturedPieces[playerPerspective]}
                        player={playerPerspective}
                        onPieceClick={onCapturedPieceClick}
                        selectedPieceType={selectedPiece?.source === 'captured' ? selectedPiece.pieceType : undefined}
                        isCurrentPlayer={currentPlayer === playerPerspective}
                    />
                </div>
            </div>

            {winner !== null && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-2xl text-center">
                        <h2 className="text-3xl font-bold mb-4">Game Over</h2>
                        <p className="text-xl mb-6">{`Player ${winner + 1} is the winner!`}</p>
                        <button onClick={onReset} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition-colors">
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameUI;
