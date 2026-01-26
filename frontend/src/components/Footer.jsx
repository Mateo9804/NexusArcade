import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-50 dark:bg-[#020617] border-t border-slate-200 dark:border-white/5 py-20 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img src="/imagenes/logodenexusarcade.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">NexusArcade</span>
            </div>
            <p className="text-slate-500 dark:text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
              Elevando la experiencia de los juegos de navegador con diseño premium y diversión instantánea.
            </p>
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
            &copy; 2026 Nexus Arcade. Todos los derechos reservados.
          </p>
          <a 
            href="https://github.com/Mateo9804" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/5 group-hover:border-sky-500/50 transition-all shadow-lg shadow-black/5 dark:shadow-white/2">
              <img 
                src="/imagenes/footer/github.png" 
                alt="GitHub" 
                className="w-9 h-9 object-contain opacity-70 group-hover:opacity-100 dark:invert transition-all"
              />
            </div>
            <span className="text-base font-black text-slate-500 dark:text-slate-400 group-hover:text-sky-500 transition-colors uppercase tracking-[0.15em]">
              Mateo9804
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
