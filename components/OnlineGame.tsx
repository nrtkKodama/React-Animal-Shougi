import React, { useState, useEffect, useCallback } from 'react';
import { GameState, PieceType, Position, Player } from '../types';
import { INITIAL_BOARD, PIECE_MOVES } from '../constants';
import GameUI from './GameUI';
import { mockSocket, MockSocket } from '../services/socketService';

interface OnlineGameProps {
    onBack: () => void;
}

type GameStage = 'setup' | 'waiting' | 'playing' | 'error';

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
    const [status, setStatus] = useState("");
    const [selectedPiece, setSelectedPiece] = useState<{ source: 'board' | 'captured', pos?: Position, pieceType?: PieceType } | null>(null);
    const [gameStage, setGameStage] = useState<GameStage>('setup');
    const [roomCode, setRoomCode] = useState('');
    const [joinInputCode, setJoinInputCode] = useState('');
    const [createInputCode, setCreateInputCode] = useState('');

    useEffect(() => {
        if (gameStage !== 'playing' || !socket) {
            if(socket) {
                socket.disconnect();
                setSocket(null);
            }
            if(gameStage === 'playing'){
                const newSocket = mockSocket();
                setSocket(newSocket);

                newSocket.on('connect', () => {
                    setStatus("Connecting...");
                    newSocket.emit('joinRoom', { roomCode });
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
                
                newSocket.on('error', (message) => {
                    setStatus(message);
                    setGameStage('error');
                });
            }
        }
        return () => {
            socket?.disconnect();
        };
    }, [gameStage, player, roomCode]);

    const handleCreateRoom = () => {
        if(createInputCode.trim()){
            setRoomCode(createInputCode.trim().toUpperCase());
            setGameStage('waiting');
        }
    };

    const handleJoinRoom = () => {
        if (joinInputCode.trim()) {
            setRoomCode(joinInputCode.trim().toUpperCase());
            setGameStage('playing');
        }
    };
    
    useEffect(() => {
        if (gameStage === 'waiting') {
            const timer = setTimeout(() => {
                setGameStage('playing');
            }, 2000); // Simulate opponent joining
            return () => clearTimeout(timer);
        }
    }, [gameStage]);
    
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
    
    const getHighlights = useCallback((): Position[] => {
        if (!isMyTurn || !selectedPiece) return [];
        
        if (selectedPiece.source === 'board' && selectedPiece.pos) {
            const piece = gameState.board[selectedPiece.pos.row][selectedPiece.pos.col];
            if (piece) {
                 const moves: Position[] = [];
                 const moveSet = PIECE_MOVES[piece.type];
                 for (const [dy, dx] of moveSet) {
                     const newRow = piece.player === Player.SENTE ? selectedPiece.pos.row + dy : selectedPiece.pos.row - dy;
                     const newCol = piece.player === Player.SENTE ? selectedPiece.pos.col + dx : selectedPiece.pos.col - dx;
                     if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 3) {
                        const target = gameState.board[newRow][newCol];
                        if (!target || target.player !== piece.player) moves.push({row: newRow, col: newCol});
                     }
                 }
                 return moves;
            }
        }
        if (selectedPiece.source === 'captured') {
            const drops: Position[] = [];
            for(let r=0; r<4; r++) for(let c=0; c<3; c++) if(!gameState.board[r][c]) drops.push({row:r, col:c});
            return drops;
        }
        return [];
    }, [isMyTurn, selectedPiece, gameState.board, player]);

    const goBackToSetup = () => {
        setGameStage('setup');
        setRoomCode('');
        setJoinInputCode('');
        setCreateInputCode('');
        setSocket(null);
        setPlayer(null);
    }

    if (gameStage === 'setup' || gameStage === 'error') {
         return (
            <div className="text-center bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-6">Play Online</h2>
                {gameStage === 'error' && <p className="text-red-500 font-bold mb-4">{status}</p>}
                <div className="space-y-6">
                     <div className="p-4 border border-stone-200 rounded-lg">
                        <h3 className="font-bold mb-2 text-stone-700">Create Game</h3>
                        <input 
                            type="text"
                            placeholder="Set Your 'Aikotoba'"
                            value={createInputCode}
                            onChange={(e) => setCreateInputCode(e.target.value)}
                            className="text-center p-3 border-2 border-stone-300 rounded-lg w-full mb-2 uppercase"
                        />
                        <button onClick={handleCreateRoom} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            Create
                        </button>
                    </div>

                    <div className="flex items-center text-stone-500">
                        <hr className="flex-grow border-t border-stone-300"/>
                        <span className="px-4 font-bold">OR</span>
                        <hr className="flex-grow border-t border-stone-300"/>
                    </div>
                     
                    <div className="p-4 border border-stone-200 rounded-lg">
                        <h3 className="font-bold mb-2 text-stone-700">Join Game</h3>
                        <input 
                            type="text"
                            placeholder="Enter 'Aikotoba'"
                            value={joinInputCode}
                            onChange={(e) => setJoinInputCode(e.target.value)}
                            className="text-center p-3 border-2 border-stone-300 rounded-lg w-full mb-2 uppercase"
                        />
                        <button onClick={handleJoinRoom} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            Join
                        </button>
                    </div>
                </div>
                 <button onClick={onBack} className="mt-8 bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded transition-colors">
                    Back to Menu
                </button>
            </div>
        );
    }

    if (gameStage === 'waiting') {
        return (
             <div className="text-center bg-white p-8 rounded-lg shadow-xl">
                <h2 className="text-2xl font-semibold mb-4">Room Created!</h2>
                <p className="mb-4">Share this 'Aikotoba' with your friend:</p>
                <div className="bg-stone-200 p-4 rounded-lg mb-6">
                    <p className="text-4xl font-mono tracking-widest">{roomCode}</p>
                </div>
                <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-lg">Waiting for opponent to join...</p>
                </div>
                 <button onClick={goBackToSetup} className="mt-8 bg-stone-500 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded transition-colors">
                    Cancel
                </button>
            </div>
        )
    }
    
    return (
        <GameUI
            gameState={gameState}
            selectedPiece={selectedPiece}
            highlights={getHighlights()}
            playerPerspective={player ?? Player.SENTE}
            isMyTurn={isMyTurn}
            onSquareClick={handleSquareClick}
            onCapturedPieceClick={handleCapturedPieceClick}
            onReset={resetGame}
            onBack={goBackToSetup}
            onlineStatus={!isMyTurn && gameState.winner === null ? "Waiting for opponent's move..." : status}
        />
    );
};

export default OnlineGame;