import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { Connect4 as Connect4Logic } from '../utils/Connect4Logic';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

// --- IA LOGIC (Minimax Simple) ---
const checkWin = (cells, player) => {
  const winPatterns = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c <= 3; c++) winPatterns.push([r * 7 + c, r * 7 + c + 1, r * 7 + c + 2, r * 7 + c + 3]);
  }
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c < 7; c++) winPatterns.push([r * 7 + c, (r + 1) * 7 + c, (r + 2) * 7 + c, (r + 3) * 7 + c]);
  }
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c <= 3; c++) winPatterns.push([r * 7 + c, (r + 1) * 7 + c + 1, (r + 2) * 7 + c + 2, (r + 3) * 7 + c + 3]);
  }
  for (let r = 3; r < 6; r++) {
    for (let c = 0; c <= 3; c++) winPatterns.push([r * 7 + c, (r - 1) * 7 + c + 1, (r - 2) * 7 + c + 2, (r - 3) * 7 + c + 3]);
  }

  return winPatterns.some(p => p.every(idx => cells[idx] === player));
};

const getValidMoves = (cells) => {
  const moves = [];
  for (let c = 0; c < 7; c++) {
    if (cells[c] === null) moves.push(c);
  }
  return moves;
};

const simulateMove = (cells, col, player) => {
  const newCells = [...cells];
  for (let r = 5; r >= 0; r--) {
    if (newCells[r * 7 + col] === null) {
      newCells[r * 7 + col] = player;
      break;
    }
  }
  return newCells;
};

