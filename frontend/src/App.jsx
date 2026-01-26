import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import GameCard from './components/GameCard';
import Footer from './components/Footer';
import Sudoku from './components/Sudoku';
import TicTacToe from './components/TicTacToe';
import Stats from './components/Stats';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'sudoku', 'stats', 'tictactoe'

  const navigateTo = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    if (currentView === 'sudoku') {
      return <Sudoku onBack={() => navigateTo('home')} />;
    }

    if (currentView === 'tictactoe') {
      return <TicTacToe onBack={() => navigateTo('home')} />;
    }

    if (currentView === 'stats') {
      return <Stats onBack={() => navigateTo('home')} />;
    }

    return (
      <>
        <Hero />
        
        {/* Games Grid Section */}
        <section id="juegos" className="py-32 bg-slate-50 dark:bg-slate-900/20">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
              <div className="max-w-xl">
                <div className="inline-block px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full mb-6">
                  <span className="text-sky-500 dark:text-sky-400 text-[10px] font-black uppercase tracking-[0.2em]">Biblioteca</span>
                </div>
                <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">NUESTRA COLECCIÓN</h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed">
                  Juegos seleccionados a mano para garantizar la mejor experiencia. 
                  Sin anuncios invasivos, solo pura diversión técnica.
                </p>
              </div>
              <div className="hidden md:block h-px flex-grow mx-16 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
            </div>
            
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                      <GameCard 
                        title="SUDOKU"
                        description="El clásico desafío matemático llevado al siguiente nivel con generación infinita, 4 dificultades y una interfaz técnica diseñada para expertos."
                        category="Lógica"
                        image="/imagenes/sudoku/sudoku portada.webp"
                        onPlay={() => navigateTo('sudoku')}
                      />

                      <GameCard 
                        title="3 EN RAYA"
                        description="Duelo táctico contra nuestra IA. ¿Podrás vencer al nivel imposible? Un desafío de estrategia pura en una interfaz minimalista."
                        category="Estrategia"
                        image="/imagenes/3 en raya/3enrayalogo.webp"
                        onPlay={() => navigateTo('tictactoe')}
                      />
                      
                      <GameCard comingSoon />
                      <GameCard comingSoon />
                    </div>
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-200 selection:bg-sky-500/30 flex flex-col">
      <Header onViewStats={() => navigateTo('stats')} onGoHome={() => navigateTo('home')} />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
