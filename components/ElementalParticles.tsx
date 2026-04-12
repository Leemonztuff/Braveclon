import { useState } from 'react';
import { motion } from 'motion/react';

export function ElementalParticles({ element }: { element: string }) {
  const [particles] = useState<any[]>(() => {
    const colors = {
      Fire: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500'],
      Water: ['bg-blue-500', 'bg-cyan-400', 'bg-white'],
      Earth: ['bg-green-500', 'bg-emerald-400', 'bg-lime-400'],
      Thunder: ['bg-yellow-400', 'bg-amber-300', 'bg-white'],
      Light: ['bg-yellow-200', 'bg-white', 'bg-amber-100'],
      Dark: ['bg-purple-600', 'bg-fuchsia-500', 'bg-black'],
    };
    const palette = colors[element as keyof typeof colors] || colors.Light;

    return Array.from({ length: 20 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 20;
      const distance = 40 + Math.random() * 60;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const duration = 0.4 + Math.random() * 0.4;
      return { x, y, color, duration, id: i };
    });
  });

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
          transition={{ duration: p.duration, ease: "easeOut" }}
          className={`absolute w-3 h-3 rounded-full ${p.color} shadow-[0_0_10px_currentColor]`}
        />
      ))}
    </div>
  );
}