const findBestMove = (cells, difficulty) => {
  const validMoves = getValidMoves(cells);
  if (validMoves.length === 0) return null;
  
  // Dificultad Fácil: Movimiento aleatorio
  if (difficulty === 'facil') {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // Dificultad Normal/Difícil: Buscar ganar o bloquear
  // 1. ¿Puedo ganar en este movimiento? (IA es '1')
  for (let move of validMoves) {
    if (checkWin(simulateMove(cells, move, '1'), '1')) return move;
  }

  // 2. ¿Puede el jugador ganar en su siguiente movimiento? Bloquear. (Jugador es '0')
  for (let move of validMoves) {
    if (checkWin(simulateMove(cells, move, '0'), '0')) return move;
  }

  // Dificultad Difícil: Preferir el centro
  if (difficulty === 'dificil') {
    const preferredOrder = [3, 2, 4, 1, 5, 0, 6];
    for (let move of preferredOrder) {
      if (validMoves.includes(move)) return move;
    }
  }

  // Por defecto, aleatorio entre los válidos
  return validMoves[Math.floor(Math.random() * validMoves.length)];
};

const Connect4Board = ({ G, ctx, moves, onBack, user, difficulty }) => {
  const isWinner = ctx.gameover?.winner !== undefined;
  const isDraw = ctx.gameover?.draw;
  const currentPlayer = ctx.currentPlayer;

  const handleCellClick = (col) => {
    // Solo permitir click si es el turno del jugador ('0')
    if (ctx.gameover || currentPlayer !== '0') return;
    moves.dropToken(col);
  };

  // Turno de la IA
  useEffect(() => {
    if (currentPlayer === '1' && !ctx.gameover) {
      const timer = setTimeout(() => {
        const bestMove = findBestMove(G.cells, difficulty);
        if (bestMove !== null) {
          moves.dropToken(bestMove);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, ctx.gameover, G.cells, difficulty, moves]);

  useEffect(() => {
    if (ctx.gameover) {
      if (ctx.gameover.winner === '0') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#ffffff']
        });
      }
      saveStats();
    }
  }, [ctx.gameover]);

  const saveStats = async () => {
    if (user) {
      try {
        await axios.post('/game/stats', {
          game_name: 'connect4',
          result: ctx.gameover?.winner === '0' ? 'won' : 'lost',
          time: 0,
          moves: 0,
          difficulty: difficulty
        });
      } catch (e) {}
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 py-12 flex flex-col items-center">
      <AnimatePresence>
        {ctx.gameover && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl text-center border border-slate-200 dark:border-white/10"
            >
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase">
                {isWinner ? (ctx.gameover.winner === '0' ? '¡GANASTE!' : 'GANÓ LA IA') : '¡EMPATE!'}
              </h2>
              <p className="text-slate-500 mb-8 uppercase font-bold tracking-widest text-xs">Dificultad: {difficulty}</p>
              <div className="grid gap-4 mt-8">
                <button onClick={() => window.location.reload()} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black shadow-lg">REINTENTAR</button>
                <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">VOLVER AL INICIO</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between w-full max-w-[500px] mb-8 items-center bg-slate-100 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 text-slate-500 hover:text-sky-500 transition-all shadow-sm">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Turno</span>
            <span className={`text-xl font-black ${currentPlayer === '0' ? 'text-blue-500' : 'text-red-500'} uppercase transition-colors duration-500`}>
              {currentPlayer === '0' ? 'Tuyo' : 'IA pensando...'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Nivel</span>
          <span className="text-lg font-black text-slate-700 dark:text-white uppercase">{difficulty}</span>
        </div>
      </div>

      <div className="relative bg-blue-600 p-4 rounded-3xl shadow-2xl border-8 border-blue-700 max-w-full overflow-hidden">
        <div className="grid grid-cols-7 gap-3 sm:gap-4">
          {Array(7).fill(null).map((_, col) => (
            <div key={col} className="flex flex-col gap-3 sm:gap-4 group">
              {Array(6).fill(null).map((_, row) => {
                const cellIndex = row * 7 + col;
                const value = G.cells[cellIndex];
                return (
                  <button
                    key={row}
                    disabled={currentPlayer !== '0' || ctx.gameover}
                    onClick={() => handleCellClick(col)}
                    className={`w-10 h-10 sm:w-16 sm:h-16 rounded-full border-4 border-blue-800 shadow-inner flex items-center justify-center transition-all duration-300 relative
                      ${value === null ? 'bg-blue-900/50 hover:bg-blue-800/70' : value === '0' ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]'}
                    `}
                  >
                    {value !== null && (
                      <motion.div 
                        initial={{ y: -300, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                        className="w-full h-full rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] text-center max-w-[300px]">
        {currentPlayer === '0' ? 'TU TURNO - ELIGE UNA COLUMNA' : 'ESPERANDO MOVIMIENTO DE LA IA...'}
      </div>
    </div>
  );
};

const Connect4Client = Client({
  game: Connect4Logic,
  board: Connect4Board,
  numPlayers: 2,
  debug: false,
});

const Conecta4 = ({ onBack }) => {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(null);

  if (!difficulty) {
    return (
      <div className="max-w-4xl mx-auto p-6 py-20 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 text-center w-full max-w-lg"
        >
          <div className="w-20 h-20 bg-blue-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="material-symbols-rounded text-white text-5xl">grid_4x4</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 uppercase">CONECTA 4</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">Selecciona la dificultad de la IA</p>
          
          <div className="grid gap-4">
            {[
              { id: 'facil', label: 'PRINCIPIANTE', color: 'bg-green-500' },
              { id: 'normal', label: 'INTERMEDIO', color: 'bg-amber-500' },
              { id: 'dificil', label: 'EXPERTO', color: 'bg-rose-500' }
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setDifficulty(lvl.id)}
                className={`group relative overflow-hidden w-full ${lvl.color} text-white py-6 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative">{lvl.label}</span>
              </button>
            ))}
            <button 
              onClick={onBack}
              className="mt-4 w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              CANCELAR
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // NO pasar playerID para que moves.dropToken() funcione para cualquier turno localmente
  return <Connect4Client onBack={onBack} user={user} difficulty={difficulty} />;
};

export default Conecta4;
