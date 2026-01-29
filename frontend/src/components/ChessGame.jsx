import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const ChessGame = ({ onBack }) => {
  const { user } = useAuth();
// ... código anterior ...
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState(2); // 1: Fácil, 2: Medio, 3: Difícil (profundidad)
  const [userColor, setUserColor] = useState('w'); // 'w' o 'b'
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [hintMoves, setHintMoves] = useState([]);
  const [gameState, setGameState] = useState('selection'); // selection, playing, finished
  const [timer, setTimer] = useState({ w: 600, b: 600 });
  const [activeColor, setActiveColor] = useState('w');
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [lastMove, setLastMove] = useState(null);

  const timerRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing' && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          [activeColor]: Math.max(0, prev[activeColor] - 1)
        }));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, isPaused, activeColor]);

  // Check Game Over
  useEffect(() => {
    if (game.isGameOver()) {
      handleGameOver();
    }
  }, [game]);

  const handleGameOver = async () => {
    setGameState('finished');
    let result = 'draw';
    if (game.isCheckmate()) {
      result = game.turn() === userColor ? 'lost' : 'won';
    }

    if (result === 'won') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0ea5e9', '#22c55e', '#ffffff']
      });
    }

    if (user) {
      try {
        await axios.post('/game/stats', {
          game_name: 'chess',
          result: result === 'draw' ? 'lost' : result, // 'won' or 'lost'
          time: 600 - timer.w,
          difficulty: difficulty.toString(),
          moves: game.history().length
        });
      } catch (error) {
        console.error('Error saving chess stats', error);
      }
    }
  };

  const makeMove = useCallback((move) => {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        setMoveHistory(game.history());
        setLastMove({ from: result.from, to: result.to });
        setActiveColor(game.turn());
        setSelectedSquare(null);
        setHintMoves([]);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game]);

  // IA - Minimax con poda Alpha-Beta simple
  const evaluateBoard = (chess) => {
    const values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
    let score = 0;
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = values[piece.type];
          score += piece.color === 'w' ? val : -val;
        }
      }
    }
    return score;
  };

  const minimax = (chess, depth, alpha, beta, isMaximizing) => {
    if (depth === 0 || chess.isGameOver()) {
      return evaluateBoard(chess);
    }

    const moves = chess.moves();
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const ev = minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const ev = minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  const findBestMove = () => {
    const moves = game.moves();
    let bestMove = null;
    const isMaximizing = userColor === 'b'; // Si el usuario es negras, la IA es blancas (maximiza)
    let bestValue = isMaximizing ? -Infinity : Infinity;

    for (const move of moves) {
      game.move(move);
      const boardValue = minimax(game, difficulty - 1, -Infinity, Infinity, !isMaximizing);
      game.undo();
      
      if (isMaximizing) {
        if (boardValue >= bestValue) {
          bestValue = boardValue;
          bestMove = move;
        }
      } else {
        if (boardValue <= bestValue) {
          bestValue = boardValue;
          bestMove = move;
        }
      }
    }
    return bestMove;
  };

  useEffect(() => {
    if (gameState === 'playing' && game.turn() !== userColor && !game.isGameOver() && !isPaused) {
      const timerIA = setTimeout(() => {
        const move = findBestMove();
        if (move) makeMove(move);
      }, 500);
      return () => clearTimeout(timerIA);
    }
  }, [game, gameState, isPaused, makeMove, userColor]);

  const onSquareClick = (square) => {
    if (gameState !== 'playing' || isPaused || game.turn() !== userColor) return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setHintMoves([]);
      return;
    }

    const piece = game.get(square);
    if (piece && piece.color === userColor) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setHintMoves(moves.map(m => m.to));
      return;
    }

    if (selectedSquare) {
      const moveResult = makeMove({ from: selectedSquare, to: square, promotion: 'q' });
      if (!moveResult) {
        // Si no fue un movimiento válido, pero hizo clic en otra pieza propia
        if (piece && piece.color === 'w') {
          setSelectedSquare(square);
          const moves = game.moves({ square, verbose: true });
          setHintMoves(moves.map(m => m.to));
        } else {
          setSelectedSquare(null);
          setHintMoves([]);
        }
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initGame = (level) => {
    const randomColor = Math.random() > 0.5 ? 'w' : 'b';
    setDifficulty(level);
    setUserColor(randomColor);
    setGame(new Chess());
    setMoveHistory([]);
    setGameState('playing');
    setTimer({ w: 600, b: 600 });
    setActiveColor('w');
    setShowLevelModal(false);
    setLastMove(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 py-12 relative select-none">
      <AnimatePresence>
        {(showLevelModal || isPaused || gameState === 'finished') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 text-center"
            >
              {isPaused ? (
                <>
                  <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-rounded text-amber-500 text-5xl">pause_circle</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase">Juego en Pausa</h2>
                  <div className="grid gap-4">
                    <button onClick={() => setIsPaused(false)} className="w-full bg-sky-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3">
                      <span className="material-symbols-rounded">play_arrow</span> CONTINUAR
                    </button>
                    <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">VOLVER AL INICIO</button>
                  </div>
                </>
              ) : showLevelModal ? (
                <>
                  <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-rounded text-sky-500 text-5xl">chess</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight uppercase">Ajedrez</h2>
                  <div className="grid gap-3">
                    {[
                      { id: 1, label: 'Principiante', color: 'bg-emerald-500', icon: 'child_care' },
                      { id: 2, label: 'Intermedio', color: 'bg-sky-500', icon: 'person' },
                      { id: 3, label: 'Avanzado', color: 'bg-red-500', icon: 'psychology' }
                    ].map((level) => (
                      <button key={level.id} onClick={() => initGame(level.id)} className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-4 text-left">
                          <div className={`${level.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/10`}>
                            <span className="material-symbols-rounded text-xl">{level.icon}</span>
                          </div>
                          <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-sm">{level.label}</span>
                        </div>
                        <span className="material-symbols-rounded text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={onBack} className="mt-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-black uppercase tracking-widest">Cerrar</button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-rounded text-sky-500 text-5xl">emoji_events</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">
                    {game.isCheckmate() ? (game.turn() === 'w' ? '¡DERROTA!' : '¡VICTORIA!') : '¡TABLAS!'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                    {game.isCheckmate() ? `Jaque mate en ${game.history().length} movimientos.` : 'La partida ha terminado en empate.'}
                  </p>
                  <div className="grid gap-4">
                    <button onClick={() => setShowLevelModal(true)} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-sky-500/30">NUEVA PARTIDA</button>
                    <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">VOLVER AL INICIO</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 items-start">
        {/* Board Section */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white border border-white/10">
                 <span className="material-symbols-rounded">computer</span>
               </div>
               <div>
                 <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Oponente</span>
                 <span className="font-black text-slate-700 dark:text-slate-200 uppercase">Nexus AI (Niv. {difficulty})</span>
               </div>
             </div>
             <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm">
               <span className="material-symbols-rounded text-sky-500">timer</span>
               <span className="font-black text-xl tabular-nums">{formatTime(userColor === 'w' ? timer.b : timer.w)}</span>
             </div>
          </div>

          <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 p-1 sm:p-2 rounded-xl shadow-2xl grid grid-cols-8 grid-rows-8 relative overflow-hidden border-4 border-slate-300 dark:border-slate-700">
            {Array(64).fill(null).map((_, i) => {
              const r = Math.floor(i / 8);
              const c = i % 8;
              const square = `${String.fromCharCode(97 + c)}${8 - r}`;
              const isDark = (r + c) % 2 === 1;
              const piece = game.get(square);
              const isSelected = selectedSquare === square;
              const isLastMove = lastMove?.from === square || lastMove?.to === square;
              const isHint = hintMoves.includes(square);
              const isCheck = game.inCheck() && piece?.type === 'k' && piece?.color === game.turn();

              return (
                <div 
                  key={square}
                  onClick={() => onSquareClick(square)}
                  className={`
                    relative flex items-center justify-center cursor-pointer transition-colors w-full h-full
                    ${isDark ? 'bg-[#4b7399] dark:bg-[#3b4b6b]' : 'bg-[#eae9d2] dark:bg-[#94a3b8]'}
                    ${isSelected ? 'ring-4 ring-inset ring-sky-400 z-10' : ''}
                    ${isLastMove ? 'bg-amber-400/40' : ''}
                    ${isCheck ? 'bg-red-500/60' : ''}
                  `}
                >
                  {isHint && (
                    <div className={`absolute w-4 h-4 rounded-full ${piece ? 'ring-4 ring-sky-500/50' : 'bg-sky-500/30'}`}></div>
                  )}
                  {piece && (
                    <Piece piece={piece} />
                  )}
                  {c === 0 && <span className={`absolute top-0.5 left-0.5 text-[8px] font-black ${isDark ? 'text-slate-100' : 'text-slate-400'}`}>{8 - r}</span>}
                  {r === 7 && <span className={`absolute bottom-0.5 right-0.5 text-[8px] font-black ${isDark ? 'text-slate-100' : 'text-slate-400'}`}>{String.fromCharCode(97 + c)}</span>}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-900 border border-slate-200">
                 <span className="material-symbols-rounded">person</span>
               </div>
               <div>
                 <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Jugador</span>
                 <span className="font-black text-slate-700 dark:text-slate-200 uppercase">{user?.name || 'Invitado'}</span>
               </div>
             </div>
             <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm">
               <span className="material-symbols-rounded text-sky-500">timer</span>
               <span className="font-black text-xl tabular-nums">{formatTime(userColor === 'w' ? timer.w : timer.b)}</span>
             </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8 w-full">
          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Historial</h2>
              <button onClick={() => setIsPaused(true)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-sky-500 transition-all">
                <span className="material-symbols-rounded">pause</span>
              </button>
            </div>

            <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {moveHistory.reduce((acc, move, i) => {
                  if (i % 2 === 0) acc.push([move]);
                  else acc[acc.length - 1].push(move);
                  return acc;
                }, []).map((pair, i) => (
                  <React.Fragment key={i}>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-white/5">
                      <span className="text-[10px] font-black text-slate-400">{i + 1}.</span>
                      <span className="font-black text-slate-700 dark:text-slate-200">{pair[0]}</span>
                    </div>
                    {pair[1] && (
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-white/5">
                        <span className="text-[10px] font-black text-slate-400"></span>
                        <span className="font-black text-slate-700 dark:text-slate-200">{pair[1]}</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
              <button onClick={onBack} className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl font-black text-xs text-slate-500 hover:text-red-500 transition-all">
                <span className="material-symbols-rounded text-sm">logout</span> RENDIRSE
              </button>
              <button onClick={() => setShowLevelModal(true)} className="flex items-center justify-center gap-2 bg-sky-500 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <span className="material-symbols-rounded text-sm">refresh</span> NUEVA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Piece = ({ piece }) => {
  const pieceName = piece.color + piece.type.toUpperCase();
  // Usamos el set C. Burnett desde el CDN de Lichess (formato SVG)
  const url = `https://lichess1.org/assets/piece/cburnett/${pieceName}.svg`;

  return (
    <motion.img 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      src={url} 
      alt={pieceName}
      className="w-[85%] h-[85%] object-contain select-none"
    />
  );
};

export default ChessGame;

