import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ACHIEVEMENTS_DATA = {
  sudoku: [
    { id: 's1', title: 'Mente Brillante', desc: 'Resuelve un Sudoku en nivel Fácil.', icon: 'lightbulb', difficulty: 'easy' },
    { id: 's2', title: 'Maestro de Números', desc: 'Resuelve un Sudoku en nivel Experto.', icon: 'military_tech', difficulty: 'hard' },
    { id: 's3', title: 'Velocista', desc: 'Resuelve cualquier Sudoku en menos de 3 minutos.', icon: 'timer', difficulty: 'medium' },
    { id: 's4', title: 'Perfeccionista', desc: 'Resuelve un Sudoku sin cometer errores.', icon: 'check_circle', difficulty: 'hard' },
    { id: 's5', title: 'Calentamiento', desc: 'Resuelve 5 Sudokus en total.', icon: 'fitness_center', difficulty: 'easy' },
    { id: 's6', title: 'Lógica Pura', desc: 'Resuelve uno en nivel Medio sin usar pistas.', icon: 'psychology_alt', difficulty: 'medium' },
    { id: 's7', title: 'Ojo de Águila', desc: 'Completa todos los números de un tipo seguidos.', icon: 'visibility', difficulty: 'medium' },
    { id: 's8', title: 'Maratón', desc: 'Pasa más de 1 hora jugando Sudoku.', icon: 'history', difficulty: 'hard' },
    { id: 's9', title: 'Samurái', desc: 'Resuelve un Sudoku Difícil en menos de 10 min.', icon: 'self_improvement', difficulty: 'hard' }
  ],
  tictactoe: [
    { id: 't1', title: 'Primer Paso', desc: 'Gana tu primera partida de 3 en Raya.', icon: 'star', difficulty: 'easy' },
    { id: 't2', title: 'Invencible', desc: 'Gana a la IA en nivel Imposible.', icon: 'security', difficulty: 'hard' },
    { id: 't3', title: 'Estratega', desc: 'Gana 5 partidas seguidas.', icon: 'reorder', difficulty: 'medium' },
    { id: 't4', title: 'Empate Técnico', desc: 'Consigue 5 empates seguidos.', icon: 'balance', difficulty: 'easy' },
    { id: 't5', title: 'Bloqueador', desc: 'Bloquea a la IA 10 veces en una partida.', icon: 'block', difficulty: 'medium' },
    { id: 't6', title: 'Rápido y Furioso', desc: 'Gana en menos de 5 segundos.', icon: 'bolt', difficulty: 'medium' },
    { id: 't7', title: 'Triple Amenaza', desc: 'Gana por una línea diagonal.', icon: 'architecture', difficulty: 'medium' },
    { id: 't8', title: 'Maestro del Centro', desc: 'Gana ocupando siempre la casilla central.', icon: 'adjust', difficulty: 'hard' }
  ],
  chess: [
    { id: 'c1', title: 'Jaque Mate', desc: 'Gana tu primera partida de Ajedrez.', icon: 'castle', difficulty: 'easy' },
    { id: 'c2', title: 'Gambito de Dama', desc: 'Gana a la IA en nivel Avanzado.', icon: 'workspace_premium', difficulty: 'hard' },
    { id: 'c3', title: 'Gran Maestro', desc: 'Gana una partida en menos de 20 movimientos.', icon: 'psychology', difficulty: 'hard' },
    { id: 'c4', title: 'Primer Peón', desc: 'Captura tu primera pieza enemiga.', icon: 'swords', difficulty: 'easy' },
    { id: 'c5', title: 'Castillo de Hierro', desc: 'Realiza un enroque en 5 partidas distintas.', icon: 'fort', difficulty: 'medium' },
    { id: 'c6', title: 'Sacrificio Real', desc: 'Gana después de perder a tu Reina.', icon: 'heart_broken', difficulty: 'hard' },
    { id: 'c7', title: 'Promoción', desc: 'Lleva un peón hasta el final del tablero.', icon: 'upgrade', difficulty: 'medium' },
    { id: 'c8', title: 'Muro de Berlín', desc: 'Empata una partida por tablas contra la IA.', icon: 'shield', difficulty: 'medium' },
    { id: 'c9', title: 'Rey de la Pista', desc: 'Gana 3 partidas consecutivas.', icon: 'emoji_events', difficulty: 'hard' }
  ],
  tetris: [
    { id: 'te1', title: 'Arquitecto', desc: 'Consigue 5,000 puntos en una partida.', icon: 'architecture', difficulty: 'easy' },
    { id: 'te2', title: 'Rey del Bloque', desc: 'Consigue 20,000 puntos.', icon: 'grid_view', difficulty: 'medium' },
    { id: 'te3', title: 'Tetris God', desc: 'Llega a los 50,000 puntos.', icon: 'diamond', difficulty: 'hard' },
    { id: 'te4', title: 'Línea Base', desc: 'Elimina tu primera línea.', icon: 'remove', difficulty: 'easy' },
    { id: 'te5', title: 'Doble Problema', desc: 'Elimina 2 líneas a la vez.', icon: 'reorder', difficulty: 'easy' },
    { id: 'te6', title: 'TETRIS!', desc: 'Elimina 4 líneas de un solo golpe.', icon: 'flash_on', difficulty: 'medium' },
    { id: 'te7', title: 'Limpieza Total', desc: 'Deja el tablero completamente vacío.', icon: 'auto_fix_high', difficulty: 'hard' },
    { id: 'te8', title: 'Sobreviviente', desc: 'Juega más de 5 minutos en una partida.', icon: 'timer', difficulty: 'medium' },
    { id: 'te9', title: 'A toda máquina', desc: 'Alcanza el nivel 10.', icon: 'speed', difficulty: 'hard' }
  ],
  minesweeper: [
    { id: 'm1', title: 'Campo Seguro', desc: 'Gana una partida en nivel Fácil.', icon: 'shield', difficulty: 'easy' },
    { id: 'm2', title: 'Desactivador Pro', desc: 'Gana en nivel Difícil.', icon: 'bomb', difficulty: 'hard' },
    { id: 'm3', title: 'Intuición Pura', desc: 'Gana una partida sin usar banderas.', icon: 'visibility', difficulty: 'hard' },
    { id: 'm4', title: 'Primer Clic', desc: 'Despeja tu primera casilla sin explotar.', icon: 'touch_app', difficulty: 'easy' },
    { id: 'm5', title: 'Bandera Roja', desc: 'Coloca 10 banderas correctamente.', icon: 'flag', difficulty: 'easy' },
    { id: 'm6', title: 'Cerca del Peligro', desc: 'Despeja una casilla rodeada por 8 minas.', icon: 'priority_high', difficulty: 'hard' },
    { id: 'm7', title: 'Experto en Explosivos', desc: 'Gana en menos de 1 minuto.', icon: 'timer', difficulty: 'medium' },
    { id: 'm8', title: 'Campo de Flores', desc: 'Gana 5 partidas seguidas en nivel Medio.', icon: 'local_florist', difficulty: 'hard' }
  ],
  conecta4: [
    { id: 'co1', title: 'Cuatro en Línea', desc: 'Gana tu primera partida.', icon: 'linear_scale', difficulty: 'easy' },
    { id: 'co2', title: 'Muro de Acero', desc: 'Bloquea un 3 en línea de la IA y gana.', icon: 'block', difficulty: 'medium' },
    { id: 'co3', title: 'Dominación', desc: 'Gana a la IA en nivel Experto.', icon: 'military_tech', difficulty: 'hard' },
    { id: 'co4', title: 'Diagonal Ganadora', desc: 'Gana con una línea diagonal.', icon: 'architecture', difficulty: 'medium' },
    { id: 'co5', title: 'Victoria Veloz', desc: 'Gana en menos de 10 movimientos.', icon: 'bolt', difficulty: 'hard' },
    { id: 'co6', title: 'Estratega Central', desc: 'Ocupa 4 casillas de la columna central.', icon: 'vertical_align_center', difficulty: 'medium' },
    { id: 'co7', title: 'Doble Amenaza', desc: 'Crea una situación con dos formas de ganar.', icon: 'call_split', difficulty: 'hard' },
    { id: 'co8', title: 'Persistencia', desc: 'Juega 20 partidas en total.', icon: 'history', difficulty: 'medium' }
  ],
  blackjack: [
    { id: 'b1', title: 'Suerte de Principiante', desc: 'Gana tu primera mano.', icon: 'playing_cards', difficulty: 'easy' },
    { id: 'b2', title: 'Blackjack!', desc: 'Consigue un Blackjack natural.', icon: 'style', difficulty: 'medium' },
    { id: 'b3', title: 'High Roller', desc: 'Gana 5 manos consecutivas contra la casa.', icon: 'payments', difficulty: 'hard' },
    { id: 'b4', title: 'Casi 21', desc: 'Quédate en 20 y gana la mano.', icon: 'done', difficulty: 'easy' },
    { id: 'b5', title: 'Al Límite', desc: 'Pide carta con 20 y saca un As.', icon: 'priority_high', difficulty: 'hard' },
    { id: 'b6', title: 'Doble o Nada', desc: 'Dobla la apuesta y gana la mano.', icon: 'exposure_plus_2', difficulty: 'medium' },
    { id: 'b7', title: 'La Casa no Gana', desc: 'Gana con 5 cartas sin pasarte de 21.', icon: 'gavel', difficulty: 'hard' },
    { id: 'b8', title: 'Racha de Suerte', desc: 'Consigue 2 Blackjacks seguidos.', icon: 'auto_awesome', difficulty: 'hard' }
  ],
  solitaire: [
    { id: 'so1', title: 'Paciencia', desc: 'Gana tu primera partida de Solitario.', icon: 'hourglass_empty', difficulty: 'easy' },
    { id: 'so2', title: 'Orden Perfecto', desc: 'Termina una partida en menos de 5 minutos.', icon: 'schedule', difficulty: 'medium' },
    { id: 'so3', title: 'As de Picas', desc: 'Gana 3 partidas en un solo día.', icon: 'reorder', difficulty: 'hard' },
    { id: 'so4', title: 'Rey de Copas', desc: 'Mueve un Rey a un espacio vacío.', icon: 'king_bed', difficulty: 'easy' },
    { id: 'so5', title: 'Escalera Real', desc: 'Completa una columna del K al A.', icon: 'stairs', difficulty: 'medium' },
    { id: 'so6', title: 'Mazo Vacío', desc: 'Agota todas las cartas del mazo de reserva.', icon: 'layers_clear', difficulty: 'medium' },
    { id: 'so7', title: 'Coleccionista', desc: 'Completa las 4 fundaciones.', icon: 'collections', difficulty: 'hard' },
    { id: 'so8', title: 'Rápido como el Viento', desc: 'Gana en menos de 3 minutos.', icon: 'bolt', difficulty: 'hard' }
  ]
};

