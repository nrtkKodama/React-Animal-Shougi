
import { PieceType, Player, BoardState } from './types';

// In board coordinates, [dy, dx] where +dy is "down" (towards Player 1)
export const PIECE_MOVES: Record<PieceType, [number, number][]> = {
    [PieceType.LION]: [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
    ],
    [PieceType.GIRAFFE]: [
                [-1, 0], 
        [0, -1],         [0, 1],
                [1, 0],
    ],
    [PieceType.ELEPHANT]: [
        [-1, -1], [-1, 1],

        [1, -1],  [1, 1],
    ],
    [PieceType.CHICK]: [
        [-1, 0],
    ],
    [PieceType.HEN]: [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
                  [1, 0],
    ],
};

export const INITIAL_BOARD: BoardState = [
    [
        { type: PieceType.GIRAFFE, player: Player.GOTE },
        { type: PieceType.LION, player: Player.GOTE },
        { type: PieceType.ELEPHANT, player: Player.GOTE },
    ],
    [
        null,
        { type: PieceType.CHICK, player: Player.GOTE },
        null,
    ],
    [
        null,
        { type: PieceType.CHICK, player: Player.SENTE },
        null,
    ],
    [
        { type: PieceType.ELEPHANT, player: Player.SENTE },
        { type: PieceType.LION, player: Player.SENTE },
        { type: PieceType.GIRAFFE, player: Player.SENTE },
    ],
];
