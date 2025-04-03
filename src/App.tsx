import React from 'react';
import Game from './components/Game';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Breakout Game</h1>
      <Game />
      <p className="mt-4 text-gray-600">Use your mouse to move the paddle and bounce the ball</p>
    </div>
  );
}

export default App;