const Achievements = ({ onBack }) => {
  const [gameName, setGameName] = useState('sudoku');
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAchievements();
  }, [gameName]);

  const fetchUserAchievements = async () => {
    setLoading(true);
    try {
      // Nota: En un entorno real, esto vendría del backend
      // Simulamos logros completados basados en las estadísticas del usuario
      const response = await axios.get(`/game/stats/${gameName}`);
      const stats = response.data;
      
      const completed = [];
      const gameAchievements = ACHIEVEMENTS_DATA[gameName] || [];

      // Lógica de simulación expandida
      if (stats.games_played > 0) completed.push(gameAchievements[0]?.id);
      if (stats.games_won > 0) completed.push(gameAchievements[3]?.id); // Captura primera pieza/Primer clic/etc
      if (stats.games_won > 2) completed.push(gameAchievements[1]?.id);
      if (stats.best_time < 300 && stats.best_time > 0) completed.push(gameAchievements[2]?.id);
      if (stats.games_won > 5) completed.push(gameAchievements[4]?.id);
      if (stats.games_won > 10) completed.push(gameAchievements[5]?.id);
      if (stats.best_moves > 5000) completed.push(gameAchievements[6]?.id); // Para Tetris puntos

      setUserAchievements(completed.filter(Boolean));
    } catch (error) {
      console.error('Error fetching achievements', error);
    } finally {
      setLoading(false);
    }
  };

  const games = [
    { id: 'sudoku', label: 'Sudoku' },
    { id: 'tictactoe', label: '3 en Raya' },
    { id: 'solitaire', label: 'Solitario' },
    { id: 'blackjack', label: 'Blackjack' },
    { id: 'minesweeper', label: 'Buscaminas' },
    { id: 'chess', label: 'Ajedrez' },
    { id: 'tetris', label: 'Tetris' },
    { id: 'conecta4', label: 'Conecta 4' }
  ];

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
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Logros</h1>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">Filtrar por Juego</span>
          <div className="relative group min-w-[240px]">
            <select
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white appearance-none cursor-pointer focus:outline-none focus:border-sky-500 transition-all shadow-xl shadow-black/5"
            >
              {games.map((game) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode='wait'>
            {(ACHIEVEMENTS_DATA[gameName] || []).map((achievement, idx) => {
              const isCompleted = userAchievements.includes(achievement.id);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden p-8 rounded-[2.5rem] border transition-all duration-500 ${
                    isCompleted 
                    ? 'bg-white dark:bg-slate-900 border-sky-500/30 shadow-2xl shadow-sky-500/10' 
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 grayscale opacity-60'
                  }`}
                >
                  {isCompleted && (
                    <div className="absolute top-0 right-0 p-4">
                      <div className="bg-sky-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-500/30">
                        Completado
                      </div>
                    </div>
                  )}

                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                    isCompleted ? 'bg-sky-500 shadow-xl shadow-sky-500/40' : 'bg-slate-200 dark:bg-slate-800'
                  }`}>
                    <span className={`material-symbols-rounded text-3xl ${isCompleted ? 'text-white' : 'text-slate-400'}`}>
                      {achievement.icon}
                    </span>
                  </div>

                  <h3 className={`text-xl font-black mb-2 uppercase tracking-tight ${
                    isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}>
                    {achievement.title}
                  </h3>
                  
                  <p className={`text-sm font-medium leading-relaxed ${
                    isCompleted ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500'
                  }`}>
                    {achievement.desc}
                  </p>

                  <div className="mt-6 flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      achievement.difficulty === 'hard' ? 'text-rose-500' : 
                      achievement.difficulty === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      Dificultad: {achievement.difficulty}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Achievements;
