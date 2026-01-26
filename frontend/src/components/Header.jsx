import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const Header = ({ onViewStats, onGoHome }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState('login');

  const openLogin = () => {
    setAuthView('login');
    setIsAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthView('register');
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div onClick={onGoHome} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-rounded text-white text-2xl">bolt</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              NEXUS<span className="text-sky-400">ARCADE</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={onGoHome} className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-white transition-colors tracking-wide uppercase">Inicio</button>
            <a href="#juegos" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-white transition-colors tracking-wide uppercase">Juegos</a>
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-[background-color,color] duration-150"
            >
              <span className="material-symbols-rounded">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {user ? (
              <div className="flex items-center gap-6">
                <button 
                  onClick={onViewStats}
                  className="flex items-center gap-2 text-slate-500 hover:text-sky-500 transition-colors"
                  title="Estadísticas"
                >
                  <span className="material-symbols-rounded">analytics</span>
                  <span className="text-xs font-black uppercase tracking-widest hidden lg:inline">Stats</span>
                </button>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                    {user.name}
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Cerrar Sesión"
                >
                  <span className="material-symbols-rounded">logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={openRegister}
                  className="text-sm font-black text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-white transition-colors uppercase tracking-widest"
                >
                  Registro
                </button>
                <button 
                  onClick={openLogin}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-2.5 rounded-full text-sm font-black transition-all hover:bg-sky-500 dark:hover:bg-sky-400 hover:text-white shadow-xl shadow-black/5 dark:shadow-white/5 uppercase tracking-widest"
                >
                  Iniciar Sesión
                </button>
              </div>
            )}
          </nav>

          <button className="md:hidden text-slate-900 dark:text-white">
            <span className="material-symbols-rounded">menu</span>
          </button>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={authView}
      />
    </>
  );
};

export default Header;
