'use client';

import { motion } from 'motion/react';
import Image from 'next/image';

interface AtlasSpriteProps {
  atlasUrl: string;
  iconIndex: number;
  width?: number;
  height?: number;
  cols?: number;
  className?: string;
  alt?: string;
}

export function AtlasSprite({ 
  atlasUrl, 
  iconIndex, 
  width = 64, 
  height = 64, 
  cols = 4,
  className = '',
  alt = 'icon'
}: AtlasSpriteProps) {
  const rows = 4;
  const row = Math.floor(iconIndex / cols);
  const col = iconIndex % cols;
  
  const spriteWidth = 1024 / cols;
  const spriteHeight = 1024 / rows;
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <Image
        src={atlasUrl}
        alt={alt}
        fill
        style={{ 
          objectFit: 'cover',
          objectPosition: `-${col * spriteWidth}px -${row * spriteHeight}px`
        }}
        sizes={`${width}px`}
      />
    </div>
  );
}

export const ATLASES = {
  abyss_chaser: 'https://raw.githubusercontent.com/Leem0nGames/gameassets/main/RO/icons/abyss_chaser.jpeg',
  // Puedes añadir más atlas aquí
} as const;

export const ICON_POSITIONS = {
  // abyss_chaser atlas (16 iconos en 4x4)
  abyss_chaser: {
    // sprites de unidad (0-2)
    sprite_1: 0,
    sprite_2: 1,
    sprite_3: 2,
    // habilidades (3-7)
    skill_1: 3,
    skill_2: 4,
    skill_3: 5,
    skill_4: 6,
    skill_5: 7,
    // equipment (8-12)
    weapon: 8,
    armor: 9,
    accessory: 10,
    // iconos deUI (13-15)
    leader_icon: 13,
    elemental_fire: 14,
    elemental_water: 15,
  }
} as const;

export function getAtlasIcon(atlasName: keyof typeof ATLASES, iconName: string): number {
  const atlas = ICON_POSITIONS[atlasName];
  if (!atlas) return 0;
  return (atlas as Record<string, number>)[iconName] ?? 0;
}
