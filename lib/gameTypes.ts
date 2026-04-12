import { UnitTemplate, Stats, EquipSlot } from './gameData';

export interface UnitInstance {
  instanceId: string;
  templateId: string;
  level: number;
  exp: number;
  equipment: {
    weapon: string | null;
    armor: string | null;
    accessory: string | null;
  };
}

export interface EquipInstance {
  instanceId: string;
  templateId: string;
}

export interface QRState {
  scansToday: number;
  lastScanDate: string;
  scannedHashes: string[];
}

export interface PlayerState {
  level: number;
  exp: number;
  energy: number;
  maxEnergy: number;
  lastEnergyUpdateTime: number;
  gems: number;
  zel: number; // Gold
  inventory: UnitInstance[];
  equipmentInventory: EquipInstance[];
  team: (string | null)[]; // Array of 5 instanceIds
  qrState: QRState;
}

export const INITIAL_STATE: PlayerState = {
  level: 1,
  exp: 0,
  energy: 10,
  maxEnergy: 10,
  lastEnergyUpdateTime: Date.now(),
  gems: 50, // Start with some gems for gacha
  zel: 1000,
  inventory: [
    { instanceId: 'inst_1', templateId: 'u1', level: 1, exp: 0, equipment: { weapon: null, armor: null, accessory: null } },
    { instanceId: 'inst_2', templateId: 'u2', level: 1, exp: 0, equipment: { weapon: null, armor: null, accessory: null } },
  ],
  equipmentInventory: [
    { instanceId: 'eq_inst_1', templateId: 'eq_w1' },
    { instanceId: 'eq_inst_2', templateId: 'eq_a1' },
    { instanceId: 'eq_inst_3', templateId: 'eq_ac1' },
  ],
  team: ['inst_1', 'inst_2', null, null, null],
  qrState: {
    scansToday: 0,
    lastScanDate: new Date().toISOString().split('T')[0],
    scannedHashes: []
  }
};
