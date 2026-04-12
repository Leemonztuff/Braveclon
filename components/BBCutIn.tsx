import { motion } from 'motion/react';
import { BattleUnit } from '@/lib/battleTypes';

export function BBCutIn({ unit }: { unit: BattleUnit }) {
  const colors = {
    Fire: 'from-red-600 to-orange-600',
    Water: 'from-blue-600 to-cyan-600',
    Earth: 'from-green-600 to-emerald-600',
    Thunder: 'from-yellow-500 to-amber-600',
    Light: 'from-yellow-200 to-white',
    Dark: 'from-purple-700 to-zinc-900',
  };
  const color = colors[unit.template.element as keyof typeof colors] || 'from-zinc-600 to-zinc-800';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ x: '-100%', skewX: -15 }}
        animate={{ x: '0%', skewX: -15 }}
        exit={{ x: '100%', skewX: -15 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={`absolute w-[150%] h-48 bg-gradient-to-r ${color} opacity-90 flex items-center justify-center shadow-[0_0_30px_currentColor]`}
      >
        <motion.div 
          initial={{ x: -200, opacity: 0, skewX: 15 }}
          animate={{ x: 0, opacity: 1, skewX: 15 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-6"
        >
          <img src={unit.template.spriteUrl} alt={unit.template.name} className="w-40 h-40 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" style={{ imageRendering: 'pixelated' }} />
          <div className="flex flex-col">
            <span className="text-white font-black text-xl uppercase tracking-widest drop-shadow-md">{unit.template.name}</span>
            <span className="text-yellow-300 font-black text-3xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
              {unit.template.skill.name}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
