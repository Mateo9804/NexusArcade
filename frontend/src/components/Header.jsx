import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const Header = ({ onViewStats, onGoHome }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authView, setAuthView] = useState('login');

  const openLogin = () => {
    setAuthView('login');
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleGoHome = () => {
    onGoHome();
    setIsMenuOpen(false);
  };

  const handleViewStats = () => {
    onViewStats();
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div onClick={handleGoHome} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <img src="/imagenes/logodenexusarcade.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              NEXUS<span className="text-sky-400">ARCADE</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={handleGoHome} className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-white transition-colors tracking-wide uppercase">Inicio</button>
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
                  onClick={handleViewStats}
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
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Cerrar Sesión"
                >
                  <span className="material-symbols-rounded">logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={openLogin}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-2.5 rounded-full text-sm font-black transition-all hover:bg-sky-500 dark:hover:bg-sky-400 hover:text-white shadow-xl shadow-black/5 dark:shadow-white/5 uppercase tracking-widest"
                >
                  Iniciar Sesión
                </button>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            {/* Theme Toggle Button (Mobile) */}
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
            >
              <span className="material-symbols-rounded">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-900 dark:text-white w-10 h-10 flex items-center justify-center"
            >
              <span className="material-symbols-rounded text-3xl">
                {isMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[400px] border-b border-slate-200 dark:border-white/5' : 'max-h-0'}`}>
          <div className="px-6 py-6 space-y-4 bg-white dark:bg-[#020617] flex flex-col">
            <button onClick={handleGoHome} className="text-left py-2 text-lg font-bold text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-white transition-colors tracking-wide uppercase">Inicio</button>
            <a href="#juegos" onClick={() => setIsMenuOpen(false)} className="py-2 text-lg font-bold text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-white transition-colors tracking-wide uppercase">Juegos</a>
            
            {user ? (
              <>
                <button onClick={handleViewStats} className="text-left py-2 flex items-center gap-3 text-lg font-bold text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-white transition-colors tracking-wide uppercase">
                  <span className="material-symbols-rounded">analytics</span>
                  Estadísticas
                </button>
                <div className="py-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-200 uppercase">
                    {user.name}
                  </span>
                </div>
                <button onClick={handleLogout} className="text-left py-2 flex items-center gap-3 text-lg font-bold text-red-500 hover:text-red-600 transition-colors tracking-wide uppercase">
                  <span className="material-symbols-rounded">logout</span>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <button 
                onClick={openLogin}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-4 rounded-2xl text-base font-black transition-all hover:bg-sky-500 dark:hover:bg-sky-400 hover:text-white uppercase tracking-widest mt-4"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
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
