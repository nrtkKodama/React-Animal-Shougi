
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, PieceType, Position, Player } from '../types';
import { INITIAL_BOARD } from '../constants';
import GameUI from './GameUI';
import { mockSocket, MockSocket } from '../services/socketService';

interface OnlineGameProps {
    onBack: () => void;
}

const createInitialState = (): GameState => ({
    board: JSON.parse(JSON.stringify(INITIAL_BOARD)),
    currentPlayer: Player.SENTE,
    capturedPieces: { [Player.SENTE]: [], [Player.GOTE]: [] },
    winner: null,
    isCheck: false,
});

const OnlineGame: React.FC<OnlineGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>(createInitialState());
    const [socket, setSocket] = useState<MockSocket | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [status, setStatus] = useState("Connecting to server...");
    const [selectedPiece, setSelectedPiece] = useState<{ source: 'board' | 'captured', pos?: Position, pieceType?: PieceType } | null>(null);

    useEffect(() => {
        const newSocket = mockSocket();
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setStatus("Waiting for an opponent...");
        });
        
        newSocket.on('gameStart', ({ player, initialState }) => {
            setPlayer(player);
            setGameState(initialState);
            setStatus(`Game started! You are Player ${player + 1}.`);
        });

        newSocket.on('gameStateUpdate', (newState) => {
            setGameState(newState);
            setSelectedPiece(null);
        });

        newSocket.on('gameOver', (winner) => {
            setGameState(prevState => ({...prevState, winner}));
        });
        
        newSocket.on('opponentDisconnected', () => {
            setStatus("Opponent disconnected. You win!");
            if(player !== null) {
                setGameState(prevState => ({...prevState, winner: player}));
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [player]);
    
    const isMyTurn = player !== null && gameState.currentPlayer === player;

    const handleSquareClick = (pos: Position) => {
        if (!isMyTurn || gameState.winner !== null) return;
        
        const pieceOnSquare = gameState.board[pos.row][pos.col];

        if (selectedPiece) {
            if (selectedPiece.source === 'board' && selectedPiece.pos) {
                socket?.emit('makeMove', { from: selectedPiece.pos, to: pos });
            } else if (selectedPiece.source === 'captured' && selectedPiece.pieceType) {
                socket?.emit('dropPiece', { pos, pieceType: selectedPiece.pieceType });
            }
            setSelectedPiece(null);
        } else {
            if (pieceOnSquare && pieceOnSquare.player === player) {
                setSelectedPiece({ source: 'board', pos });
            }
        }
    };
    
    const handleCapturedPieceClick = (pieceType: PieceType) => {
        if (!isMyTurn || gameState.winner !== null) return;

        if (selectedPiece && selectedPiece.source === 'captured' && selectedPiece.pieceType === pieceType) {
            setSelectedPiece(null);
        } else {
            setSelectedPiece({ source: 'captured', pieceType });
        }
    };
    
    const resetGame = () => {
        socket?.emit('resetGame');
    };

    // A placeholder for highlights, in a real scenario this would come from the server or be re-calculated
    const getHighlights = useCallback((): Position[] => {
        if (!isMyTurn) return [];
        // This is a simplified highlight logic for the mock.
        // A full implementation would need the same logic as useGameLogic.
        if (selectedPiece?.source === 'board' && selectedPiece.pos) {
            return [{row: selectedPiece.pos.row -1, col: selectedPiece.pos.col}]; // Mock one move
        }
        if (selectedPiece?.source === 'captured') {
            const drops: Position[] = [];
            for(let r=0; r<4; r++) for(let c=0; c<3; c++) if(!gameState.board[r][c]) drops.push({row:r, col:c});
            return drops;
        }
        return [];
    }, [isMyTurn, selectedPiece, gameState.board]);


    if (player === null) {
        return (
            <div className="text-center bg-white p-8 rounded-lg shadow-xl">
                <h2 className="text-2xl font-semibold mb-4">{status}</h2>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <button onClick={onBack} className="mt-8 bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded transition-colors">
                    Back to Menu
                </button>
            </div>
        );
    }
    
    return (
        <GameUI
            gameState={gameState}
            selectedPiece={selectedPiece}
            highlights={getHighlights()}
            playerPerspective={player}
            isMyTurn={isMyTurn}
            onSquareClick={handleSquareClick}
            onCapturedPieceClick={handleCapturedPieceClick}
            onReset={resetGame}
            onBack={onBack}
            onlineStatus={!isMyTurn && gameState.winner === null ? "Waiting for opponent's move..." : undefined}
        />
    );
};

export default OnlineGame;
