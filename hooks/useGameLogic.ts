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

const getValidMoves = (pos: Position, piece: Piece, board: BoardState): Position[] => {
    const moves: Position[] = [];
    const moveSet = PIECE_MOVES[piece.type];

    for (const [dy, dx] of moveSet) {
        // SENTE moves towards smaller row numbers, GOTE moves towards larger row numbers.
        const newRow = piece.player === Player.SENTE ? pos.row + dy : pos.row - dy;
        const newCol = piece.player === Player.SENTE ? pos.col + dx : pos.col - dx;


        if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 3) {
            const targetPiece = board[newRow][newCol];
            if (!targetPiece || targetPiece.player !== piece.player) {
                moves.push({ row: newRow, col: newCol });
            }
        }
    }
    return moves;
};

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

    const movePiece = useCallback((from: Position, to: Position) => {
        setGameState(currentState => {
            if (currentState.winner) return currentState;

            const piece = currentState.board[from.row][from.col];
            if (!piece || piece.player !== currentState.currentPlayer) return currentState;

            const validMoves = getValidMoves(from, piece, currentState.board);
            if (!validMoves.some(m => m.row === to.row && m.col === to.col)) {
                setSelectedPiece(null);
                return currentState;
            }

            const newBoard = currentState.board.map(r => [...r]);
            const newCaptured = { ...currentState.capturedPieces };
            
            const capturedPiece = newBoard[to.row][to.col];
            if (capturedPiece) {
                newCaptured[currentState.currentPlayer] = [...newCaptured[currentState.currentPlayer], demotePiece(capturedPiece.type)];
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
                ...currentState,
                board: newBoard,
                capturedPieces: newCaptured
            };
            
            return checkWinConditions(newState, to);
        });
        setSelectedPiece(null);
    }, []);

    const dropPiece = useCallback((pos: Position, pieceType: PieceType) => {
        setGameState(currentState => {
            if (currentState.winner) return currentState;
            
            const newBoard = currentState.board.map(r => [...r]);
            if(newBoard[pos.row][pos.col]){
                setSelectedPiece(null);
                return currentState;
            }

            newBoard[pos.row][pos.col] = { type: pieceType, player: currentState.currentPlayer };

            const newCaptured = { ...currentState.capturedPieces };
            const pieceIndex = newCaptured[currentState.currentPlayer].indexOf(pieceType);
            if(pieceIndex > -1) {
                newCaptured[currentState.currentPlayer].splice(pieceIndex, 1);
            }

            let newState: GameState = {
                ...currentState,
                board: newBoard,
                capturedPieces: newCaptured
            };

            return checkWinConditions(newState);
        });
        setSelectedPiece(null);
    }, []);

    const checkWinConditions = (state: GameState, lastMoveTo?: Position): GameState => {
        const opponent = state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
        
        // 1. Lion Capture
        const opponentLion = findLion(state.board, opponent);
        if (!opponentLion) {
            return { ...state, winner: state.currentPlayer };
        }

        // 2. "Try" rule: Lion reaches the final rank
        if (lastMoveTo) {
            const movedPiece = state.board[lastMoveTo.row][lastMoveTo.col];
            if (movedPiece && movedPiece.type === PieceType.LION && movedPiece.player === state.currentPlayer) {
                const promotionRow = state.currentPlayer === Player.SENTE ? 0 : 3;
                if (lastMoveTo.row === promotionRow) {
                    const canBeCaptured = isSquareAttacked(state.board, lastMoveTo, opponent);
                    if (!canBeCaptured) {
                        return { ...state, winner: state.currentPlayer };
                    }
                }
            }
        }
        
        return switchPlayer(state);
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
    
    const makeAIMove = useCallback(() => {
        const player = gameState.currentPlayer;
        const allBoardMoves: { from: Position, to: Position }[] = [];
        const allDrops: { pos: Position, pieceType: PieceType }[] = [];

        // 1. Gather all possible moves
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
                const piece = gameState.board[r][c];
                if (piece && piece.player === player) {
                    const validMoves = getValidMoves({ row: r, col: c }, piece, gameState.board);
                    validMoves.forEach(to => allBoardMoves.push({ from: { row: r, col: c }, to }));
                }
            }
        }
        const validDropSquares = getValidDrops(gameState.board);
        gameState.capturedPieces[player].forEach(pieceType => {
            validDropSquares.forEach(pos => {
                allDrops.push({ pos, pieceType });
            });
        });

        // 2. Find best move with simple strategy
        let winningMoves = [];
        let captureMoves = [];

        // Check board moves for captures/wins
        for (const move of allBoardMoves) {
            const targetPiece = gameState.board[move.to.row][move.to.col];
            if (targetPiece) {
                if (targetPiece.type === PieceType.LION) {
                    winningMoves.push({ type: 'move', ...move });
                }
                captureMoves.push({ type: 'move', ...move });
            }
        }
        
        if (winningMoves.length > 0) {
            const chosenMove = winningMoves[0];
            movePiece(chosenMove.from, chosenMove.to);
            return;
        }

        if (captureMoves.length > 0) {
            const chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
            movePiece(chosenMove.from, chosenMove.to);
            return;
        }

        // FIX: Explicitly define types for AI actions to ensure correct type inference for the discriminated union.
        // This prevents TypeScript from widening the 'type' property to 'string', which was causing type narrowing to fail.
        type MoveAction = { type: 'move', from: Position, to: Position };
        type DropAction = { type: 'drop', pos: Position, pieceType: PieceType };

        const allPossibleActions: (MoveAction | DropAction)[] = [
            ...allBoardMoves.map(m => ({ type: 'move' as const, ...m })),
            ...allDrops.map(d => ({ type: 'drop' as const, ...d }))
        ];

        if (allPossibleActions.length > 0) {
            const randomAction = allPossibleActions[Math.floor(Math.random() * allPossibleActions.length)];
            if (randomAction.type === 'move') {
                movePiece(randomAction.from, randomAction.to);
            } else {
                dropPiece(randomAction.pos, randomAction.pieceType);
            }
        }

    }, [gameState, movePiece, dropPiece]);

    return {
        gameState,
        selectedPiece,
        handleSquareClick,
        handleCapturedPieceClick,
        resetGame,
        getHighlights,
        makeAIMove,
    };
};
