import { useState, useEffect } from 'react';
import { PlayerState } from '@/lib/gameState';
import { UNIT_DATABASE, UnitTemplate } from '@/lib/gameData';
import { motion, AnimatePresence } from 'motion/react';

type SummonPhase = 'idle' | 'gate' | 'reveal';

interface SummonResultDisplay {
  unit: UnitTemplate;
  isPity: boolean;
}

export default function SummonScreen({ state, spendGems, addUnit, rollGacha, rollGachaMulti, onAlert }: { 
  state: PlayerState, 
  spendGems: (amount: number) => boolean, 
  addUnit: (id: string) => void, 
  rollGacha: () => { unitId: string, isPity: boolean },
  rollGachaMulti: (count: number) => string[],
  onAlert: (msg: string) => void 
}) {
  const [summonResults, setSummonResults] = useState<SummonResultDisplay[]>([]);
  const [phase, setPhase] = useState<SummonPhase>('idle');

  const pityThreshold = 20;
  const pityProgress = state.pityCounter;
  const pityPercent = Math.min(100, (pityProgress / pityThreshold) * 100);

  const handleSingleSummon = () => {
    if (phase !== 'idle') return;
    
    if (spendGems(5)) {
      const result = rollGacha();
      const unit = UNIT_DATABASE[result.unitId];
      setSummonResults([{ unit, isPity: result.isPity }]);
      setPhase('gate');
      
      setTimeout(() => {
        setPhase('reveal');
        addUnit(result.unitId);
      }, 2500);
    } else {
      onAlert("Not enough gems! You need 5 💎 to summon a hero.");
    }
  };

  const handleMultiSummon = () => {
    if (phase !== 'idle') return;
    
    const cost = 45;
    if (spendGems(cost)) {
      const unitIds = rollGachaMulti(10);
      const results = unitIds.map(id => ({
        unit: UNIT_DATABASE[id],
        isPity: false
      }));
      setSummonResults(results);
      setPhase('gate');
      
      setTimeout(() => {
        setPhase('reveal');
      }, 2500);
    } else {
      onAlert(`Not enough gems! You need ${cost} 💎 for 10 summons.`);
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
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button 
                  onClick={handleSingleSummon}
                  className="relative overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 font-black text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-transform active:scale-95 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2 text-lg">
                    SUMMON (5 💎)
                  </span>
                </button>
                
                <button 
                  onClick={handleMultiSummon}
                  className="relative overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-4 font-black text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-transform active:scale-95 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2 text-lg">
                    x10 SUMMON (45 💎)
                  </span>
                </button>
              </div>
              
              <div className="mt-6 text-xs text-zinc-500">
                <div className="mb-2">Rates: 3★ 72% | 4★ 25% | 5★ 3%</div>
                <div className="flex items-center gap-2">
                  <span>Pity:</span>
                  <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                      style={{ width: `${pityPercent}%` }}
                    />
                  </div>
                  <span>{pityProgress}/{pityThreshold}</span>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'gate' && summonResults[0] && (
            <motion.div
              key="gate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.5, filter: 'brightness(2) blur(20px)' }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center absolute inset-0"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`absolute w-64 h-80 rounded-full bg-gradient-to-t blur-3xl opacity-50 ${getGateColor(summonResults[0].unit.rarity)}`}
              />
              
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
                className={`relative w-48 h-72 border-4 rounded-t-full flex items-center justify-center overflow-hidden z-10 ${getDoorColor(summonResults[0].unit.rarity)}`}
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

          {phase === 'reveal' && summonResults.length > 0 && (
            <motion.div 
              key="reveal"
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              className="flex flex-col items-center absolute inset-0 justify-center bg-zinc-950/80 backdrop-blur-sm z-40 overflow-y-auto"
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
                className="text-3xl font-black text-yellow-400 mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] z-10"
              >
                {summonResults.length === 1 ? 'New Hero!' : 'Summon Complete!'}
              </motion.h2>

              {summonResults[0].isPity && (
                <div className="text-sm font-bold text-pink-400 mb-2 animate-pulse">★ PITY ACTIVATED! ★</div>
              )}
              
              <div className={`flex ${summonResults.length > 1 ? 'flex-wrap justify-center gap-2 max-h-[60vh] overflow-y-auto p-2' : ''} z-10`}>
                {summonResults.map((result, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="text-center bg-zinc-900/80 px-4 py-3 rounded-2xl border border-zinc-700 shadow-xl"
                  >
                    <div className="flex justify-center gap-1 mb-1">
                      {Array.from({ length: result.unit.rarity }).map((_, i) => (
                        <span key={i} className="text-yellow-400 text-lg">★</span>
                      ))}
                    </div>
                    <div className="text-lg font-black text-white">{result.unit.name}</div>
                    <div className="text-xs font-bold text-zinc-400">{result.unit.element}</div>
                  </motion.div>
                ))}
              </div>

              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => {
                  setPhase('idle');
                  setSummonResults([]);
                }}
                className="mt-4 px-8 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-600 transition-colors z-20"
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
