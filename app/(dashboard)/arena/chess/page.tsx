// app/(dashboard)/arena/chess/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useSocket } from '../../../hooks/useSockects'; // Adjusted to singular useSocket
import Link from 'next/link';

export default function ChessArenaPage() {
  const { socket, isConnected } = useSocket(); // Adjusted to singular useSocket
  
  // 1. Maintain the single source of truth in React state
  const [game, setGame] = useState(new Chess());
  
  const [matchMode, setMatchMode] = useState<'local' | 'online'>('local');
  const [room, setRoom] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | 'spectator'>('white');
  const [status, setStatus] = useState('White to move');
  const [history, setHistory] = useState<string[]>([]);

  // 2. Listen for real-time moves, room assignments, and game setup from socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Receive assigned color from the server on joining
    socket.on('player_color', (color: 'white' | 'black' | 'spectator') => {
      setPlayerColor(color);
      if (color === 'spectator') {
        setStatus('You are spectating this match.');
      } else {
        setStatus(`Joined as ${color === 'white' ? 'White' : 'Black'}. Waiting for opponent...`);
      }
    });

    // Both players entered the room -> start the match
    socket.on('chess_ready', () => {
      const newGame = new Chess();
      setGame(newGame);
      setHistory([]);
      setStatus('Match Ready! White to move.');
    });

    // Sync board on move receipt
    socket.on('receive_chess_move', (moveFen: string) => {
      const newGame = new Chess(moveFen);
      setGame(newGame);
      updateGameStatus(newGame);
    });

    // Notify player if opponent forfeits or drops
    socket.on('opponent_left', () => {
      setStatus('Opponent disconnected. Match ended.');
    });

    return () => {
      socket.off('player_color');
      socket.off('chess_ready');
      socket.off('receive_chess_move');
      socket.off('opponent_left');
    };
  }, [socket, isConnected]);

  // Helper to evaluate checkmate, draw, or normal turn transitions
  const updateGameStatus = (currentGame: Chess) => {
    setHistory(currentGame.history());

    if (currentGame.isGameOver()) {
      if (currentGame.isCheckmate()) {
        setStatus(`Checkmate! Winner: ${currentGame.turn() === 'w' ? 'Black' : 'White'}`);
      } else if (currentGame.isDraw()) {
        setStatus('Match ended in a Draw!');
      } else {
        setStatus('Game Over!');
      }
    } else {
      setStatus(`${currentGame.turn() === 'w' ? 'White' : 'Black'} to move`);
    }
  };

  // 3. Functional State Mutator Pattern (Resolves stale closures completely)
  const safeGameMutate = (modify: (gameInstance: Chess) => void) => {
    setGame((currentGameState) => {
      const gameCopy = new Chess(currentGameState.fen());
      modify(gameCopy);
      updateGameStatus(gameCopy);
      return gameCopy; // Triggers a perfectly synchronized, error-free re-render
    });
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    // In online mode, prevent moving pieces if it is not your turn or if you are a spectator
    if (matchMode === 'online') {
      if (playerColor === 'spectator') return false;
      const activeColor = game.turn() === 'w' ? 'white' : 'black';
      if (playerColor !== activeColor) return false;
    }

    let moveResult: any = null;

    // Mutate the board state safely using the functional updater
    safeGameMutate((gameCopy) => {
      try {
        moveResult = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q', // Always auto-promote to queen
        });
      } catch (e) {
        moveResult = null; // Caught if move is rules-invalid
      }
    });

    // If the move was illegal, snap the piece back
    if (moveResult === null) return false;

    // If online mode, broadcast the updated FEN position to the opponent
    if (matchMode === 'online' && socket && inRoom) {
      // Calculate the next FEN using a temporary clone to emit immediately
      const nextGameInstance = new Chess(game.fen());
      nextGameInstance.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      socket.emit('send_chess_move', { room, moveFen: nextGameInstance.fen() });
    }

    return true;
  };

  // 4. Request the matchmaking room allocation from the server
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim() || !socket) return;

    socket.emit('join_chess', room.trim());
    setInRoom(true);
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setHistory([]);
    setStatus('White to move');

    if (matchMode === 'online' && socket && inRoom) {
      socket.emit('send_chess_move', { room, moveFen: newGame.fen() });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link 
        href="/arena" 
        className="text-sm font-medium text-slate-400 hover:text-blue-400 transition inline-flex items-center gap-2 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Arena
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Board Canvas Layout */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col items-center">
          <div className="w-full max-w-[500px] aspect-square rounded-lg overflow-hidden shadow-2xl border border-slate-800">
            <Chessboard 
              position={game.fen() as any} // Direct live FEN evaluation
              onPieceDrop={onDrop as any} 
              boardOrientation={playerColor === 'spectator' ? 'white' : playerColor} // Orient board based on assigned role
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
              }}
              customDarkSquareStyle={{ backgroundColor: '#1e293b' }} // tailwind slate-800
              customLightSquareStyle={{ backgroundColor: '#cbd5e1' }} // tailwind slate-300
            />
          </div>
        </div>

        {/* Right Column: Controller / Session Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Chess Match Panel</h2>
              <p className="text-xs text-slate-400 mt-0.5">Toggle between Local Practice and Online Matches.</p>
            </div>

            {/* Mode Selector Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850">
              <button
                onClick={() => { 
                  const newGame = new Chess();
                  setGame(newGame);
                  setMatchMode('local'); 
                  setInRoom(false); 
                  setPlayerColor('white'); 
                  setStatus('White to move');
                  setHistory([]);
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  matchMode === 'local' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Local Play
              </button>
              <button
                onClick={() => setMatchMode('online')}
                className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  matchMode === 'online' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Online Match
              </button>
            </div>

            {/* Online Room Join Form */}
            {matchMode === 'online' && (
              <div className="space-y-4 border-t border-slate-850 pt-4">
                {!inRoom ? (
                  <form onSubmit={handleJoinRoom} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Enter Match Room ID
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., room_45"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-655 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!isConnected}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-md cursor-pointer"
                    >
                      {isConnected ? 'Connect & Enter Room' : 'Offline - Waiting for Socket'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Active Room:</span>
                      <span className="font-bold text-slate-300">{room}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-slate-850/40 pt-2">
                      <span className="text-slate-500">Your Color:</span>
                      <span className="font-bold text-slate-300 capitalize">{playerColor}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Match Status & Move Log */}
            <div className="space-y-3 border-t border-slate-850 pt-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Match Status</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{status}</p>
              </div>

              {/* Move list history panel */}
              {history.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Move History</span>
                  <div className="max-h-24 overflow-y-auto bg-slate-950/40 border border-slate-850 rounded-lg p-2 flex flex-wrap gap-1.5 text-xs text-slate-400">
                    {history.map((move, index) => (
                      <span key={index} className="bg-slate-850 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-300">
                        {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}{move}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allow board reset only in local play mode */}
              {matchMode === 'local' && (
                <button
                  onClick={resetGame}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Reset Board
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}