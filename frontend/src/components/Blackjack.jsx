import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import axios from 'axios';
import _ from 'lodash';
import { useAuth } from '../context/AuthContext';

// --- Utilidades ---

const getCardImageUrl = (card) => {
  if (!card) return '';
  const suitLetter = card.suit[0].toUpperCase();
  let valueCode = card.value;
  if (valueCode === '10') valueCode = '0';
  return `https://deckofcardsapi.com/static/img/${valueCode}${suitLetter}.png`;
};

const calculateScore = (hand) => {
  let score = 0;
  let aces = 0;

  hand.forEach(card => {
    if (card.value === 'A') {
      aces += 1;
      score += 11;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
  });

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
};

// --- Componentes ---

const Card = ({ card, isHidden, index }) => (
  <motion.div
    initial={{ x: 300, y: -200, rotate: 20, opacity: 0 }}
    animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
    transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
    className="relative w-24 h-36 md:w-32 md:h-48"
  >
    <div className={`w-full h-full rounded-xl shadow-2xl transition-all duration-500 preserve-3d ${isHidden ? 'rotate-y-180' : ''}`}>
      <div 
        className="absolute inset-0 w-full h-full backface-hidden rounded-xl bg-white border-2 border-white/20"
        style={{
          backgroundImage: `url('${getCardImageUrl(card)}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-white/20 flex items-center justify-center">
        <span className="material-symbols-rounded text-white/20 text-5xl">bolt</span>
      </div>
    </div>
  </motion.div>
);

const Blackjack = ({ onBack }) => {
  const { user } = useAuth();
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting'); // 'betting', 'playing', 'dealer_turn', 'finished'
  const [message, setMessage] = useState('');
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [chips, setChips] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [canClaimReward, setCanClaimReward] = useState(false);
  const [lastClaimTime, setLastClaimClaimTime] = useState(null);
  const [countdown, setCountdown] = useState("");

  // Cargar fichas del usuario al iniciar
  useEffect(() => {
    if (user) {
      axios.get('/game/stats/blackjack').then(res => {
        if (res.data) {
          if (res.data.total_chips !== undefined) setChips(res.data.total_chips);
          setCanClaimReward(res.data.can_claim_reward);
          setLastClaimClaimTime(res.data.last_reward_claim);
        }
      }).catch(console.error);
    }
  }, [user]);

  // Lógica del temporizador
  useEffect(() => {
    if (!lastClaimTime || canClaimReward) return;

    const interval = setInterval(() => {
      const lastClaim = new Date(lastClaimTime);
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = nextClaim - now;

      if (diff <= 0) {
        setCanClaimReward(true);
        setCountdown("");
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastClaimTime, canClaimReward]);

  const handleClaimReward = async () => {
    try {
      const res = await axios.post('/game/blackjack/reward');
      if (res.data) {
        setChips(res.data.total_chips);
        setCanClaimReward(false);
        setLastClaimClaimTime(new Date().toISOString());
        setMessage(`¡RECOMPENSA RECLAMADA! +$500`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error al reclamar recompensa', error);
      setMessage(error.response?.data?.message || 'Error al reclamar');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const createDeck = () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck = [];
    for (let s of suits) {
      for (let v of values) {
        newDeck.push({ suit: s, value: v });
      }
    }
    return _.shuffle(newDeck);
  };

  const startNewGame = (bet) => {
    const newDeck = createDeck();
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setPlayerScore(calculateScore(pHand));
    setDealerScore(calculateScore([dHand[0]])); // Solo mostramos la primera carta
    setCurrentBet(bet);
    setChips(prev => prev - bet);
    setGameState('playing');
    setMessage('');

    if (calculateScore(pHand) === 21) {
      handleStand(pHand, dHand, newDeck);
    }
  };

  const handleHit = () => {
    if (gameState !== 'playing') return;
    
    const newDeck = [...deck];
    const newCard = newDeck.pop();
    const newHand = [...playerHand, newCard];
    const newScore = calculateScore(newHand);
    
    setPlayerHand(newHand);
    setPlayerScore(newScore);
    setDeck(newDeck);

    if (newScore > 21) {
      setGameState('finished');
      setMessage('¡TE PASASTE! LA CASA GANA');
      saveResult('lost', chips);
    }
  };

  const handleStand = async (pHand = playerHand, dHand = dealerHand, currentDeck = deck) => {
    setGameState('dealer_turn');
    let tempDealerHand = [...dHand];
    let tempDeck = [...currentDeck];
    let tempDealerScore = calculateScore(tempDealerHand);

    while (tempDealerScore < 17) {
      tempDealerHand.push(tempDeck.pop());
      tempDealerScore = calculateScore(tempDealerHand);
    }

    setDealerHand(tempDealerHand);
    setDealerScore(tempDealerScore);
    setDeck(tempDeck);
    setGameState('finished');

    const finalPlayerScore = calculateScore(pHand);
    let finalChips = chips;
    
    if (tempDealerScore > 21) {
      setMessage('¡LA CASA SE PASÓ! TÚ GANAS');
      finalChips = chips + currentBet * 2;
      setChips(finalChips);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      saveResult('won', finalChips);
    } else if (tempDealerScore > finalPlayerScore) {
      setMessage('LA CASA GANA');
      saveResult('lost', chips);
    } else if (tempDealerScore < finalPlayerScore) {
      setMessage('¡GANASTE!');
      finalChips = chips + currentBet * 2;
      setChips(finalChips);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      saveResult('won', finalChips);
    } else {
      setMessage('EMPATE');
      finalChips = chips + currentBet;
      setChips(finalChips);
      saveResult('tie', finalChips);
    }
  };

  const saveResult = (result, finalChips) => {
    if (user) {
      axios.post('/game/stats', {
        game_name: 'blackjack',
        result: result === 'tie' ? 'won' : result,
        time: 0,
        difficulty: 'normal',
        lives_left: 0,
        total_chips: finalChips
      }).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl transition-all active:scale-95 border border-white/5"
          >
            <span className="material-symbols-rounded">arrow_back</span>
            <span className="font-black uppercase tracking-widest text-sm text-white">Salir</span>
          </button>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-8 bg-black/40 px-8 py-4 rounded-[2rem] border border-white/10 backdrop-blur-xl">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Tus Fichas</p>
                <p className="text-2xl font-black text-white">${chips}</p>
              </div>
              {currentBet > 0 && (
                <>
                  <div className="w-px h-10 bg-white/10 self-center"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-1">Apuesta</p>
                    <p className="text-2xl font-black text-white">${currentBet}</p>
                  </div>
                </>
              )}
            </div>

            {/* Daily Reward Button / Timer */}
            {canClaimReward ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClaimReward}
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-xl font-black text-[10px] shadow-xl shadow-amber-500/20 flex items-center gap-2 animate-pulse uppercase tracking-widest"
              >
                <span className="material-symbols-rounded text-sm">redeem</span>
                RECLAMAR 500 GRATIS
              </motion.button>
            ) : (
              <div className="bg-white/5 border border-white/5 text-slate-500 px-6 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest cursor-not-allowed">
                <span className="material-symbols-rounded text-sm">lock</span>
                PRÓXIMO EN {countdown}
              </div>
            )}
          </div>
        </div>

        {/* Game Board */}
        <div className="flex-grow flex flex-col justify-center gap-12 py-8">
          {/* Dealer Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">La Casa</span>
              <span className="text-sm font-black text-white">{gameState === 'playing' ? '?' : dealerScore}</span>
            </div>
            <div className="flex justify-center -space-x-12 md:-space-x-16">
              {dealerHand.map((card, i) => (
                <Card key={i} card={card} isHidden={gameState === 'playing' && i === 1} index={i} />
              ))}
            </div>
          </div>

          {/* Message Area */}
          <div className="h-12 flex items-center justify-center">
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-xl uppercase tracking-tighter shadow-2xl"
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center -space-x-12 md:-space-x-16 mb-4">
              {playerHand.map((card, i) => (
                <Card key={i} card={card} index={i} />
              ))}
            </div>
            <div className="flex items-center gap-3 bg-sky-500/20 px-4 py-1.5 rounded-full border border-sky-500/30">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Tu Puntuación</span>
              <span className="text-sm font-black text-white">{playerScore}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-col items-center gap-6">
          <div className="flex justify-center gap-4">
            {gameState === 'betting' || gameState === 'finished' ? (
              <div className="flex flex-col items-center gap-6">
                <div className="flex gap-4">
                  {[50, 100, 500].map(amount => (
                    <button
                      key={amount}
                      disabled={chips < amount}
                      onClick={() => startNewGame(amount)}
                      className="group relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-dashed border-white/10 hover:border-emerald-500 transition-all active:scale-95 disabled:opacity-20"
                    >
                      <span className="text-xs font-black text-slate-500 group-hover:text-emerald-500">APOSTAR</span>
                      <span className="text-xl font-black text-white group-hover:text-emerald-400">${amount}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Elige una apuesta para comenzar</p>
              </div>
            ) : (
              <div className="flex gap-6">
                <button
                  disabled={gameState !== 'playing'}
                  onClick={handleHit}
                  className="bg-white text-slate-950 px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-sky-400 hover:text-white transition-all active:scale-95 shadow-xl disabled:opacity-50"
                >
                  PEDIR CARTA
                </button>
                <button
                  disabled={gameState !== 'playing'}
                  onClick={() => handleStand()}
                  className="bg-slate-800 text-white px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-slate-700 transition-all active:scale-95 border border-white/10 shadow-xl disabled:opacity-50"
                >
                  PLANTARSE
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default Blackjack;
