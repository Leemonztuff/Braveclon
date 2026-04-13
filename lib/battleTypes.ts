import { UnitTemplate } from '@/lib/gameData';

export interface BattleUnit {
  id: string;
  template: UnitTemplate;
  isPlayer: boolean;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  bbGauge: number;
  maxBb: number;
  isDead: boolean;
  queuedBb: boolean;
  actionState: 'idle' | 'attacking' | 'skill' | 'hurt' | 'bb_hurt' | 'dead';
  isWeaknessHit?: boolean;
}
