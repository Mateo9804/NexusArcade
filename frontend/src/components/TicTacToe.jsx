import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TicTacToe = ({ onBack }) => {
  const { user } = useAuth();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [difficulty, setDifficulty] = useState(null);
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);

  // Sistema de puntuación para Minimax
  const scores = {
    O: 10,
    X: -10,
    tie: 0
  };

  useEffect(() => {
    let interval;
    if (difficulty && !winner && !showLevelModal) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [difficulty, winner, showLevelModal]);

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
      [0, 4, 8], [2, 4, 6]             // Diagonales
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    if (squares.every(s => s !== null)) return { winner: 'tie', line: [] };
    return null;
  };

  const minimax = (squares, depth, isMaximizing) => {
    const result = checkWinner(squares);
    if (result) return scores[result.winner];

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          let score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          let score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (currentBoard, diff) => {
    const availableMoves = currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    
    // Nivel Fácil: Movimiento aleatorio
    if (diff === 'easy') {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // Nivel Medio: 50% probabilidad de movimiento óptimo, 50% aleatorio
    if (diff === 'medium') {
      if (Math.random() > 0.5) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    }

    // Nivel Imposible (o el otro 50% de Medio): Minimax
    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        currentBoard[i] = 'O';
        let score = minimax(currentBoard, 0, false);
        currentBoard[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  const handleFinish = async (res) => {
    if (user) {
      try {
        await axios.post('/game/stats', {
          game_name: 'tictactoe',
          result: res, // 'won', 'lost', 'tie'
          time: timer,
          difficulty: difficulty,
          lives_left: res === 'won' ? 1 : 0
        });
      } catch (error) {
        console.error('Error saving stats', error);
      }
    }
  };

  const makeMove = useCallback((idx) => {
    if (board[idx] || winner || isProcessing) return;

    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);
    setIsXNext(false);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'X') handleFinish('won');
      else if (result.winner === 'tie') handleFinish('lost'); // Contamos empate como no victoria
      return;
    }

    setIsProcessing(true);
    // Simular pensamiento de la IA
    setTimeout(() => {
      const aiMove = getBestMove(newBoard, difficulty);
      newBoard[aiMove] = 'O';
      setBoard(newBoard);
      setIsXNext(true);
      setIsProcessing(false);

      const aiResult = checkWinner(newBoard);
      if (aiResult) {
        setWinner(aiResult.winner);
        setWinningLine(aiResult.line);
        if (aiResult.winner === 'O') handleFinish('lost');
        else if (aiResult.winner === 'tie') handleFinish('lost');
      }
    }, 600);
  }, [board, winner, isProcessing, difficulty, user, timer]);

  const startNewGame = (level) => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine([]);
    const startsX = Math.random() > 0.5;
    setIsXNext(startsX);
    setDifficulty(level);
    setShowLevelModal(false);
    setTimer(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Si la IA empieza (O)
    if (!startsX) {
      setIsProcessing(true);
      setTimeout(() => {
        const aiMove = getBestMove(Array(9).fill(null), level);
        const newBoard = Array(9).fill(null);
        newBoard[aiMove] = 'O';
        setBoard(newBoard);
        setIsXNext(true);
        setIsProcessing(false);
      }, 800);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 py-12">
      {/* Modal de Nivel */}
      {(showLevelModal || winner) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 text-center animate-in zoom-in-95 duration-300">
            {showLevelModal ? (
              <>
                <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-rounded text-sky-500 text-5xl">smart_toy</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight uppercase">3 EN RAYA</h2>
                <div className="grid gap-3">
                  {[
                    { id: 'easy', label: 'Fácil', desc: 'La IA juega al azar', color: 'bg-emerald-500' },
                    { id: 'medium', label: 'Medio', desc: 'A veces comete errores', color: 'bg-orange-500' },
                    { id: 'impossible', label: 'Imposible', desc: 'No puedes ganar', color: 'bg-red-500' }
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => startNewGame(level.id)}
                      className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className={`${level.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/10`}>
                          <span className="material-symbols-rounded text-2xl">hardware</span>
                        </div>
                        <div>
                          <span className="block font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-sm">{level.label}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{level.desc}</span>
                        </div>
                      </div>
                      <span className="material-symbols-rounded text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                  ))}
                </div>
                <button onClick={onBack} className="mt-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-black uppercase tracking-[0.2em]">Volver al inicio</button>
              </>
            ) : (
              <>
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 ${winner === 'X' ? 'bg-emerald-500/10' : winner === 'tie' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                  <span className={`material-symbols-rounded text-5xl ${winner === 'X' ? 'text-emerald-500' : winner === 'tie' ? 'text-amber-500' : 'text-red-500'}`}>
                    {winner === 'X' ? 'workspace_premium' : winner === 'tie' ? 'equalizer' : 'heart_broken'}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">
                  {winner === 'X' ? '¡VICTORIA!' : winner === 'tie' ? '¡EMPATE!' : '¡DERROTA!'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                  {winner === 'X' ? 'Has vencido a la IA en este nivel.' : winner === 'tie' ? 'Nadie ha ganado esta vez.' : 'La IA ha sido más astuta.'}
                </p>
                <div className="grid gap-4">
                  <button onClick={() => setShowLevelModal(true)} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-sky-500/30">JUGAR OTRA VEZ</button>
                  <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">VOLVER AL INICIO</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="group flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-white transition-all font-bold">
          <span className="material-symbols-rounded group-hover:-translate-x-1 transition-transform text-2xl">arrow_back</span>
          <span>SALIR</span>
        </button>
        
        <div className="flex items-center gap-6 bg-slate-100 dark:bg-slate-800/50 px-8 py-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-white/10">
            <span className={`material-symbols-rounded ${isXNext ? 'text-sky-500 animate-pulse' : 'text-slate-400'}`}>person</span>
            <span className={`font-black text-lg ${isXNext ? 'text-sky-500' : 'text-slate-400'}`}>TÚ</span>
          </div>
          <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-white/10">
            <span className={`material-symbols-rounded ${!isXNext ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>smart_toy</span>
            <span className={`font-black text-lg ${!isXNext ? 'text-red-500' : 'text-slate-400'}`}>IA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded text-slate-400">timer</span>
            <span className="font-black text-lg text-slate-700 dark:text-slate-200 tabular-nums">{formatTime(timer)}</span>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Dificultad</span>
          <span className="text-sm font-black text-sky-500 uppercase tracking-widest">{difficulty || '---'}</span>
        </div>
      </div>

      {/* Tablero */}
      <div className="flex justify-center items-center">
        <div className="grid grid-cols-3 gap-4 bg-slate-200 dark:bg-slate-800 p-4 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {board.map((square, i) => {
            const isWinningSquare = winningLine.includes(i);
            return (
              <button
                key={i}
                onClick={() => makeMove(i)}
                disabled={square !== null || winner !== null || isProcessing}
                className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center text-5xl md:text-6xl font-black transition-all duration-300
                  ${!square && !winner ? 'bg-white dark:bg-slate-900 hover:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-lg' : ''}
                  ${square === 'X' ? 'bg-white dark:bg-slate-900 text-sky-500 shadow-xl' : ''}
                  ${square === 'O' ? 'bg-white dark:bg-slate-900 text-red-500 shadow-xl' : ''}
                  ${isWinningSquare ? 'bg-sky-500 dark:bg-sky-500 text-white scale-105 z-10 animate__animated animate__pulse animate__infinite' : ''}
                  ${winner && !isWinningSquare ? 'opacity-40 grayscale' : ''}
                `}
              >
                {square === 'X' ? (
                  <span className="material-symbols-rounded text-6xl fill-1">close</span>
                ) : square === 'O' ? (
                  <span className="material-symbols-rounded text-6xl">circle</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-slate-400 dark:text-slate-600 text-xs font-black uppercase tracking-[0.3em]">
          Duelo táctico contra la inteligencia artificial
        </p>
      </div>
    </div>
  );
};

export default TicTacToe;

