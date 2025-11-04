
// This is a MOCK socket service to simulate online play without a real backend.
// In a real application, you would use the 'socket.io-client' library
// and connect to a real Node.js server.

import { GameState, Player, Position, PieceType } from '../types';
import { INITIAL_BOARD, PIECE_MOVES } from '../constants';

type EventCallback = (...args: any[]) => void;

export interface MockSocket {
  on: (event: string, callback: EventCallback) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
}

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
            // Simple AI: find a piece and make a random valid-ish move
            const player = server.getState().currentPlayer;
            const pieces: {pos: Position, piece: any}[] = [];
            for(let r=0; r<4; r++){
                for(let c=0; c<3; c++){
                    const piece = server.getState().board[r][c];
                    if(piece && piece.player === player) {
                        pieces.push({pos: {row: r, col: c}, piece});
                    }
                }
            }

            if(pieces.length > 0) {
                const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
                const moveSet = PIECE_MOVES[randomPiece.piece.type];
                const dir = player === Player.SENTE ? -1 : 1;
                const moveTo = moveSet[Math.floor(Math.random() * moveSet.length)];
                
                const to = { row: randomPiece.pos.row + (moveTo[0] * dir), col: randomPiece.pos.col + moveTo[1] };
                
                // Simple boundary and friendly piece check
                if (to.row >= 0 && to.row < 4 && to.col >= 0 && to.col < 3 && server.getState().board[to.row][to.col]?.player !== player) {
                     const newState = server.move({ from: randomPiece.pos, to });
                     if (newState) trigger('gameStateUpdate', newState);
                     return;
                }
            }
       }, 2000);
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
    };
    
    const disconnect = () => {
        clearTimeout(opponentMoveTimeout);
        console.log("Socket disconnected");
    };

    // Simulate connection and matchmaking
    setTimeout(() => trigger('connect'), 500);
    setTimeout(() => {
        const player = Math.random() > 0.5 ? Player.SENTE : Player.GOTE;
        trigger('gameStart', { player, initialState: server.getState() });
        if(player === Player.GOTE){
            makeOpponentMove();
        }
    }, 2000);

    return { on, emit, disconnect };
};
