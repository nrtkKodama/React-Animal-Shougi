
import React from 'react';
import { BoardState, Position, Player } from '../types';
import Piece from './Piece';

interface BoardProps {
    board: BoardState;
    onSquareClick: (pos: Position) => void;
    highlights: Position[];
    selectedPos?: Position;
    playerPerspective: Player;
}

const Board: React.FC<BoardProps> = ({ board, onSquareClick, highlights, selectedPos, playerPerspective }) => {
    const rows = Array.from({ length: 4 }, (_, i) => i);
    const cols = Array.from({ length: 3 }, (_, i) => i);

    const isHighlighted = (row: number, col: number) => {
        return highlights.some(p => p.row === row && p.col === col);
    };
    
    const isSelected = (row: number, col: number) => {
        return selectedPos && selectedPos.row === row && selectedPos.col === col;
    }

    const boardContent = rows.map(row => (
        <div key={row} className="flex">
            {cols.map(col => {
                const piece = board[row][col];
                return (
                    <div
                        key={`${row}-${col}`}
                        onClick={() => onSquareClick({ row, col })}
                        className="w-20 h-24 md:w-24 md:h-28 lg:w-28 lg:h-32 border-2 border-stone-500 bg-yellow-100 flex items-center justify-center relative cursor-pointer"
                    >
                        {piece && <Piece pieceType={piece.type} player={piece.player} isSelected={isSelected(row, col)}/>}
                        {isHighlighted(row, col) && (
                            <div className="absolute inset-0 bg-blue-400 bg-opacity-50 rounded-full scale-50"></div>
                        )}
                    </div>
                );
            })}
        </div>
    ));

    return (
        <div 
            className="flex flex-col bg-stone-300 p-2 rounded-lg shadow-lg"
            style={{ transform: playerPerspective === Player.GOTE ? 'rotate(180deg)' : 'none' }}
        >
            {boardContent}
        </div>
    );
};

export default Board;
