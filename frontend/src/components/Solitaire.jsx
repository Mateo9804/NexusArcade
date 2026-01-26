import React, { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import _ from 'lodash';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// --- Constantes y Utilidades ---

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const isRed = (suit) => suit === 'hearts' || suit === 'diamonds';

const getCardImageUrl = (suit, value) => {
  const suitLetter = suit[0].toUpperCase(); // H, D, C, S
  let valueCode = value;
  if (value === '10') valueCode = '0'; // La API usa '0' para el 10
  return `https://deckofcardsapi.com/static/img/${valueCode}${suitLetter}.png`;
};

// --- Componentes de DnD ---

const DraggableCard = ({ card, isFaceUp, index, sourceInfo, isDragging, style, ...props }) => {
  if (!card) return null;

  const imageUrl = getCardImageUrl(card.suit, card.value);

  return (
    <div 
      className={`relative w-20 h-28 md:w-24 md:h-36 rounded-lg transition-shadow perspective-1000 ${isDragging ? 'opacity-0' : 'opacity-100'}`}
      style={style}
      {...props}
    >
      <div className={`w-full h-full relative transition-all duration-500 preserve-3d ${isFaceUp ? '' : 'rotate-y-180'}`}>
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-lg bg-white border border-slate-200 shadow-sm"
          style={{
            backgroundImage: `url('${imageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-lg bg-gradient-to-br from-indigo-700 to-indigo-900 border-2 border-white/80 shadow-inner flex items-center justify-center">
          <div className="w-12 h-20 md:w-16 md:h-28 border border-white/20 rounded-md flex items-center justify-center overflow-hidden">
            <span className="material-symbols-rounded text-white/30 text-3xl md:text-4xl">bolt</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal ---

const Solitaire = ({ onBack }) => {
  const { user } = useAuth();
  const [tableau, setTableau] = useState([[], [], [], [], [], [], []]);
  const [foundation, setFoundation] = useState([[], [], [], []]);
  const [stock, setStock] = useState([]);
  const [waste, setWaste] = useState([]);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [activeDrag, setActiveDrag] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Verificar si hay una sesión guardada al entrar
  useEffect(() => {
    if (user) {
      checkSavedSession();
    }
  }, [user]);

  const checkSavedSession = async () => {
    try {
      const response = await axios.get('/game/session/solitaire');
      if (response.data) {
        setHasSavedSession(true);
      }
    } catch (error) {
      console.error('Error checking session', error);
    }
  };

  const resumeSession = async () => {
    try {
      const response = await axios.get('/game/session/solitaire');
      if (response.data) {
        const { tableau, foundation, stock, waste, timer, moves } = response.data.game_data;
        setTableau(tableau);
        setFoundation(foundation);
        setStock(stock);
        setWaste(waste);
        setTimer(timer);
        setMoves(moves);
        setWon(false);
        setIsPaused(false);
        setShowLevelModal(false);
        setIsActive(true);
        setHasSavedSession(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error resuming session', error);
    }
  };

  const saveCurrentSession = async () => {
    if (!user || won || !isActive) return;
    try {
      await axios.post('/game/session', {
        game_name: 'solitaire',
        game_data: {
          tableau,
          foundation,
          stock,
          waste,
          timer,
          moves
        }
      });
    } catch (error) {
      console.error('Error saving session', error);
    }
  };

  const initGame = useCallback(async () => {
    if (user && hasSavedSession) {
      try {
        await axios.delete('/game/session/solitaire');
      } catch (e) {}
    }

    let newDeck = [];
    SUITS.forEach(suit => {
      VALUES.forEach(value => {
        newDeck.push({ suit, value, id: `${suit}-${value}`, isFaceUp: false });
      });
    });

    newDeck = _.shuffle(newDeck);

    const newTableau = [[], [], [], [], [], [], []];
    let cardIdx = 0;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = newDeck[cardIdx++];
        if (j === i) card.isFaceUp = true;
        newTableau[i].push(card);
      }
    }

    const newStock = newDeck.slice(cardIdx);
    
    setTableau(newTableau);
    setStock(newStock);
    setWaste([]);
    setFoundation([[], [], [], []]);
    setWon(false);
    setTimer(0);
    setMoves(0);
    setIsActive(true);
    setIsPaused(false);
    setShowLevelModal(false);
    setHasSavedSession(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, hasSavedSession]);

  useEffect(() => {
    let interval;
    if (isActive && !won && !isPaused && !showLevelModal) {
      interval = setInterval(() => {
        setTimer(t => {
          const newTime = t + 1;
          // Guardar sesión cada 30 segundos
          if (newTime > 0 && newTime % 30 === 0 && user) {
            saveCurrentSession();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, won, isPaused, showLevelModal, user, tableau, foundation, stock, waste, moves]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStockClick = () => {
    if (isPaused) return;
    if (stock.length === 0) {
      if (waste.length === 0) return;
      setStock(_.reverse(waste.map(c => ({ ...c, isFaceUp: false }))));
      setWaste([]);
    } else {
      const card = stock[stock.length - 1];
      setStock(stock.slice(0, -1));
      setWaste([...waste, { ...card, isFaceUp: true }]);
    }
    setMoves(m => m + 1);
  };

  const canPlaceOnTableau = (cardToPlace, targetCard) => {
    if (!targetCard) return cardToPlace.value === 'K';
    const differentColor = isRed(cardToPlace.suit) !== isRed(targetCard.suit);
    const lowerValue = VALUES.indexOf(cardToPlace.value) === VALUES.indexOf(targetCard.value) - 1;
    return differentColor && lowerValue;
  };

  const canPlaceOnFoundation = (cardToPlace, foundationSuit, topCard) => {
    if (cardToPlace.suit !== foundationSuit) return false;
    if (!topCard) return cardToPlace.value === 'A';
    return VALUES.indexOf(cardToPlace.value) === VALUES.indexOf(topCard.value) + 1;
  };

  const onDragStart = (event) => {
    if (isPaused) return;
    const { active } = event;
    const { id } = active;
    const [type, sourceIdx, cardIdx] = id.split('-');

    let draggedCards = [];
    let sourceInfo = { type, index: parseInt(sourceIdx), cardIdx: parseInt(cardIdx) };

    if (type === 'tableau') {
      draggedCards = tableau[sourceIdx].slice(parseInt(cardIdx));
    } else if (type === 'waste') {
      draggedCards = [waste[waste.length - 1]];
    } else if (type === 'foundation') {
      draggedCards = [foundation[sourceIdx][foundation[sourceIdx].length - 1]];
    }

    setActiveDrag({ cards: draggedCards, sourceInfo });
  };

  const onDragEnd = (event) => {
    const { over } = event;
    setActiveDrag(null);

    if (!over || !activeDrag || isPaused) return;

    const [targetType, targetIdx] = over.id.split('-');
    const cardsToMove = activeDrag.cards;
    const firstCard = cardsToMove[0];
    const source = activeDrag.sourceInfo;

    let valid = false;

    if (targetType === 'tableau') {
      const colIdx = parseInt(targetIdx);
      const targetCol = tableau[colIdx];
      const targetCard = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;
      if (canPlaceOnTableau(firstCard, targetCard)) valid = true;
    } else if (targetType === 'foundation' && cardsToMove.length === 1) {
      const fIdx = parseInt(targetIdx);
      const suit = SUITS[fIdx];
      const topCard = foundation[fIdx].length > 0 ? foundation[fIdx][foundation[fIdx].length - 1] : null;
      if (canPlaceOnFoundation(firstCard, suit, topCard)) valid = true;
    }

    if (valid) {
      const newTableau = [...tableau];
      const newFoundation = [...foundation];
      const newWaste = [...waste];

      // Remove from source
      if (source.type === 'tableau') {
        newTableau[source.index] = newTableau[source.index].slice(0, -cardsToMove.length);
        if (newTableau[source.index].length > 0) {
          newTableau[source.index][newTableau[source.index].length - 1].isFaceUp = true;
        }
      } else if (source.type === 'waste') {
        newWaste.pop();
      } else if (source.type === 'foundation') {
        newFoundation[source.index].pop();
      }

      // Add to target
      if (targetType === 'tableau') {
        newTableau[parseInt(targetIdx)] = [...newTableau[parseInt(targetIdx)], ...cardsToMove];
      } else if (targetType === 'foundation') {
        newFoundation[parseInt(targetIdx)] = [...newFoundation[parseInt(targetIdx)], cardsToMove[0]];
      }

      setTableau(newTableau);
      setFoundation(newFoundation);
      setWaste(newWaste);
      setMoves(m => m + 1);
    }
  };

  useEffect(() => {
    const allFoundationFull = foundation.every(f => f.length === 13);
    if (allFoundationFull && !won && isActive) {
      setWon(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0ea5e9', '#6366f1', '#ffffff']
      });
      if (user) {
        axios.post('/game/stats', {
          game_name: 'solitaire',
          result: 'won',
          time: timer,
          difficulty: 'normal',
          moves: moves
        }).then(() => {
          axios.delete('/game/session/solitaire');
        }).catch(console.error);
      }
    }
  }, [foundation, won, isActive, timer, moves, user]);

  return (
    <div className="min-h-screen bg-[#064e3b] dark:bg-[#022c22] p-4 md:p-8 text-white transition-colors duration-500 relative">
      {(won || showLevelModal || isPaused) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 text-center animate-in zoom-in-95 duration-300">
            {isPaused ? (
              <>
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-rounded text-amber-500 text-5xl">pause_circle</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase">Juego en Pausa</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">Tómate un respiro. El tiempo se ha detenido.</p>
                <div className="grid gap-4">
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="w-full bg-sky-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-rounded">play_arrow</span>
                    CONTINUAR PARTIDA
                  </button>
                  <button 
                    onClick={() => { saveCurrentSession(); onBack(); }}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black transition-all hover:bg-slate-200"
                  >
                    GUARDAR Y SALIR
                  </button>
                </div>
              </>
            ) : showLevelModal ? (
              <>
                <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-rounded text-sky-500 text-5xl">style</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight uppercase">Solitario</h2>
                
                {hasSavedSession && (
                  <button 
                    onClick={resumeSession}
                    className="w-full mb-6 p-6 bg-sky-500 text-white rounded-3xl font-black flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-sky-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-rounded text-3xl">resume</span>
                      <div className="text-left">
                        <span className="block text-xs opacity-80 uppercase tracking-widest">Partida Guardada</span>
                        <span className="text-lg uppercase">Reanudar</span>
                      </div>
                    </div>
                    <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">play_arrow</span>
                  </button>
                )}

                <button
                  onClick={initGame}
                  className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/5 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <span className="material-symbols-rounded text-2xl">add</span>
                    </div>
                    <div>
                      <span className="block font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Nuevo Juego</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Barajar mazo completo</span>
                    </div>
                  </div>
                  <span className="material-symbols-rounded text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>

                <button onClick={onBack} className="mt-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-black uppercase tracking-[0.2em]">Volver al inicio</button>
              </>
            ) : won ? (
              <>
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-rounded text-emerald-500 text-5xl">workspace_premium</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">¡VICTORIA!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Has completado el solitario en {formatTime(timer)} con {moves} movimientos.</p>
                <div className="grid gap-4">
                  <button onClick={() => setShowLevelModal(true)} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-sky-500/30">JUGAR OTRA VEZ</button>
                  <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black">VOLVER AL INICIO</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className={`max-w-6xl mx-auto transition-all duration-500 ${isPaused ? 'blur-xl grayscale opacity-50 scale-95' : ''}`}>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { saveCurrentSession(); onBack(); }}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/5"
                title="Salir"
              >
                <span className="material-symbols-rounded">arrow_back</span>
              </button>
              <button 
                onClick={() => setIsPaused(true)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/5"
                title="Pausar"
              >
                <span className="material-symbols-rounded">pause</span>
              </button>
            </div>
            
            <div className="flex gap-4 md:gap-12 bg-black/30 px-8 py-5 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Tiempo</p>
                <p className="text-2xl md:text-3xl font-black tabular-nums tracking-tighter">{formatTime(timer)}</p>
              </div>
              <div className="w-px h-10 bg-white/10 self-center"></div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Movimientos</p>
                <p className="text-2xl md:text-3xl font-black tabular-nums tracking-tighter">{moves}</p>
              </div>
            </div>

            <button 
              onClick={() => setShowLevelModal(true)}
              className="bg-white dark:bg-emerald-500 text-emerald-900 dark:text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
            >
              Nuevo Juego
            </button>
          </div>

          {/* Tablero Superior */}
          <div className="flex flex-wrap justify-between mb-16 gap-8">
            <div className="flex gap-3 md:gap-6">
              <div 
                onClick={handleStockClick}
                className={`w-20 h-28 md:w-24 md:h-36 rounded-xl border-2 border-white/10 flex items-center justify-center cursor-pointer transition-all hover:border-white/30 relative group ${stock.length === 0 ? 'bg-black/20' : ''}`}
              >
                {stock.length > 0 ? (
                  <div className="relative w-full h-full">
                    <DraggableCard card={stock[stock.length - 1]} isFaceUp={false} className="group-hover:translate-y-[-2px] transition-transform" />
                  </div>
                ) : (
                  <span className="material-symbols-rounded text-white/20 text-4xl group-hover:rotate-180 transition-transform duration-500">refresh</span>
                )}
              </div>

              {/* Waste Droppable Area */}
              <div id="waste-0" className="w-20 h-28 md:w-24 md:h-36 rounded-xl border-2 border-white/5 bg-black/10 relative">
                <AnimatePresence mode="popLayout">
                  {waste.length > 0 && (
                    <motion.div
                      key={waste[waste.length - 1].id}
                      initial={{ x: -100, rotateY: 180, opacity: 0 }}
                      animate={{ x: 0, rotateY: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className="absolute inset-0"
                    >
                      <DraggableWrapper 
                        id={`waste-0-${waste.length-1}`} 
                        disabled={false}
                        isDraggingSource={activeDrag?.sourceInfo.type === 'waste'}
                      >
                        <DraggableCard card={waste[waste.length - 1]} isFaceUp={true} />
                      </DraggableWrapper>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex gap-2 md:gap-4">
              {foundation.map((f, i) => (
                <DroppableWrapper key={i} id={`foundation-${i}`}>
                  <div className="w-20 h-28 md:w-24 md:h-36 rounded-xl border-2 border-white/10 bg-black/20 flex items-center justify-center relative overflow-hidden group">
                    <span className="material-symbols-rounded text-white/5 text-4xl md:text-6xl absolute z-0 group-hover:scale-110 transition-transform duration-700">
                      {['favorite', 'diamond', 'clover', 'spade'][i]}
                    </span>
                    {f.length > 0 && (
                      <DraggableWrapper 
                        id={`foundation-${i}-${f.length-1}`} 
                        disabled={false}
                        isDraggingSource={activeDrag?.sourceInfo.type === 'foundation' && activeDrag?.sourceInfo.index === i}
                      >
                        <DraggableCard card={f[f.length - 1]} isFaceUp={true} className="z-10" />
                      </DraggableWrapper>
                    )}
                  </div>
                </DroppableWrapper>
              ))}
            </div>
          </div>

          {/* Tablero Principal (Tableau) */}
          <div className="grid grid-cols-7 gap-2 md:gap-6 items-start pb-64">
            {tableau.map((col, i) => (
              <DroppableWrapper key={i} id={`tableau-${i}`}>
                <div className="flex flex-col min-h-[300px] md:min-h-[500px] relative">
                  {col.length === 0 && (
                    <div className="w-full h-28 md:h-36 rounded-xl border-2 border-white/5 bg-black/5" />
                  )}
                  {col.map((card, j) => {
                    const isBeingDragged = activeDrag?.sourceInfo.type === 'tableau' && 
                                          activeDrag?.sourceInfo.index === i && 
                                          j >= activeDrag?.sourceInfo.cardIdx;

                    return (
                      <div 
                        key={card.id} 
                        className="absolute w-full"
                        style={{ top: j * (window.innerWidth < 768 ? 20 : 35) }}
                      >
                        <DraggableWrapper 
                          id={`tableau-${i}-${j}`} 
                          disabled={!card.isFaceUp}
                          isDraggingSource={isBeingDragged}
                        >
                          <DraggableCard card={card} isFaceUp={card.isFaceUp} />
                        </DraggableWrapper>
                      </div>
                    );
                  })}
                </div>
              </DroppableWrapper>
            ))}
          </div>
        </div>

        <DragOverlay zIndex={100}>
          {activeDrag ? (
            <div className="flex flex-col">
              {activeDrag.cards.map((card, i) => (
                <div key={card.id} style={{ marginTop: i === 0 ? 0 : (window.innerWidth < 768 ? -90 : -110) }}>
                  <DraggableCard card={card} isFaceUp={true} />
                </div>
              ))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <style jsx>{`
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

// --- Helpers para DnD ---

import { useDraggable, useDroppable } from '@dnd-kit/core';

const DraggableWrapper = ({ id, children, disabled, isDraggingSource }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    disabled: disabled
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const contentStyle = (isDragging || isDraggingSource) ? { opacity: 0 } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? 'z-50' : ''}>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

const DroppableWrapper = ({ id, children }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className="w-full h-full">
      {children}
    </div>
  );
};

export default Solitaire;
