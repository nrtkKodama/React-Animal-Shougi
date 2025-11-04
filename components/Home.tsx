
import React from 'react';
import { GameMode } from '../App';

interface HomeProps {
    setGameMode: (mode: GameMode) => void;
}

const Home: React.FC<HomeProps> = ({ setGameMode }) => {
    return (
        <div className="text-center bg-white p-8 rounded-lg shadow-xl">
            <h1 className="text-5xl font-bold mb-2 text-yellow-800">どうぶつしょうぎ</h1>
            <h2 className="text-3xl font-semibold mb-8 text-stone-700">Dobutsu Shogi</h2>
            
            <div className="space-y-4">
                <button
                    onClick={() => setGameMode(GameMode.OFFLINE)}
                    className="w-64 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
                >
                    Play Offline
                </button>
                <button
                    onClick={() => setGameMode(GameMode.ONLINE)}
                    className="w-64 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
                >
                    Play Online
                </button>
            </div>
             <p className="mt-8 text-sm text-stone-500">Offline: Play with a friend on the same device.<br/>Online: Play against another player over the internet.</p>
        </div>
    );
};

export default Home;
