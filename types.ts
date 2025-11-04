
export enum Player {
    SENTE = 0, // Player 1 (moves first)
    GOTE = 1,  // Player 2
}

export enum PieceType {
    LION = 'LION',
    GIRAFFE = 'GIRAFFE',
    ELEPHANT = 'ELEPHANT',
    CHICK = 'CHICK',
    HEN = 'HEN',
}

export interface Piece {
    type: PieceType;
    player: Player;
}

export type Square = Piece | null;

export type BoardState = Square[][];

export interface Position {
    row: number;
    col: number;
}

export interface GameState {
    board: BoardState;
    currentPlayer: Player;
    capturedPieces: { [key in Player]: PieceType[] };
    winner: Player | null;
    isCheck: boolean;
}
