
// This is a MOCK socket service to simulate online play without a real backend.
// In a real application, you would use the 'socket.io-client' library
// and connect to a real Node.js server.

import { GameState, Player, Position, PieceType, Piece, BoardState } from '../types';
import { INITIAL_BOARD, PIECE_MOVES } from '../constants';

type EventCallback = (...args: any[]) => void;

export interface MockSocket {
  on: (event: string, callback: EventCallback) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
}

const getValidMovesForPiece = (pos: Position, piece: Piece, board: BoardState): Position[] => {
    const moves: Position[] = [];
    const moveSet = PIECE_MOVES[piece.type];

    for (const [dy, dx] of moveSet) {
        const newRow = piece.player === Player.SENTE ? pos.row + dy : pos.row - dy;
        const newCol = pos.col + dx;

        if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 3) {
            const targetPiece = board[newRow][newCol];
            if (!targetPiece || targetPiece.player !== piece.player) {
                moves.push({ row: newRow, col: newCol });
            }
        }
    }
    return moves;
};


// Barebones game logic for the mock server
const createMockServerLogic = () => {
    let state: GameState = {
        board: JSON.parse(JSON.stringify(INITIAL_BOARD)),
        currentPlayer: Player.SENTE,
        capturedPieces: { [Player.SENTE]: [], [Player.GOTE]: [] },
        winner: null,
        isCheck: false,
    };

    const reset = () => {
         state = {
            board: JSON.parse(JSON.stringify(INITIAL_BOARD)),
            currentPlayer: Player.SENTE,
            capturedPieces: { [Player.SENTE]: [], [Player.GOTE]: [] },
            winner: null,
            isCheck: false,
        };
        return state;
    }

    const move = ({ from, to }: { from: Position, to: Position }) => {
        const piece = state.board[from.row][from.col];
        if (!piece || piece.player !== state.currentPlayer) return null;
        
        const captured = state.board[to.row][to.col];
        if(captured){
            const demoted = captured.type === PieceType.HEN ? PieceType.CHICK : captured.type;
            state.capturedPieces[state.currentPlayer].push(demoted);
        }
        
        state.board[to.row][to.col] = piece;
        state.board[from.row][from.col] = null;
        
        // Promotion
        if (piece.type === PieceType.CHICK) {
            const promotionRow = piece.player === Player.SENTE ? 0 : 3;
            if (to.row === promotionRow) {
                piece.type = PieceType.HEN;
            }
        }
        
        // Win by lion capture
        if (captured?.type === PieceType.LION) {
            state.winner = state.currentPlayer;
        }

        state.currentPlayer = state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
        return state;
    };

    const drop = ({ pos, pieceType }: { pos: Position, pieceType: PieceType}) => {
        if(state.board[pos.row][pos.col]) return null;

        state.board[pos.row][pos.col] = { type: pieceType, player: state.currentPlayer };
        
        const idx = state.capturedPieces[state.currentPlayer].indexOf(pieceType);
        if(idx > -1) state.capturedPieces[state.currentPlayer].splice(idx, 1);
        
        state.currentPlayer = state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
        return state;
    }
    
    return { move, drop, reset, getState: () => state };
};


export const mockSocket = (): MockSocket => {
    const listeners: { [key: string]: EventCallback[] } = {};
    const server = createMockServerLogic();
    let opponentMoveTimeout: NodeJS.Timeout;

    const on = (event: string, callback: EventCallback) => {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
    };

    const trigger = (event: string, ...args: any[]) => {
        if (listeners[event]) {
            listeners[event].forEach(cb => cb(...args));
        }
    };
    
    const makeOpponentMove = () => {
       opponentMoveTimeout = setTimeout(() => {
            const currentState = server.getState();
            const player = currentState.currentPlayer;
            const allPossibleMoves: { from: Position, to: Position }[] = [];

            // Find all valid moves for the current AI player
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 3; c++) {
                    const piece = currentState.board[r][c];
                    if (piece && piece.player === player) {
                        const validMoves = getValidMovesForPiece({ row: r, col: c }, piece, currentState.board);
                        validMoves.forEach(to => allPossibleMoves.push({ from: { row: r, col: c }, to }));
                    }
                }
            }

            if (allPossibleMoves.length > 0) {
                // Select a random move from all possible moves
                const randomMove = allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
                const newState = server.move({ from: randomMove.from, to: randomMove.to });
                if (newState) trigger('gameStateUpdate', newState);
            }
       }, 1500 + Math.random() * 1000); // Add some delay for realism
    }

    const emit = (event: string, ...args: any[]) => {
        // Simulate server logic
        if (event === 'makeMove') {
            const newState = server.move(args[0]);
            if(newState) {
                trigger('gameStateUpdate', newState);
                if (!newState.winner) {
                    makeOpponentMove();
                }
            }
        }
        if (event === 'dropPiece') {
            const newState = server.drop(args[0]);
            if(newState) {
                trigger('gameStateUpdate', newState);
                 if (!newState.winner) {
                    makeOpponentMove();
                }
            }
        }
        if(event === 'resetGame') {
            clearTimeout(opponentMoveTimeout);
            const newState = server.reset();
            trigger('gameStateUpdate', newState);
            // Sente always starts
            if (server.getState().currentPlayer === Player.GOTE) {
                makeOpponentMove();
            }
        }
         if (event === 'joinRoom') {
            // In this mock, we just assume the room exists and start the game
         }
    };
    
    const disconnect = () => {
        clearTimeout(opponentMoveTimeout);
    };

    // Simulate connection and matchmaking
    setTimeout(() => trigger('connect'), 200);
    setTimeout(() => {
        const player = Math.random() > 0.5 ? Player.SENTE : Player.GOTE;
        trigger('gameStart', { player, initialState: server.getState() });
        if(player === Player.GOTE){
            makeOpponentMove();
        }
    }, 500);

    return { on, emit, disconnect };
};
