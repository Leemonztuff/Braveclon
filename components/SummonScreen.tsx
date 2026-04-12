import { useState, useEffect } from 'react';
import { PlayerState } from '@/lib/gameState';
import { UNIT_DATABASE, UnitTemplate } from '@/lib/gameData';
import { motion, AnimatePresence } from 'motion/react';

type SummonPhase = 'idle' | 'gate' | 'reveal';

export default function SummonScreen({ state, spendGems, addUnit, rollGacha, onAlert }: { state: PlayerState, spendGems: (amount: number) => boolean, addUnit: (id: string) => void, rollGacha: () => string, onAlert: (msg: string) => void }) {
  const [summonResult, setSummonResult] = useState<UnitTemplate | null>(null);
  const [phase, setPhase] = useState<SummonPhase>('idle');

  const handleSummon = () => {
    if (phase !== 'idle') return;
    
    if (spendGems(5)) {
      // 1. Roll immediately to know the rarity for the gate color
      const randomId = rollGacha();
      const unit = UNIT_DATABASE[randomId];
      setSummonResult(unit);
      
      // 2. Transition to gate phase
      setPhase('gate');
      
      // 3. After gate animation, show reveal
      setTimeout(() => {
        setPhase('reveal');
        addUnit(randomId);
      }, 2500);
    } else {
      onAlert("Not enough gems! You need 5 💎 to summon a hero.");
    }
  };

  const getGateColor = (rarity: number) => {
    if (rarity >= 5) return 'from-purple-500 via-pink-500 to-red-500 shadow-[0_0_50px_rgba(236,72,153,0.8)]';
    if (rarity === 4) return 'from-red-500 to-red-700 shadow-[0_0_50px_rgba(239,68,68,0.8)]';
    return 'from-yellow-400 to-yellow-600 shadow-[0_0_50px_rgba(250,204,21,0.8)]';
  };

  const getDoorColor = (rarity: number) => {
    if (rarity >= 5) return 'bg-gradient-to-br from-purple-900 to-zinc-900 border-pink-500';
    if (rarity === 4) return 'bg-gradient-to-br from-red-900 to-zinc-900 border-red-500';
    return 'bg-gradient-to-br from-yellow-900 to-zinc-900 border-yellow-500';
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-zinc-800/80 px-3 py-1 rounded-full text-sm font-bold text-pink-400 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)] z-50">
        💎 {state.gems}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              className="flex flex-col items-center"
            >
              <div className="w-48 h-48 bg-zinc-800/50 rounded-full flex items-center justify-center mb-8 border-4 border-zinc-700/50 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/gate/200/200')] opacity-20 bg-cover" />
                <span className="text-zinc-400 font-black tracking-widest z-10 text-xl drop-shadow-md">RARE SUMMON</span>
              </div>
              <button 
                onClick={handleSummon}
                className="relative overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 font-black text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-transform active:scale-95 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2 text-lg">
                  SUMMON (5 💎)
                </span>
              </button>
            </motion.div>
          )}

          {phase === 'gate' && summonResult && (
            <motion.div
              key="gate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.5, filter: 'brightness(2) blur(20px)' }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center absolute inset-0"
            >
              {/* Glowing Aura behind the door */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`absolute w-64 h-80 rounded-full bg-gradient-to-t blur-3xl opacity-50 ${getGateColor(summonResult.rarity)}`}
              />
              
              {/* The Summoning Door */}
              <motion.div
                initial={{ y: 50 }}
                animate={{ 
                  y: [50, -10, 0],
                  rotate: [0, -2, 2, -1, 1, 0]
                }}
                transition={{ 
                  y: { duration: 0.5, ease: "easeOut" },
                  rotate: { delay: 0.5, duration: 1.5, repeat: Infinity, ease: "linear" }
                }}
                className={`relative w-48 h-72 border-4 rounded-t-full flex items-center justify-center overflow-hidden z-10 ${getDoorColor(summonResult.rarity)}`}
              >
                <div className="absolute inset-0 bg-black/40" />
                <motion.div 
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-16 h-16 rounded-full bg-white blur-xl"
                />
              </motion.div>
            </motion.div>
          )}

          {phase === 'reveal' && summonResult && (
            <motion.div 
              key="reveal"
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              className="flex flex-col items-center absolute inset-0 justify-center bg-zinc-950/80 backdrop-blur-sm z-40"
            >
              <motion.div
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white z-0"
              />
              
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-black text-yellow-400 mb-6 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] z-10"
              >
                New Hero!
              </motion.h2>

              <div className="relative w-64 h-64 mb-6 z-10">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-[url('https://cdn.jsdelivr.net/gh/Leem0nGames/gameassets@main/RO/magic_circle.png')] bg-contain bg-center bg-no-repeat opacity-30"
                />
                <motion.img 
                  initial={{ y: 20 }}
                  animate={{ y: [20, -10, 20] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  src={summonResult.spriteUrl} 
                  alt={summonResult.name}
                  className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-center z-20 bg-zinc-900/80 px-8 py-4 rounded-2xl border border-zinc-700 shadow-xl"
              >
                <div className="flex justify-center gap-1 mb-2">
                  {Array.from({ length: summonResult.rarity }).map((_, i) => (
                    <motion.span 
                      key={i} 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + (i * 0.1), type: "spring" }}
                      className="text-yellow-400 text-2xl drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]"
                    >
                      ★
                    </motion.span>
                  ))}
                </div>
                <div className="text-3xl font-black text-white drop-shadow-md mb-1">{summonResult.name}</div>
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{summonResult.element} Element</div>
              </motion.div>

              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => {
                  setPhase('idle');
                  setSummonResult(null);
                }}
                className="mt-8 px-8 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-600 transition-colors z-20"
              >
                Continue
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
