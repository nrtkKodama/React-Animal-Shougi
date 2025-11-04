
import React from 'react';
import { PieceType, Player } from '../types';
import { PIECE_MOVES } from '../constants';

interface PieceProps {
    pieceType: PieceType;
    player: Player;
    className?: string;
    isSelected?: boolean;
}

const MoveIndicator: React.FC<{ moves: [number, number][], player: Player }> = ({ moves, player }) => {
    const direction = player === Player.SENTE ? -1 : 1;
    const positions = moves.map(([dy, dx]) => ({
        cx: 50 + dx * 28,
        cy: 50 + (dy * direction) * 28,
    }));

    return (
        <g opacity="0.6" fill="#333">
            {positions.map((pos, i: number) => (
                <circle key={i} cx={pos.cx} cy={pos.cy} r="4" />
            ))}
        </g>
    );
};

const LionIcon: React.FC = () => <text x="50" y="65" fontSize="55" textAnchor="middle" dominantBaseline="middle">🦁</text>;
const GiraffeIcon: React.FC = () => <text x="50" y="65" fontSize="55" textAnchor="middle" dominantBaseline="middle">🦒</text>;
const ElephantIcon: React.FC = () => <text x="50" y="65" fontSize="55" textAnchor="middle" dominantBaseline="middle">🐘</text>;
const ChickIcon: React.FC = () => <text x="50" y="65" fontSize="55" textAnchor="middle" dominantBaseline="middle">🐥</text>;
const HenIcon: React.FC = () => <text x="50" y="65" fontSize="55" textAnchor="middle" dominantBaseline="middle">🐔</text>;

const pieceSVGs: Record<PieceType, React.ReactElement> = {
    [PieceType.LION]: <LionIcon />,
    [PieceType.GIRAFFE]: <GiraffeIcon />,
    [PieceType.ELEPHANT]: <ElephantIcon />,
    [PieceType.CHICK]: <ChickIcon />,
    [PieceType.HEN]: <HenIcon />,
};

const Piece: React.FC<PieceProps> = ({ pieceType, player, className, isSelected }) => {
    const isHen = pieceType === PieceType.HEN;
    const isGote = player === Player.GOTE;

    const fillColor = isGote
      ? "fill-stone-200"
      : (isHen ? "fill-red-200" : "fill-yellow-200");
    const strokeColor = isGote
      ? "stroke-stone-500"
      : (isHen ? "stroke-red-500" : "stroke-yellow-800");

    const selectionClasses = isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : '';

    return (
        <div className={`w-full h-full cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 ${selectionClasses} rounded-lg`}>
            <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
                 <g transform={isGote ? "rotate(180 50 50)" : ""}>
                    <path
                        d="M 50,5 L 95,35 L 85,95 L 15,95 L 5,35 Z"
                        className={`${fillColor} ${strokeColor}`}
                        strokeWidth="4"
                        strokeLinejoin="round"
                    />
                    {pieceSVGs[pieceType]}
                    <MoveIndicator moves={PIECE_MOVES[pieceType]} player={player} />
                </g>
            </svg>
        </div>
    );
};

export default Piece;
