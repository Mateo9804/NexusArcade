import React from 'react';

const Hero = () => {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      {/* Glow elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 dark:bg-indigo-600/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="container mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-4 py-2 rounded-full mb-8">
          <span className="material-symbols-rounded text-sky-500 dark:text-sky-400 text-sm">rocket_launch</span>
          <span className="text-sky-500 dark:text-sky-400 text-xs font-black uppercase tracking-widest">Nueva Generación de Juegos</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-none">
          NEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500 dark:from-sky-400 dark:to-indigo-400">ARCADE LIVE</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
          La mejor colección de juegos rápidos, adictivos y gratuitos. 
          Desafía tu mente con el Sudoku o explora nuestras próximas novedades.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a href="#juegos" className="group w-full sm:w-auto bg-sky-500 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-sky-600 dark:hover:bg-sky-400 transition-all shadow-2xl shadow-sky-500/30 flex items-center justify-center gap-3">
            EXPLORAR JUEGOS
            <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
          <button className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3 shadow-xl shadow-black/5">
            <span className="material-symbols-rounded">leaderboard</span>
            RANKINGS
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
