import React from 'react';

const GameCard = ({ title, description, category, image, comingSoon, onPlay }) => {
  if (comingSoon) {
    return (
      <div className="group relative bg-slate-100 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800/50 border-dashed flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-700 transition-all hover:border-sky-400 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900/60 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-800/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800/30 mb-6 flex items-center justify-center border border-white/5 shadow-inner">
          <span className="material-symbols-rounded text-4xl">add</span>
        </div>
        <span className="font-black uppercase tracking-[0.2em] text-sm">Próximamente</span>
      </div>
    );
  }

  return (
    <div className="group relative bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-sky-500/30 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1),0_0_40px_-10px_rgba(56,189,248,0.1)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5),0_0_40px_-10px_rgba(56,189,248,0.2)]">
      <div className="aspect-[4/3] bg-slate-100 dark:bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <span className="material-symbols-rounded text-8xl text-sky-400 opacity-20 group-hover:opacity-60 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
            videogame_asset
          </span>
        )}
        <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
      </div>
      
      <div className="p-10 -mt-8 relative z-10 bg-gradient-to-b from-transparent via-white/90 dark:via-slate-900/90 to-white dark:to-slate-900 rounded-b-[2.5rem]">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{title}</h3>
          <span className="bg-sky-500/10 text-sky-500 dark:text-sky-400 text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full border border-sky-500/20">
            {category}
          </span>
        </div>
        
        {/* Description fixed to max 3 lines with full visibility */}
        <p className="text-slate-600 dark:text-slate-400 mb-10 text-sm font-medium leading-relaxed h-[4.2rem] line-clamp-3 overflow-hidden">
          {description}
        </p>
        
        <button 
          onClick={onPlay}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-sky-500 dark:hover:bg-sky-400 hover:text-white dark:hover:text-white py-5 rounded-2xl font-black transition-[background-color,transform,shadow] duration-200 shadow-xl shadow-black/10 dark:shadow-black/20 group-hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="material-symbols-rounded fill-current transition-none">play_arrow</span>
          <span className="transition-none">JUGAR AHORA</span>
        </button>
      </div>
    </div>
  );
};

export default GameCard;
