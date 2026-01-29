import React, { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Forzar jQuery globalmente y añadir polyfills para compatibilidad con plugins antiguos (como Blockrain)
window.$ = window.jQuery = $;

// Polyfills para jQuery 4.0+
if (!$.isFunction) {
  $.isFunction = (obj) => typeof obj === 'function';
}
if (!$.isArray) {
  $.isArray = Array.isArray;
}
if (!$.isNumeric) {
  $.isNumeric = (obj) => !isNaN(parseFloat(obj)) && isFinite(obj);
}
if (!$.isWindow) {
  $.isWindow = (obj) => obj != null && obj === obj.window;
}
if (!$.type) {
  $.type = (obj) => Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

const TetrisBlockrain = ({ onBack }) => {
  const { user } = useAuth();
  const gameRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let scriptElement = null;
    let linkElement = null;
    let checkInterval = null;

    const loadGame = () => {
      try {
        // 1. Cargar CSS local
        linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = '/libs/blockrain.css';
        document.head.appendChild(linkElement);

        // 2. Cargar Script local
        scriptElement = document.createElement('script');
        scriptElement.src = '/libs/blockrain.js';
        scriptElement.async = true;
        
        scriptElement.onload = () => {
          // 3. Verificar que el plugin se registre
          checkInterval = setInterval(() => {
            if (typeof $.fn.blockrain === 'function') {
              clearInterval(checkInterval);
              if (gameRef.current) {
                try {
                  $(gameRef.current).blockrain({
                    theme: 'candy',
                    blockWidth: 10,
                    autoBlockWidth: true,
                    autoBlockSize: 24,
                    onGameOver: (finalScore) => {
                      setScore(finalScore);
                      setGameOver(true);
                      saveStats(finalScore);
                    }
                  });
                  setIsLoaded(true);
                } catch (e) {
                  console.error("Error al iniciar el plugin blockrain:", e);
                  setError(true);
                }
              }
            }
          }, 100);
        };

        scriptElement.onerror = () => {
          console.error("Error cargando el script local de Blockrain");
          setError(true);
        };

        document.body.appendChild(scriptElement);
      } catch (e) {
        console.error("Error al inicializar Blockrain:", e);
        setError(true);
      }
    };

    loadGame();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (linkElement && document.head.contains(linkElement)) document.head.removeChild(linkElement);
      if (scriptElement && document.body.contains(scriptElement)) document.body.removeChild(scriptElement);
      
      if (gameRef.current && typeof $.fn.blockrain === 'function') {
        try {
          $(gameRef.current).blockrain('destroy');
        } catch (e) {}
      }
    };
  }, []);

  const saveStats = async (finalScore) => {
    if (user) {
      try {
        await axios.post('/game/stats', {
          game_name: 'tetris',
          result: 'lost',
          time: 0,
          moves: finalScore,
          difficulty: 'normal'
        });
      } catch (e) {}
    }
  };

  const changeTheme = (t) => {
    if (isLoaded && gameRef.current && typeof $.fn.blockrain === 'function') {
      $(gameRef.current).blockrain('theme', t);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 py-12 flex flex-col items-center">
      <AnimatePresence>
        {gameOver && (
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
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase">GAME OVER</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Puntaje: {score}</p>
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
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Tetris</span>
            <span className="text-xl font-black text-slate-700 dark:text-white uppercase">Blockrain</span>
          </div>
        </div>
      </div>

      <div className="relative p-2 bg-slate-900 rounded-[2.5rem] shadow-2xl border-8 border-slate-800 w-full max-w-[450px] overflow-hidden">
        {(!isLoaded || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10 backdrop-blur-sm">
            {error ? (
              <>
                <span className="material-symbols-rounded text-rose-500 text-5xl mb-4">error</span>
                <p className="text-rose-500 font-black text-xs uppercase tracking-widest text-center px-6">
                  Error de compatibilidad.<br/>Reiniciando sistema...
                </p>
                <button onClick={() => window.location.reload()} className="mt-4 text-white bg-slate-800 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Reintentar</button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sky-500 font-black text-xs uppercase tracking-widest">Sincronizando Arcade...</p>
              </>
            )}
          </div>
        )}
        <div 
          ref={gameRef} 
          className="blockrain-container"
          style={{ width: '100%', height: '550px' }}
        ></div>
      </div>

      <div className={`mt-8 flex gap-4 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {['candy', 'modern', 'retro', 'vim'].map((t) => (
          <button 
            key={t}
            onClick={() => changeTheme(t)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-sky-500 transition-all border border-slate-200 dark:border-white/5 shadow-sm active:scale-95"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] text-center">
        USA LAS FLECHAS PARA MOVER Y ROTAR
      </div>

      <style>{`
        .blockrain-container .blockrain-score-holder {
          display: block !important;
        }
        .blockrain-container .blockrain-game-over {
          display: none !important;
        }
        .blockrain-container .blockrain-start-screen {
          background: rgba(15, 23, 42, 0.95) !important;
        }
        .blockrain-container .blockrain-start-msg {
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.1em;
        }
        .blockrain-container .blockrain-btn {
          border-radius: 1rem !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
        }
      `}</style>
    </div>
  );
};

export default TetrisBlockrain;
