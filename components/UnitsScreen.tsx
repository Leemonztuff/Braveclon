'use client';

import { useState } from 'react';
import { PlayerState, calculateStats } from '@/lib/gameState';
import { UNIT_DATABASE, EQUIPMENT_DATABASE, EquipSlot, getExpForLevel } from '@/lib/gameData';
import { Shield, Sword, Gem, X, Zap, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AtlasSprite, ATLASES, getPlaceholderIcon } from './AtlasSprite';

interface UnitsScreenProps {
  state: PlayerState;
  setTeamMember: (index: number, id: string | null) => void;
  equipItem: (unitId: string, equipId: string, slot: EquipSlot) => void;
  unequipItem: (unitId: string, slot: EquipSlot) => void;
  onNavigateToFusion?: (unitId: string) => void;
}

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'bg-red-500',
  Water: 'bg-blue-500',
  Earth: 'bg-amber-600',
  Thunder: 'bg-purple-500',
  Light: 'bg-yellow-500',
  Dark: 'bg-zinc-700',
};

export default function UnitsScreen({ state, setTeamMember, equipItem, unequipItem, onNavigateToFusion }: UnitsScreenProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [inspectUnitId, setInspectUnitId] = useState<string | null>(null);
  const [equipModalSlot, setEquipModalSlot] = useState<EquipSlot | null>(null);
  const [viewMode, setViewMode] = useState<'team' | 'inventory'>('team');
  const [sortBy, setSortBy] = useState<'level' | 'rarity' | 'element'>('level');

  const safeTeam = state?.team || [];
  const safeInventory = state?.inventory || [];
  const safeEquipment = state?.equipmentInventory || [];

  const handleSelectUnit = (instanceId: string) => {
    if (selectedSlot !== null) {
      const existingIndex = safeTeam.indexOf(instanceId);
      if (existingIndex !== -1) {
        setTeamMember(existingIndex, null);
      }
      setTeamMember(selectedSlot, instanceId);
      setSelectedSlot(null);
    }
  };

  const sortedInventory = [...safeInventory].sort((a, b) => {
    const templateA = UNIT_DATABASE[a.templateId];
    const templateB = UNIT_DATABASE[b.templateId];
    if (!templateA || !templateB) return 0;
    switch (sortBy) {
      case 'level': return b.level - a.level;
      case 'rarity': return templateB.rarity - templateA.rarity;
      case 'element': return templateA.element.localeCompare(templateB.element);
      default: return 0;
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-3 px-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="text-amber-400" size={20} />
          <h2 className="font-black italic text-lg text-zinc-100 uppercase tracking-wider">Squad</h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('team')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'team' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            TEAM
          </button>
          <button
            onClick={() => setViewMode('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'inventory' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            INVENTORY
          </button>
        </div>
      </div>

      {/* Team Display - Full Width RPG Style */}
      <div className="bg-gradient-to-b from-zinc-800/50 to-zinc-900 p-4 border-b border-zinc-800">
        <div className="flex justify-center gap-3 flex-wrap">
          {[0, 1, 2, 3, 4].map((idx) => {
            const instanceId = safeTeam[idx];
            const unitInstance = instanceId ? safeInventory.find(u => u.instanceId === instanceId) : null;
            const template = unitInstance ? UNIT_DATABASE[unitInstance.templateId] : null;
            const isSelected = selectedSlot === idx;
            const stats = unitInstance ? calculateStats(template!, unitInstance.level, unitInstance.equipment, safeEquipment) : null;

            return (
              <motion.button
                key={idx}
                onClick={() => {
                  if (unitInstance && selectedSlot === null) {
                    setInspectUnitId(instanceId!);
                  } else {
                    setSelectedSlot(isSelected ? null : idx);
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-20 h-24 rounded-xl border-2 flex flex-col items-center overflow-hidden transition-all ${
                  isSelected 
                    ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.4)]' 
                    : unitInstance 
                      ? 'border-zinc-600 bg-zinc-800 hover:border-zinc-500' 
                      : 'border-dashed border-zinc-700 bg-zinc-800/30'
                }`}
              >
                {template ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 z-10" />
                    <div className="w-full h-16 flex items-end justify-center overflow-hidden">
                      <img 
                        src={template.spriteUrl} 
                        alt={template.name} 
                        className="w-full h-full object-cover object-bottom"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-zinc-900/80 flex items-center justify-center">
                      <span className={`text-[8px] font-bold ${ELEMENT_COLORS[template.element]}`}>●</span>
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">LDR</div>
                    )}
                    <div className="w-full px-1 py-1 bg-zinc-900/90 z-20">
                      <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${(unitInstance.level / template.maxLevel) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-zinc-300 mt-0.5 z-20 truncate w-full text-center">
                      Lv.{unitInstance.level}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-zinc-600 text-2xl">+</span>
                    <span className="text-zinc-600 text-[8px] font-bold">EMPTY</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
        
        {selectedSlot !== null && (
          <div className="mt-3 text-center text-sm text-yellow-400 font-medium animate-pulse flex items-center justify-center gap-2">
            <span>Select unit for slot {selectedSlot + 1}</span>
            <button 
              className="ml-2 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs"
              onClick={() => { setTeamMember(selectedSlot, null); setSelectedSlot(null); }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Inventory with Sort */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-zinc-900/50 px-4 py-2 flex justify-between items-center border-b border-zinc-800/50">
          <span className="text-xs font-bold text-zinc-500 uppercase">All Units ({safeInventory.length})</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded border border-zinc-700"
          >
            <option value="level">Level</option>
            <option value="rarity">Rarity</option>
            <option value="element">Element</option>
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-3 gap-2">
            {sortedInventory.map(inst => {
              const template = UNIT_DATABASE[inst.templateId];
              if (!template) return null;
              const inTeam = safeTeam.includes(inst.instanceId);
              const stats = calculateStats(template, inst.level, inst.equipment, safeEquipment);

              return (
                <motion.button
                  key={inst.instanceId}
                onClick={() => {
                  if (selectedSlot !== null) {
                    handleSelectUnit(inst.instanceId);
                  } else {
                    setInspectUnitId(inst.instanceId);
                  }
                }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-2 rounded-lg border text-left transition-colors flex flex-col ${
                    selectedSlot !== null 
                      ? 'border-zinc-600 bg-zinc-800 hover:border-yellow-400 cursor-pointer' 
                      : inTeam
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                  }`}
                >
                  <div className="relative w-full aspect-square mb-1 rounded overflow-hidden bg-zinc-950">
                    <img 
                      src={template.spriteUrl} 
                      alt={template.name} 
                      className="w-full h-full object-cover object-bottom"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className={`absolute top-1 left-1 w-2 h-2 rounded-full ${ELEMENT_COLORS[template.element]}`} />
                    {inTeam && (
                      <div className="absolute top-1 right-1 bg-amber-500 text-black text-[8px] font-bold px-1 rounded">IN</div>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-200 truncate w-full text-center">{template.name}</div>
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {Array.from({ length: template.rarity }).map((_, i) => (
                      <span key={i} className="text-[8px] text-yellow-400">★</span>
                    ))}
                  </div>
                  <div className="text-[9px] text-zinc-500 text-center font-mono">Lv.{inst.level}</div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unit Details Full Screen Modal */}
      <AnimatePresence>
        {inspectUnitId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900">
              <h3 className="font-black italic text-lg text-zinc-100 uppercase tracking-wider">Unit Info</h3>
              <button onClick={() => setInspectUnitId(null)} className="text-zinc-400 hover:text-white p-2 bg-zinc-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const unit = safeInventory.find(u => u.instanceId === inspectUnitId);
                if (!unit) return null;
                const template = UNIT_DATABASE[unit.templateId];
                if (!template) return null;
                const stats = calculateStats(template, unit.level, unit.equipment, safeEquipment);
                
                return (
                  <div className="flex flex-col">
                    {/* Hero Banner */}
                    <div className="relative h-48 bg-gradient-to-b from-zinc-800 to-zinc-950 flex items-end justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-30">
                        <img src={template.spriteUrl} alt="" className="w-full h-full object-cover blur-xl" />
                      </div>
                      <div className="relative z-10 w-40 h-40 mb-4">
                        <img 
                          src={template.spriteUrl} 
                          alt={template.name} 
                          className="w-full h-full object-contain drop-shadow-2xl"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <div className="absolute top-4 left-4 flex gap-1">
                        {Array.from({ length: template.rarity }).map((_, i) => (
                          <span key={i} className="text-yellow-400 drop-shadow-lg">★</span>
                        ))}
                      </div>
                    </div>

                    {/* Unit Info Card */}
                    <div className="px-4 -mt-8 relative z-20">
                      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-xl">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h2 className="text-xl font-black text-white">{template.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${ELEMENT_COLORS[template.element]}`}>
                                {template.element}
                              </span>
                              <span className="text-[10px] text-zinc-500">ID: {unit.instanceId.slice(-6)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-amber-400">Lv.{unit.level}</div>
                            <div className="text-[10px] text-zinc-500">/ {template.maxLevel}</div>
                          </div>
                        </div>
                        
                        {/* EXP Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-zinc-400">EXP</span>
                            <span className="text-blue-400 font-mono">
                              {unit.exp} / {getExpForLevel(unit.level)}
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                            <div 
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${Math.min(100, (unit.exp / getExpForLevel(unit.level)) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-red-400 font-bold uppercase">HP</div>
                            <div className="text-lg font-black text-red-400">{stats.hp}</div>
                          </div>
                          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-orange-400 font-bold uppercase">ATK</div>
                            <div className="text-lg font-black text-orange-400">{stats.atk}</div>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-blue-400 font-bold uppercase">DEF</div>
                            <div className="text-lg font-black text-blue-400">{stats.def}</div>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-emerald-400 font-bold uppercase">REC</div>
                            <div className="text-lg font-black text-emerald-400">{stats.rec}</div>
                          </div>
                        </div>

                        {/* Skill Card */}
                        <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700 mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-600 bg-zinc-900 flex items-center justify-center shrink-0">
                              <AtlasSprite 
                                atlasUrl={template.atlasKey ? ATLASES[template.atlasKey as keyof typeof ATLASES] : undefined}
                                iconIndex={template.skillIconIndex ?? 8}
                                width={32}
                                height={32}
                                alt={template.skill.name}
                                fallbackIcon={getPlaceholderIcon(template.skill.type)}
                              />
                            </div>
                            <span className="text-sm font-bold text-yellow-400">{template.skill.name}</span>
                            <span className="text-[10px] bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">
                              {template.skill.type}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mb-2">{template.skill.description}</p>
                          <div className="text-xs font-mono text-cyan-400">
                            Cost: {template.skill.cost} BC | Power: {template.skill.power}x
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => onNavigateToFusion && onNavigateToFusion(unit.instanceId)}
                            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-sm uppercase flex items-center justify-center gap-2"
                          >
                            <Zap size={16} /> Fuse
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Equipment Section */}
                    <div className="px-4 mt-2 pb-4">
                      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Equipment</h3>
                        <div className="space-y-2">
                          {(['weapon', 'armor', 'accessory'] as EquipSlot[]).map(slot => {
                            const equipId = unit.equipment[slot];
                            const equipInst = equipId ? safeEquipment.find(e => e.instanceId === equipId) : null;
                            const eqTemplate = equipInst ? EQUIPMENT_DATABASE[equipInst.templateId] : null;

                            return (
                              <div key={slot} className="flex items-center gap-2">
                                <button 
                                  onClick={() => setEquipModalSlot(slot)}
                                  className="flex-1 flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center overflow-hidden">
                                    <AtlasSprite 
                                      atlasUrl={eqTemplate?.atlasKey ? ATLASES[eqTemplate.atlasKey as keyof typeof ATLASES] : undefined}
                                      iconIndex={eqTemplate?.iconIndex ?? (slot === 'weapon' ? 0 : slot === 'armor' ? 1 : 2)}
                                      width={40}
                                      height={40}
                                      alt={eqTemplate?.name || 'empty slot'}
                                      fallbackIcon={getPlaceholderIcon(slot)}
                                    />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <div className="text-[10px] uppercase text-zinc-500 font-bold">{slot}</div>
                                    <div className={`text-sm font-bold ${eqTemplate ? 'text-white' : 'text-zinc-600'}`}>
                                      {eqTemplate ? eqTemplate.name : 'Empty'}
                                    </div>
                                    {eqTemplate && (
                                      <div className="text-[10px] text-emerald-400 font-mono">
                                        {Object.entries(eqTemplate.statsBonus).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' ')}
                                      </div>
                                    )}
                                  </div>
                                </button>
                                {eqTemplate && (
                                  <button 
                                    onClick={() => unequipItem(unit.instanceId, slot)}
                                    className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-red-900/50 hover:text-red-400"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select Equipment Modal */}
      <AnimatePresence>
        {equipModalSlot && inspectUnitId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl max-h-[80%]"
            >
              <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950">
                <h3 className="font-bold text-lg text-zinc-100 capitalize">Select {equipModalSlot}</h3>
                <button onClick={() => setEquipModalSlot(null)} className="text-zinc-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {safeEquipment
                  .filter(eq => EQUIPMENT_DATABASE[eq.templateId]?.type === equipModalSlot)
                  .map(eq => {
                    const template = EQUIPMENT_DATABASE[eq.templateId];
                    const equippedBy = safeInventory.find(u => 
                      u.equipment.weapon === eq.instanceId || 
                      u.equipment.armor === eq.instanceId || 
                      u.equipment.accessory === eq.instanceId
                    );

                    return (
                      <button
                        key={eq.instanceId}
                        onClick={() => {
                          equipItem(inspectUnitId, eq.instanceId, equipModalSlot);
                          setEquipModalSlot(null);
                        }}
                        className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:border-yellow-400 text-left transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center overflow-hidden">
                          <AtlasSprite 
                            atlasUrl={template.atlasKey ? ATLASES[template.atlasKey as keyof typeof ATLASES] : undefined}
                            iconIndex={template.iconIndex ?? 0}
                            width={40}
                            height={40}
                            alt={template.name}
                            fallbackIcon={getPlaceholderIcon(template.type)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-white">{template.name}</div>
                          <div className="text-[10px] text-zinc-400">{template.description}</div>
                          <div className="text-[10px] font-mono text-emerald-400 mt-1">
                            {Object.entries(template.statsBonus).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' ')}
                          </div>
                        </div>
                        {equippedBy && (
                          <div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                            {UNIT_DATABASE[equippedBy.templateId]?.name.slice(0, 6)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                {safeEquipment.filter(eq => EQUIPMENT_DATABASE[eq.templateId]?.type === equipModalSlot).length === 0 && (
                  <div className="text-center text-zinc-500 text-sm mt-10">No {equipModalSlot}s available</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
