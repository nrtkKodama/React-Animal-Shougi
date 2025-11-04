
import React from 'react';
import { PieceType, Player } from '../types';
import Piece from './Piece';

interface CapturedPiecesProps {
    pieces: PieceType[];
    player: Player;
    onPieceClick: (pieceType: PieceType) => void;
    selectedPieceType?: PieceType;
    isCurrentPlayer: boolean;
    isOpponent?: boolean;
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({ pieces, player, onPieceClick, selectedPieceType, isCurrentPlayer, isOpponent }) => {
    
    const perspectiveClass = isOpponent ? 'rotate-180' : '';
    
    return (
        <div className="p-2 bg-stone-300 rounded-lg min-h-[6rem] w-full md:w-auto md:min-w-[18rem]">
            <h3 className={`text-sm font-bold mb-2 ${isCurrentPlayer ? 'text-blue-600' : 'text-stone-600'}`}>
                {`Player ${player + 1}`} Captured
            </h3>
            <div className={`flex flex-wrap gap-1 ${perspectiveClass}`}>
                {pieces.length === 0 ? (
                    <p className="text-xs text-stone-500 w-full text-center py-4">No pieces captured</p>
                ) : (
                     [...pieces].sort().map((pieceType, index) => (
                        <div key={index} className="w-12 h-14 md:w-14 md:h-16" onClick={() => isCurrentPlayer && onPieceClick(pieceType)}>
                            <Piece 
                                pieceType={pieceType} 
                                player={player} 
                                isSelected={isCurrentPlayer && selectedPieceType === pieceType}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CapturedPieces;
