import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { generateSudoku } from '../utils/sudokuGenerator';
import { useAuth } from '../context/AuthContext';

const Sudoku = ({ onBack }) => {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(null);
  const [grid, setGrid] = useState(Array(9).fill(0).map(() => Array(9).fill(0)));
  const [initialGrid, setInitialGrid] = useState(Array(9).fill(0).map(() => Array(9).fill(0)));
  const [solution, setSolution] = useState([]);
  const [notes, setNotes] = useState(Array(81).fill(null).map(() => new Set()));
  const [selectedCell, setSelectedCell] = useState(null);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(0);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hints, setHints] = useState(1);
  const [gameMode, setGameMode] = useState(null); // 'classic' or 'extreme'
  const [selectionStage, setSelectionStage] = useState('mode'); // 'mode' or 'difficulty'
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [errorCell, setErrorCell] = useState(null);
  const [showLifeMinusOne, setShowLifeMinusOne] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);

  // Calcular cuántas veces aparece cada número
  const numberCounts = Array(10).fill(0);
  grid.forEach(row => row.forEach(val => {
    if (val !== 0) numberCounts[val]++;
  }));

  useEffect(() => {
    let interval;
    if (difficulty && !won && !gameOver && !showLevelModal && !isPaused) {
      interval = setInterval(() => {
        if (gameMode === 'extreme') {
          setTimer((t) => {
            if (t <= 1) {
              setGameOver(true);
              handleFinish('lost', lives, 0);
              clearInterval(interval);
              return 0;
            }
            return t - 1;
          });
        } else {
          setTimer((t) => t + 1);
        }

        // Guardar sesión cada 30 segundos si el usuario está logueado
        if (timer > 0 && timer % 30 === 0 && user) {
          saveCurrentSession();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [difficulty, won, gameOver, showLevelModal, isPaused, timer, gameMode]);

  // Verificar si hay una sesión guardada al entrar
  useEffect(() => {
    if (user) {
      checkSavedSession();
    }
  }, [user]);

  const checkSavedSession = async () => {
    try {
      const response = await axios.get('/game/session/sudoku');
      if (response.data) {
        setHasSavedSession(true);
      }
    } catch (error) {
      console.error('Error checking session', error);
    }
  };

  const resumeSession = async () => {
    try {
      const response = await axios.get('/game/session/sudoku');
      if (response.data) {
        const { grid, initialGrid, solution, notes, lives, timer, difficulty, gameMode, hints } = response.data.game_data;
        setGrid(grid);
        setInitialGrid(initialGrid);
        setSolution(solution);
        // Reconstruir Sets de notas desde el JSON
        setNotes(notes.map(n => new Set(n)));
        setLives(lives);
        setTimer(timer);
        setDifficulty(difficulty);
        setGameMode(gameMode || 'classic');
        setHints(hints !== undefined ? hints : 1);
        setWon(false);
        setGameOver(false);
        setShowLevelModal(false);
        setHasSavedSession(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error resuming session', error);
    }
  };

  const saveCurrentSession = async () => {
    if (!user || won || gameOver || !difficulty) return;
    try {
      await axios.post('/game/session', {
        game_name: 'sudoku',
        game_data: {
          grid,
          initialGrid,
          solution,
          notes: notes.map(n => Array.from(n)),
          lives,
          timer,
          difficulty,
          gameMode,
          hints
        }
      });
    } catch (error) {
      console.error('Error saving session', error);
    }
  };

  const handleFinish = async (result, finalLives = lives, finalTimer = timer) => {
    if (user) {
      try {
        // Enviar estadísticas e historial
        await axios.post('/game/stats', {
          game_name: 'sudoku',
          result: result, // 'won' or 'lost'
          time: finalTimer,
          difficulty: difficulty,
          lives_left: finalLives
        });
        // Borrar sesión al terminar
        await axios.delete('/game/session/sudoku');
      } catch (error) {
        console.error('Error updating stats', error);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startNewGame = async (level) => {
    // Si había una sesión guardada y el usuario elige juego nuevo, se borra la vieja
    if (user && hasSavedSession) {
      try {
        await axios.delete('/game/session/sudoku');
      } catch (e) {}
    }

    const { board, solution: sol } = generateSudoku(level);
    setGrid(board.map(row => [...row]));
    setInitialGrid(board.map(row => [...row]));
    setSolution(sol);
    setNotes(Array(81).fill(null).map(() => new Set()));
    setWon(false);
    setGameOver(false);
    setLives(3);
    
    if (gameMode === 'extreme') {
      setTimer(300); // 5 minutos = 300 segundos
      setHints(0);
    } else {
      setTimer(0);
      setHints(1);
    }
    
    setIsPaused(false);
    setSelectedCell(null);
    setDifficulty(level);
    setShowLevelModal(false);
    setSelectionStage('mode');
    setIsNotesMode(false);
    setHasSavedSession(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const useHint = () => {
    if (hints > 0 && selectedCell && !won && !gameOver && !isPaused) {
      const { r, c } = selectedCell;
      if (grid[r][c] !== 0) return; // Ya tiene un número

      const correctNum = solution[r][c];
      const newGrid = [...grid];
      newGrid[r][c] = correctNum;
      setGrid(newGrid);
      
      // Limpiar notas
      const newNotes = [...notes];
      newNotes[r * 9 + c] = new Set();
      setNotes(newNotes);

      setHints(0);
      
      if (checkWin(newGrid)) {
        setWon(true);
        handleFinish('won');
      }
    }
  };

  const handleCellClick = (r, c) => {
    setSelectedCell({ r, c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || won || gameOver) return;
    const { r, c } = selectedCell;
    
    if (initialGrid[r][c] !== 0) return;

    if (isNotesMode) {
      if (num === 0) return;
      const newNotes = [...notes];
      const cellIdx = r * 9 + c;
      const cellNotes = new Set(newNotes[cellIdx]);
      if (cellNotes.has(num)) cellNotes.delete(num);
      else cellNotes.add(num);
      newNotes[cellIdx] = cellNotes;
      setNotes(newNotes);
    } else {
      if (num === 0) {
        const newGrid = [...grid];
        newGrid[r][c] = 0;
        setGrid(newGrid);
        return;
      }

      if (num === grid[r][c]) return;

              if (num !== solution[r][c]) {
                const newLives = lives - 1;
                setLives(newLives);
                
                setShowLifeMinusOne(true);
                setTimeout(() => setShowLifeMinusOne(false), 1000);

                setErrorCell({ r, c, val: num });
                setTimeout(() => setErrorCell(null), 1000);

                if (newLives <= 0) {
                  setGameOver(true);
                  handleFinish('lost', 0, timer);
                }
                return;
              }

      const newGrid = [...grid];
      newGrid[r][c] = num;
      setGrid(newGrid);
      
      const newNotes = [...notes];
      newNotes[r * 9 + c] = new Set();
      setNotes(newNotes);

      if (checkWin(newGrid)) {
        setWon(true);
        handleFinish('won');
      }
    }
  };

  const checkWin = (currentGrid) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentGrid[r][c] === 0 || currentGrid[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 py-12 relative">
      {/* Modals: Won / Game Over / Level Selection / Pause */}
      {(won || gameOver || showLevelModal || isPaused) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 text-center animate-in zoom-in-95 duration-300">
            {isPaused ? (
              <>
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-rounded text-amber-500 text-5xl">pause_circle</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase">Juego en Pausa</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">Tómate un respiro. El tiempo se ha detenido.</p>
                <div className="grid gap-4">
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="w-full bg-sky-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-rounded">play_arrow</span>
                    CONTINUAR PARTIDA
                  </button>
                  <button 
                    onClick={() => { saveCurrentSession(); onBack(); }}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    GUARDAR Y SALIR
                  </button>
                </div>
              </>
            ) : showLevelModal ? (
              <>
                <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-rounded text-sky-500 text-5xl">poker_chip</span>
                </div>
                
                {selectionStage === 'mode' ? (
                  <>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight uppercase">Elige el Modo</h2>
                    
                    {hasSavedSession && (
                      <button 
                        onClick={resumeSession}
                        className="w-full mb-6 p-6 bg-sky-500 text-white rounded-3xl font-black flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-sky-500/20"
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-rounded text-3xl">resume</span>
                          <div className="text-left">
                            <span className="block text-xs opacity-80 uppercase tracking-widest">Partida Guardada</span>
                            <span className="text-lg uppercase">Reanudar</span>
                          </div>
                        </div>
                        <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">play_arrow</span>
                      </button>
                    )}

                    <div className="grid gap-4">
                      <button
                        onClick={() => { setGameMode('classic'); setSelectionStage('difficulty'); }}
                        className="group flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/5 transition-all hover:scale-[1.02] active:scale-98"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="bg-sky-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                            <span className="material-symbols-rounded text-2xl">grid_view</span>
                          </div>
                          <div>
                            <span className="block font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Modo Clásico</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Sin límite de tiempo + 1 Ayuda</span>
                          </div>
                        </div>
                        <span className="material-symbols-rounded text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </button>

                      <button
                        onClick={() => { setGameMode('extreme'); setSelectionStage('difficulty'); }}
                        className="group flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/5 transition-all hover:scale-[1.02] active:scale-98 border-red-500/20 hover:border-red-500/40"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="bg-red-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                            <span className="material-symbols-rounded text-2xl">timer</span>
                          </div>
                          <div>
                            <span className="block font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Modo Extremo</span>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">5 Minutos + Sin Ayudas</span>
                          </div>
                        </div>
                        <span className="material-symbols-rounded text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <button 
                        onClick={() => setSelectionStage('mode')}
                        className="text-slate-400 hover:text-sky-500 flex items-center gap-1 text-xs font-black uppercase tracking-widest transition-colors"
                      >
                        <span className="material-symbols-rounded text-sm">arrow_back</span>
                        Modo
                      </button>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Dificultad</h2>
                    </div>

                    <div className="grid gap-3">
                      {[
                        { id: 'easy', label: 'Fácil', icon: 'sentiment_satisfied', color: 'bg-emerald-500' },
                        { id: 'medium', label: 'Medio', icon: 'sentiment_neutral', color: 'bg-sky-500' },
                        { id: 'hard', label: 'Difícil', icon: 'sentiment_dissatisfied', color: 'bg-orange-500' },
                        { id: 'expert', label: 'Experto', icon: 'skull', color: 'bg-red-500' }
                      ].map((level) => (
                        <button
                          key={level.id}
                          onClick={() => startNewGame(level.id)}
                          className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className={`${level.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/10`}>
                              <span className="material-symbols-rounded text-xl">{level.icon}</span>
                            </div>
                            <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-sm">{level.label}</span>
                          </div>
                          <span className="material-symbols-rounded text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <button onClick={() => { saveCurrentSession(); onBack(); }} className="mt-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-black uppercase tracking-[0.2em]">Guardar y salir</button>
              </>
            ) : won ? (
              <>
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-rounded text-emerald-500 text-5xl">workspace_premium</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">¡VICTORIA!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Has completado el tablero en {formatTime(timer)}.</p>
                <div className="grid gap-4">
                  <button onClick={() => setShowLevelModal(true)} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-sky-500/30">JUGAR OTRA VEZ</button>
                  <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">VOLVER AL INICIO</button>
                </div>
              </>
            ) : (
                      <>
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                          <span className="material-symbols-rounded text-red-500 text-5xl">
                            {timer === 0 && gameMode === 'extreme' ? 'timer_off' : 'heart_broken'}
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">GAME OVER</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                          {timer === 0 && gameMode === 'extreme' ? '¡Se ha agotado el tiempo!' : 'Te has quedado sin vidas.'}
                        </p>
                        <div className="grid gap-4">
                          <button onClick={() => { setShowLevelModal(true); setSelectionStage('mode'); }} className="w-full bg-red-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-500/30">REINTENTAR</button>
                          <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">VOLVER AL INICIO</button>
                        </div>
                      </>
            )}
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { saveCurrentSession(); onBack(); }} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-sky-500 transition-all font-bold"
              title="Volver"
            >
              <span className="material-symbols-rounded text-2xl">arrow_back</span>
            </button>
            <button 
              onClick={() => setIsPaused(true)} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-sky-500 transition-all font-bold"
              title="Pausar"
            >
              <span className="material-symbols-rounded text-2xl">pause</span>
            </button>
            <button 
              onClick={useHint}
              disabled={hints === 0 || !selectedCell || grid[selectedCell.r][selectedCell.c] !== 0}
              className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                hints > 0 && selectedCell && grid[selectedCell.r][selectedCell.c] === 0
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:scale-110 active:scale-95' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
              }`}
              title="Usar Ayuda"
            >
              <span className="material-symbols-rounded">lightbulb</span>
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900 transition-all ${hints > 0 ? 'bg-amber-600 text-white' : 'bg-slate-400 text-slate-100'}`}>
                {hints}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/5 relative">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-white/10 relative">
              <span className="material-symbols-rounded text-red-500 fill-red-500">favorite</span>
              <span className="font-black text-xl text-slate-700 dark:text-slate-200">{lives}</span>
              {showLifeMinusOne && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-red-500 font-black animate__animated animate__fadeOutUp">
                  -1
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-sky-500">timer</span>
              <span className="font-black text-xl text-slate-700 dark:text-slate-200 tabular-nums">{formatTime(timer)}</span>
            </div>
          </div>
        </div>

                <button onClick={() => { setShowLevelModal(true); setSelectionStage('mode'); }} className={`w-[200px] h-[48px] flex flex-col items-center justify-center gap-0 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg ${gameMode === 'extreme' ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-sky-500 text-white shadow-sky-500/30'}`}>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-rounded text-sm">{gameMode === 'extreme' ? 'bolt' : 'grid_view'}</span>
                    <span>{gameMode === 'extreme' ? 'Extremo' : 'Clásico'}</span>
                  </div>
                  <span className="opacity-80 text-[8px]">{difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Medio' : difficulty === 'hard' ? 'Difícil' : difficulty === 'expert' ? 'Experto' : 'Nuevo Juego'}</span>
                </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Sudoku Board */}
        <div className={`lg:col-span-7 xl:col-span-8 aspect-square bg-slate-300 dark:bg-slate-800 p-2 rounded-2xl shadow-2xl border-4 border-slate-300 dark:border-slate-800 grid grid-cols-9 gap-px overflow-hidden relative transition-all duration-500 ${isPaused ? 'blur-xl grayscale opacity-50 scale-95' : ''}`}>
          {grid.map((row, r) => (
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isInitial = initialGrid[r][c] !== 0;
              const cellValue = grid[r][c];
              const isError = errorCell?.r === r && errorCell?.c === c;
              const displayValue = isError ? errorCell.val : cellValue;
              const cellIdx = r * 9 + c;
              const cellNotes = notes[cellIdx];

              const isSameRow = selectedCell?.r === r;
              const isSameCol = selectedCell?.c === c;
              const isSameBox = selectedCell && 
                Math.floor(selectedCell.r / 3) === Math.floor(r / 3) && 
                Math.floor(selectedCell.c / 3) === Math.floor(c / 3);
              const isSameValue = selectedCell && 
                grid[selectedCell.r][selectedCell.c] !== 0 && 
                grid[selectedCell.r][selectedCell.c] === cellValue;
              const isHighlighted = isSameRow || isSameCol || isSameBox || isSameValue;
              
              const borderR = (r + 1) % 3 === 0 && r < 8 ? 'border-b-4 border-slate-300 dark:border-slate-800' : '';
              const borderC = (c + 1) % 3 === 0 && c < 8 ? 'border-r-4 border-slate-300 dark:border-slate-800' : '';

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`
                    flex items-center justify-center relative transition-all text-2xl md:text-3xl font-black
                    ${isError ? 'bg-red-500/20 text-red-600 dark:text-red-400 animate__animated animate__headShake' : isInitial ? 'text-slate-900 dark:text-slate-300' : 'text-emerald-700 dark:text-sky-400'}
                    ${isSelected 
                      ? 'bg-lime-400/60 dark:bg-sky-500/50 ring-4 ring-inset ring-lime-600 dark:ring-sky-500 z-10' 
                      : isSameValue 
                        ? 'bg-lime-300/50 dark:bg-sky-500/35'
                        : isHighlighted 
                          ? 'bg-lime-100/80 dark:bg-sky-400/5' 
                          : 'bg-white dark:bg-slate-900/80'}
                    ${borderR} ${borderC}
                  `}
                >
                  {displayValue !== 0 ? displayValue : (
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <span key={n} className="text-[10px] leading-none text-slate-400 dark:text-slate-500 flex items-center justify-center font-bold">
                          {cellNotes.has(n) ? n : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          ))}
        </div>

        {/* Controls */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-black/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Controles</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsNotesMode(!isNotesMode)}
                  className={`flex items-center gap-2 px-4 py-2 h-12 rounded-xl text-xs font-black transition-all ${isNotesMode ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  <span className="material-symbols-rounded text-sm">edit_note</span>
                  <span className="hidden sm:inline">NOTAS: {isNotesMode ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const isCompleted = numberCounts[num] >= 9;
                return (
                  <button
                    key={num}
                    onClick={() => !isCompleted && handleNumberInput(num)}
                    disabled={isCompleted}
                    className={`aspect-square rounded-2xl text-2xl font-black transition-all border border-slate-200 dark:border-white/5 shadow-lg shadow-black/5 flex items-center justify-center
                      ${isCompleted 
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50' 
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-900 dark:text-white active:scale-95'
                      }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sudoku;
