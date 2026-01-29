import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Stats = ({ onBack }) => {
  const [gameName, setGameName] = useState('sudoku');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [gameName, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`/game/stats/${gameName}`),
        axios.get(`/game/history/${gameName}?page=${currentPage}`)
      ]);
      setStats(statsRes.data);
      setHistory(historyRes.data.data);
      setTotalPage(historyRes.data.last_page);
    } catch (error) {
      console.error('Error fetching stats data', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
        <div>
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-white transition-all font-bold mb-6"
          >
            <span className="material-symbols-rounded group-hover:-translate-x-1 transition-transform">arrow_back</span>
            VOLVER AL INICIO
          </button>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Estadísticas</h1>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">Elegir Juego</span>
          <div className="relative group min-w-[240px]">
            <select
              value={gameName}
              onChange={(e) => { setGameName(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white appearance-none cursor-pointer focus:outline-none focus:border-sky-500 transition-all shadow-xl shadow-black/5"
            >
              {[
                { id: 'sudoku', label: 'Sudoku' },
                { id: 'tictactoe', label: '3 en Raya' },
                { id: 'solitaire', label: 'Solitario' },
                { id: 'blackjack', label: 'Blackjack' },
                { id: 'minesweeper', label: 'Buscaminas' },
                { id: 'chess', label: 'Ajedrez' },
                { id: 'tetris', label: 'Tetris' },
                { id: 'conecta4', label: 'Conecta 4' }
              ].map((game) => (
                <option key={game.id} value={game.id} className="bg-white dark:bg-slate-900">
                  {game.label}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-sky-500">
              <span className="material-symbols-rounded">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          
          {/* General Stats Card */}
          <div className="xl:col-span-4 space-y-8">
            <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-black/5">
              <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-rounded text-sky-500 text-4xl">analytics</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight uppercase">Resumen General</h2>
              
              {stats ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl text-center">
                      <span className="block text-4xl font-black text-slate-900 dark:text-white mb-1">{stats.games_played}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partidas</span>
                    </div>
                    <div className="bg-emerald-500/5 p-6 rounded-3xl text-center">
                      <span className="block text-4xl font-black text-emerald-500 mb-1">{stats.games_won}</span>
                      <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Victorias</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                        {gameName === 'tetris' ? 'Mejor Puntaje' : 'Mejor Tiempo'}
                      </span>
                      <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                        {gameName === 'tetris' ? stats.best_moves : formatTime(stats.best_time)}
                      </span>
                    </div>
                    {(gameName === 'solitaire' || gameName === 'chess' || gameName === 'conecta4') && (
                      <div className="flex justify-between items-center px-2">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Mejor Movimientos</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{stats.best_moves || '--'}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center px-2">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tiempo Total</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{formatTime(stats.total_time)}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">% de Éxito</span>
                        <span className="text-3xl font-black text-sky-500 italic">
                          {stats.games_played > 0 ? Math.round((stats.games_won / stats.games_played) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 font-bold italic">No hay datos aún.</p>
              )}
            </div>
          </div>

          {/* History Table */}
          <div className="xl:col-span-8 space-y-8">
            <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-black/5">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-10 tracking-tight uppercase flex items-center gap-4">
                <span className="material-symbols-rounded text-slate-400">history</span>
                Historial de Partidas
              </h2>

              <div className="overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Partida</th>
                      <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Dificultad</th>
                      <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Resultado</th>
                      <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 text-right">Tiempo</th>
                      <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 text-right">
                        {gameName === 'tetris' ? 'Puntos' : 
                         (gameName === 'solitaire' || gameName === 'chess' || gameName === 'conecta4') ? 'Movimientos' : 
                         'Vidas'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {history.length > 0 ? history.map((item, index) => (
                      <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-6 px-4">
                          <span className="font-black text-slate-400 group-hover:text-sky-500 transition-colors">
                            #{(currentPage - 1) * 5 + index + 1}
                          </span>
                        </td>
                        <td className="py-6 px-4">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {item.difficulty}
                          </span>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.result === 'won' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                            <span className={`text-sm font-black uppercase tracking-wider ${item.result === 'won' ? 'text-emerald-500' : 'text-red-500'}`}>
                              {item.result === 'won' ? 'Ganada' : 'Perdida'}
                            </span>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-right font-black text-slate-700 dark:text-slate-200 tabular-nums">
                          {formatTime(item.time)}
                        </td>
                        <td className="py-6 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 text-slate-500 dark:text-slate-400">
                            <span className="font-black text-sm">
                              {(gameName === 'solitaire' || gameName === 'chess' || gameName === 'conecta4' || gameName === 'tetris') ? item.moves : item.lives_left}
                            </span>
                            <span className="material-symbols-rounded text-sm fill-current text-red-500">
                              {(gameName === 'solitaire' || gameName === 'chess' || gameName === 'conecta4' || gameName === 'tetris') ? 'trending_up' : 'favorite'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="py-20 text-center text-slate-500 font-bold italic">No has jugado ninguna partida todavía.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 mt-12 pt-8 border-t border-slate-100 dark:border-white/5">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-500 transition-all disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200"
                  >
                    <span className="material-symbols-rounded">chevron_left</span>
                  </button>
                  <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                    Página <span className="text-slate-900 dark:text-white">{currentPage}</span> de {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-500 transition-all disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200"
                  >
                    <span className="material-symbols-rounded">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Stats;

