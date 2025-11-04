
import { useState, useCallback } from 'react';
import { GameState, Player, BoardState, PieceType, Position, Piece } from '../types';
import { INITIAL_BOARD, PIECE_MOVES } from '../constants';

const createInitialState = (): GameState => ({
    board: JSON.parse(JSON.stringify(INITIAL_BOARD)),
    currentPlayer: Player.SENTE,
    capturedPieces: {
        [Player.SENTE]: [],
        [Player.GOTE]: [],
    },
    winner: null,
    isCheck: false,
});

export const useGameLogic = () => {
    const [gameState, setGameState] = useState<GameState>(createInitialState());
    const [selectedPiece, setSelectedPiece] = useState<{ source: 'board' | 'captured', pos?: Position, pieceType?: PieceType } | null>(null);

    const findLion = useCallback((board: BoardState, player: Player): Position | null => {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
                const piece = board[r][c];
                if (piece && piece.type === PieceType.LION && piece.player === player) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }, []);

    const isSquareAttacked = useCallback((board: BoardState, pos: Position, attackingPlayer: Player): boolean => {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
                const piece = board[r][c];
                if (piece && piece.player === attackingPlayer) {
                    const moves = getValidMoves({ row: r, col: c }, piece, board);
                    if (moves.some(move => move.row === pos.row && move.col === pos.col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }, []);

    const checkForCheck = useCallback((board: BoardState, defendingPlayer: Player): boolean => {
        const lionPos = findLion(board, defendingPlayer);
        if (!lionPos) return true; // Lion captured, which is a win condition
        const attackingPlayer = defendingPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
        return isSquareAttacked(board, lionPos, attackingPlayer);
    }, [findLion, isSquareAttacked]);


    const getValidMoves = (pos: Position, piece: Piece, board: BoardState): Position[] => {
        const moves: Position[] = [];
        const moveSet = PIECE_MOVES[piece.type];
        const direction = piece.player === Player.SENTE ? -1 : 1;

        for (const [dy, dx] of moveSet) {
            const newRow = pos.row + (dy * direction);
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
    
    const getValidDrops = (board: BoardState): Position[] => {
      const drops: Position[] = [];
      for(let r=0; r<4; r++) {
        for(let c=0; c<3; c++) {
          if(!board[r][c]) {
            drops.push({row: r, col: c});
          }
        }
      }
      return drops;
    }

    const switchPlayer = (state: GameState): GameState => {
        const nextPlayer = state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
        return {
            ...state,
            currentPlayer: nextPlayer,
            isCheck: checkForCheck(state.board, nextPlayer),
        };
    };

    const demotePiece = (pieceType: PieceType): PieceType => {
        if (pieceType === PieceType.HEN) return PieceType.CHICK;
        return pieceType;
    };

    const movePiece = (from: Position, to: Position) => {
        if (gameState.winner) return;

        const piece = gameState.board[from.row][from.col];
        if (!piece || piece.player !== gameState.currentPlayer) return;

        const validMoves = getValidMoves(from, piece, gameState.board);
        if (!validMoves.some(m => m.row === to.row && m.col === to.col)) {
            setSelectedPiece(null);
            return;
        }

        const newBoard = gameState.board.map(r => [...r]);
        const newCaptured = { ...gameState.capturedPieces };
        
        const capturedPiece = newBoard[to.row][to.col];
        if (capturedPiece) {
            newCaptured[gameState.currentPlayer] = [...newCaptured[gameState.currentPlayer], demotePiece(capturedPiece.type)];
        }

        newBoard[to.row][to.col] = newBoard[from.row][from.col];
        newBoard[from.row][from.col] = null;
        
        // Promotion
        const movedPiece = newBoard[to.row][to.col];
        if (movedPiece?.type === PieceType.CHICK) {
            const promotionRow = movedPiece.player === Player.SENTE ? 0 : 3;
            if (to.row === promotionRow) {
                movedPiece.type = PieceType.HEN;
            }
        }
        
        let newState: GameState = {
            ...gameState,
            board: newBoard,
            capturedPieces: newCaptured
        };
        
        checkWinConditions(newState, to);
    };

    const dropPiece = (pos: Position, pieceType: PieceType) => {
        if (gameState.winner) return;
        
        const newBoard = gameState.board.map(r => [...r]);
        if(newBoard[pos.row][pos.col]){
            setSelectedPiece(null);
            return;
        }

        newBoard[pos.row][pos.col] = { type: pieceType, player: gameState.currentPlayer };

        const newCaptured = { ...gameState.capturedPieces };
        const pieceIndex = newCaptured[gameState.currentPlayer].indexOf(pieceType);
        if(pieceIndex > -1) {
            newCaptured[gameState.currentPlayer].splice(pieceIndex, 1);
        }

        let newState: GameState = {
            ...gameState,
            board: newBoard,
            capturedPieces: newCaptured
        };

        checkWinConditions(newState);
    };

    const checkWinConditions = (state: GameState, lastMoveTo?: Position) => {
        const opponent = state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
        
        // 1. Lion Capture
        const opponentLion = findLion(state.board, opponent);
        if (!opponentLion) {
            setGameState({ ...state, winner: state.currentPlayer });
            setSelectedPiece(null);
            return;
        }

        // 2. "Try" rule: Lion reaches the final rank
        if (lastMoveTo) {
            const movedPiece = state.board[lastMoveTo.row][lastMoveTo.col];
            if (movedPiece && movedPiece.type === PieceType.LION && movedPiece.player === state.currentPlayer) {
                const promotionRow = state.currentPlayer === Player.SENTE ? 0 : 3;
                if (lastMoveTo.row === promotionRow) {
                    // Check if the lion can be captured next turn
                    const canBeCaptured = isSquareAttacked(state.board, lastMoveTo, opponent);
                    if (!canBeCaptured) {
                        setGameState({ ...state, winner: state.currentPlayer });
                        setSelectedPiece(null);
                        return;
                    }
                }
            }
        }
        
        setGameState(switchPlayer(state));
        setSelectedPiece(null);
    }
    
    const handleSquareClick = (pos: Position) => {
        if (gameState.winner) return;
        const pieceOnSquare = gameState.board[pos.row][pos.col];
        
        if (selectedPiece) {
            if (selectedPiece.source === 'board' && selectedPiece.pos) {
                movePiece(selectedPiece.pos, pos);
            } else if (selectedPiece.source === 'captured' && selectedPiece.pieceType) {
                dropPiece(pos, selectedPiece.pieceType);
            }
        } else {
            if (pieceOnSquare && pieceOnSquare.player === gameState.currentPlayer) {
                setSelectedPiece({ source: 'board', pos });
            }
        }
    };
    
    const handleCapturedPieceClick = (pieceType: PieceType) => {
        if(gameState.winner) return;

        if (selectedPiece && selectedPiece.source === 'captured' && selectedPiece.pieceType === pieceType) {
            setSelectedPiece(null); // Deselect if clicked again
        } else {
            setSelectedPiece({ source: 'captured', pieceType });
        }
    };
    
    const resetGame = () => {
        setGameState(createInitialState());
        setSelectedPiece(null);
    }

    const getHighlights = (): Position[] => {
        if(!selectedPiece) return [];
        if(selectedPiece.source === 'board' && selectedPiece.pos){
            const piece = gameState.board[selectedPiece.pos.row][selectedPiece.pos.col];
            if(piece) return getValidMoves(selectedPiece.pos, piece, gameState.board);
        }
        if(selectedPiece.source === 'captured'){
            return getValidDrops(gameState.board);
        }
        return [];
    }
    
    return {
        gameState,
        selectedPiece,
        handleSquareClick,
        handleCapturedPieceClick,
        resetGame,
        getHighlights
    };
};
