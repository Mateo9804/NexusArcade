import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10, label: 'Fácil', icon: 'sentiment_satisfied', color: 'bg-emerald-500' },
  medium: { rows: 16, cols: 16, mines: 40, label: 'Medio', icon: 'sentiment_neutral', color: 'bg-sky-500' },
  hard: { rows: 16, cols: 30, mines: 99, label: 'Difícil', icon: 'sentiment_dissatisfied', color: 'bg-orange-500' },
  expert: { rows: 20, cols: 30, mines: 145, label: 'Experto', icon: 'skull', color: 'bg-red-500' }
};

const Minesweeper = ({ onBack }) => {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('selection'); // selection, playing, won, lost
  const [timer, setTimer] = useState(0);
  const [flagsUsed, setFlagsUsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [firstClick, setFirstClick] = useState(true);

  // Timer Effect
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && !isPaused) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
        if (timer > 0 && timer % 30 === 0 && user) {
          saveCurrentSession();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, isPaused, timer, user]);

  // Check for saved session
  useEffect(() => {
    if (user) {
      checkSavedSession();
    }
  }, [user]);

  const checkSavedSession = async () => {
    try {
      const response = await axios.get('/game/session/minesweeper');
      if (response.data) {
        setHasSavedSession(true);
      }
    } catch (error) {
      console.error('Error checking session', error);
    }
  };

  const saveCurrentSession = async () => {
    if (!user || gameState !== 'playing' || !difficulty) return;
    try {
      await axios.post('/game/session', {
        game_name: 'minesweeper',
        game_data: {
          grid,
          difficulty,
          timer,
          flagsUsed,
          firstClick
        }
      });
    } catch (error) {
      console.error('Error saving session', error);
    }
  };

  const resumeSession = async () => {
    try {
      const response = await axios.get('/game/session/minesweeper');
      if (response.data) {
        const { grid, difficulty, timer, flagsUsed, firstClick } = response.data.game_data;
        setGrid(grid);
        setDifficulty(difficulty);
        setTimer(timer);
        setFlagsUsed(flagsUsed);
        setFirstClick(firstClick);
        setGameState('playing');
        setShowLevelModal(false);
        setHasSavedSession(false);
      }
    } catch (error) {
      console.error('Error resuming session', error);
    }
  };

  const handleFinish = async (result) => {
    setGameState(result);
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
          game_name: 'minesweeper',
          result: result,
          time: timer,
          difficulty: difficulty,
          moves: 0 // In minesweeper we can use cells revealed as moves if we want
        });
        await axios.delete('/game/session/minesweeper');
      } catch (error) {
        console.error('Error updating stats', error);
      }
    }
  };

  const initGame = (level) => {
    const config = DIFFICULTIES[level];
    const newGrid = Array(config.rows).fill(null).map((_, r) =>
      Array(config.cols).fill(null).map((_, c) => ({
        r, c,
        isMine: false,
        revealed: false,
        flagged: false,
        neighborMines: 0
      }))
    );

    setGrid(newGrid);
    setDifficulty(level);
    setGameState('playing');
    setTimer(0);
    setFlagsUsed(0);
    setFirstClick(true);
    setShowLevelModal(false);
    setHasSavedSession(false);
  };

  const placeMines = (excludeR, excludeC) => {
    const config = DIFFICULTIES[difficulty];
    const newGrid = [...grid.map(row => [...row.map(cell => ({ ...cell }))])];
    let minesPlaced = 0;

    while (minesPlaced < config.mines) {
      const r = Math.floor(Math.random() * config.rows);
      const c = Math.floor(Math.random() * config.cols);

      // Avoid placing mine on first click or already mined cell
      if (!newGrid[r][c].isMine && (Math.abs(r - excludeR) > 1 || Math.abs(c - excludeC) > 1)) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbors
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }

    return newGrid;
  };

  const revealCell = (r, c) => {
    if (gameState !== 'playing' || isPaused || grid[r][c].revealed || grid[r][c].flagged) return;

    let newGrid;
    if (firstClick) {
      newGrid = placeMines(r, c);
      setFirstClick(false);
    } else {
      newGrid = [...grid.map(row => [...row.map(cell => ({ ...cell }))])];
    }

    if (newGrid[r][c].isMine) {
      // Reveal all mines
      newGrid.forEach(row => row.forEach(cell => {
        if (cell.isMine) cell.revealed = true;
      }));
      setGrid(newGrid);
      handleFinish('lost');
      return;
    }

    const floodFill = (grid, r, c) => {
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c].revealed || grid[r][c].flagged) return;
      
      grid[r][c].revealed = true;
      if (grid[r][c].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            floodFill(grid, r + dr, c + dc);
          }
        }
      }
    };

    floodFill(newGrid, r, c);
    setGrid(newGrid);

    // Check Win
    const config = DIFFICULTIES[difficulty];
    let nonMineCells = config.rows * config.cols - config.mines;
    let revealedCells = 0;
    newGrid.forEach(row => row.forEach(cell => {
      if (cell.revealed && !cell.isMine) revealedCells++;
    }));

    if (revealedCells === nonMineCells) {
      handleFinish('won');
    }
  };

  const toggleFlag = (e, r, c) => {
    e.preventDefault();
    if (gameState !== 'playing' || isPaused || grid[r][c].revealed) return;

    const newGrid = [...grid.map(row => [...row.map(cell => ({ ...cell }))])];
    const isFlagged = newGrid[r][c].flagged;
    
    if (!isFlagged && flagsUsed >= DIFFICULTIES[difficulty].mines) return;

    newGrid[r][c].flagged = !isFlagged;
    setFlagsUsed(prev => isFlagged ? prev - 1 : prev + 1);
    setGrid(newGrid);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 py-12 relative select-none">
      <AnimatePresence>
        {(gameState === 'won' || gameState === 'lost' || showLevelModal || isPaused) && (
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
                    <button onClick={() => { saveCurrentSession(); onBack(); }} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">GUARDAR Y SALIR</button>
                  </div>
                </>
              ) : showLevelModal ? (
                <>
                  <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-rounded text-sky-500 text-5xl">bomb</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight uppercase">Buscaminas</h2>
                  
                  {hasSavedSession && (
                    <button onClick={resumeSession} className="w-full mb-6 p-6 bg-sky-500 text-white rounded-3xl font-black flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-sky-500/20">
                      <div className="flex items-center gap-4 text-left">
                        <span className="material-symbols-rounded text-3xl">resume</span>
                        <div>
                          <span className="block text-xs opacity-80 uppercase tracking-widest">Partida Guardada</span>
                          <span className="text-lg uppercase">Reanudar</span>
                        </div>
                      </div>
                      <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">play_arrow</span>
                    </button>
                  )}

                  <div className="grid gap-3">
                    {Object.entries(DIFFICULTIES).map(([id, level]) => (
                      <button key={id} onClick={() => initGame(id)} className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-4 text-left">
                          <div className={`${level.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/10`}>
                            <span className="material-symbols-rounded text-xl">{level.icon}</span>
                          </div>
                          <div>
                            <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-sm">{level.label}</span>
                            <span className="block text-[10px] text-slate-500 uppercase">{level.rows}x{level.cols} - {level.mines} Minas</span>
                          </div>
                        </div>
                        <span className="material-symbols-rounded text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={onBack} className="mt-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-black uppercase tracking-widest">Volver</button>
                </>
              ) : gameState === 'won' ? (
                <>
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-rounded text-emerald-500 text-5xl">workspace_premium</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">¡VICTORIA!</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Has despejado el campo en {formatTime(timer)}.</p>
                  <div className="grid gap-4">
                    <button onClick={() => setShowLevelModal(true)} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-sky-500/30">NUEVA PARTIDA</button>
                    <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">VOLVER AL INICIO</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-rounded text-red-500 text-5xl">bomb</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">¡BOOM!</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Has pisado una mina.</p>
                  <div className="grid gap-4">
                    <button onClick={() => setShowLevelModal(true)} className="w-full bg-red-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-500/30">REINTENTAR</button>
                    <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">VOLVER AL INICIO</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => { saveCurrentSession(); onBack(); }} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-sky-500 transition-all">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <button onClick={() => setIsPaused(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-sky-500 transition-all">
            <span className="material-symbols-rounded">pause</span>
          </button>

          <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-white/10">
              <span className="material-symbols-rounded text-red-500">flag</span>
              <span className="font-black text-xl text-slate-700 dark:text-slate-200 tabular-nums">
                {difficulty ? DIFFICULTIES[difficulty].mines - flagsUsed : 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-sky-500">timer</span>
              <span className="font-black text-xl text-slate-700 dark:text-slate-200 tabular-nums">{formatTime(timer)}</span>
            </div>
          </div>
        </div>

        {difficulty && (
          <button onClick={() => setShowLevelModal(true)} className={`px-6 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${DIFFICULTIES[difficulty].color}`}>
            {DIFFICULTIES[difficulty].label} - NUEVO JUEGO
          </button>
        )}
      </div>

      {/* Grid Container */}
      <div className="flex justify-center overflow-auto pb-8">
        <div 
          className="inline-grid gap-1 p-3 bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-inner border-4 border-slate-200 dark:border-slate-800"
          style={{ 
            gridTemplateColumns: `repeat(${difficulty ? DIFFICULTIES[difficulty].cols : 0}, minmax(0, 1fr))` 
          }}
        >
          {grid.map((row, r) => (
            row.map((cell, c) => (
              <Cell 
                key={`${r}-${c}`}
                cell={cell}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                isGameOver={gameState !== 'playing'}
              />
            ))
          ))}
        </div>
      </div>
    </div>
  );
};

const Cell = ({ cell, onClick, onContextMenu, isGameOver }) => {
  const getNumberColor = (num) => {
    const colors = [
      '', 'text-blue-500', 'text-green-500', 'text-red-500', 
      'text-purple-500', 'text-maroon-500', 'text-turquoise-500', 
      'text-black', 'text-gray-500'
    ];
    return colors[num] || '';
  };

  return (
    <motion.button
      whileHover={!cell.revealed && !cell.flagged ? { scale: 1.05 } : {}}
      whileTap={!cell.revealed && !cell.flagged ? { scale: 0.95 } : {}}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`
        w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md sm:rounded-lg text-lg font-black transition-all
        ${cell.revealed 
          ? cell.isMine 
            ? 'bg-red-500 text-white' 
            : 'bg-slate-50 dark:bg-slate-900/50 shadow-inner'
          : 'bg-white dark:bg-slate-700 shadow-md hover:bg-slate-50 dark:hover:bg-slate-600'}
      `}
    >
      {cell.revealed ? (
        cell.isMine ? (
          <span className="material-symbols-rounded text-sm sm:text-lg">bomb</span>
        ) : cell.neighborMines > 0 ? (
          <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
        ) : null
      ) : cell.flagged ? (
        <span className="material-symbols-rounded text-red-500 text-sm sm:text-lg">flag</span>
      ) : null}
    </motion.button>
  );
};

export default Minesweeper;

