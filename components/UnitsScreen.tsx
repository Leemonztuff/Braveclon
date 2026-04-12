import { useState } from 'react';
import { PlayerState, calculateStats } from '@/lib/gameState';
import { UNIT_DATABASE, EQUIPMENT_DATABASE, EquipSlot, getExpForLevel } from '@/lib/gameData';
import { Shield, Sword, Gem, X, Zap } from 'lucide-react';

export default function UnitsScreen({ 
  state, 
  setTeamMember,
  equipItem,
  unequipItem,
  onNavigateToFusion
}: { 
  state: PlayerState, 
  setTeamMember: (index: number, id: string | null) => void,
  equipItem: (unitId: string, equipId: string, slot: EquipSlot) => void,
  unequipItem: (unitId: string, slot: EquipSlot) => void,
  onNavigateToFusion?: (unitId: string) => void
}) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [inspectUnitId, setInspectUnitId] = useState<string | null>(null);
  const [equipModalSlot, setEquipModalSlot] = useState<EquipSlot | null>(null);

  const handleSelectUnit = (instanceId: string) => {
    if (selectedSlot !== null) {
      // Check if unit is already in team
      const existingIndex = state.team.indexOf(instanceId);
      if (existingIndex !== -1) {
        setTeamMember(existingIndex, null); // Remove from old slot
      }
      setTeamMember(selectedSlot, instanceId);
      setSelectedSlot(null);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-xl font-black italic text-zinc-100 mb-4 uppercase tracking-wider">Manage Squad</h2>
      
      {/* Team Display */}
      <div className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800 shadow-inner">
        <div className="flex justify-between gap-2">
          {state.team.map((instanceId, index) => {
            const unitInstance = instanceId ? state.inventory.find(u => u.instanceId === instanceId) : null;
            const template = unitInstance ? UNIT_DATABASE[unitInstance.templateId] : null;
            const isSelected = selectedSlot === index;

            return (
              <button
                key={index}
                onClick={() => setSelectedSlot(isSelected ? null : index)}
                className={`relative w-14 h-14 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-colors ${
                  isSelected ? 'border-yellow-400 bg-yellow-400/20' : 'border-zinc-700 bg-zinc-800'
                }`}
              >
                {template ? (
                  <img src={template.spriteUrl} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-600 text-xs font-bold">EMPTY</span>
                )}
                {index === 0 && (
                  <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[8px] font-bold px-1 rounded">LDR</div>
                )}
              </button>
            );
          })}
        </div>
        {selectedSlot !== null && (
          <div className="mt-4 text-center text-sm text-yellow-400 font-medium animate-pulse">
            Select a unit from inventory for slot {selectedSlot + 1}
            <button 
              className="ml-4 px-2 py-1 bg-zinc-800 text-white rounded text-xs"
              onClick={() => { setTeamMember(selectedSlot, null); setSelectedSlot(null); }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Inventory List */}
      <div className="flex-1 overflow-y-auto bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-2">
        <div className="grid grid-cols-1 gap-2">
          {state.inventory.map(inst => {
            const template = UNIT_DATABASE[inst.templateId];
            const stats = calculateStats(template, inst.level, inst.equipment, state.equipmentInventory);
            const inTeam = state.team.includes(inst.instanceId);

            return (
              <div
                key={inst.instanceId}
                className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-colors ${
                  selectedSlot !== null 
                    ? 'border-zinc-600 bg-zinc-800 hover:border-yellow-400 cursor-pointer' 
                    : 'border-zinc-800 bg-zinc-900/50'
                }`}
                onClick={() => {
                  if (selectedSlot !== null && (selectedSlot !== null || inTeam)) {
                    handleSelectUnit(inst.instanceId);
                  }
                }}
              >
                <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden relative border border-zinc-700">
                  <img src={template.spriteUrl} alt={template.name} className="w-full h-full object-cover" />
                  {inTeam && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] font-bold text-yellow-400">IN TEAM</div>}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-sm text-zinc-200">{template.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">Lv.{inst.level}/{template.maxLevel}</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${inst.level >= template.maxLevel ? 100 : (inst.exp / getExpForLevel(inst.level)) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-2 mt-1 text-[10px] font-mono text-zinc-400">
                    <span className="text-red-400">HP:{stats.hp}</span>
                    <span className="text-orange-400">ATK:{stats.atk}</span>
                    <span className="text-blue-400">DEF:{stats.def}</span>
                  </div>
                </div>
                {selectedSlot === null && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setInspectUnitId(inst.instanceId); }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-300 border border-zinc-700"
                  >
                    DETAILS
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unit Details Full Screen */}
      {inspectUnitId && (
        <div className="absolute inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900 shadow-md">
            <h3 className="font-black italic text-lg text-zinc-100 uppercase tracking-wider">Unit Details</h3>
            <button onClick={() => setInspectUnitId(null)} className="text-zinc-400 hover:text-white p-1 bg-zinc-800 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            {(() => {
              const unit = state.inventory.find(u => u.instanceId === inspectUnitId)!;
              const template = UNIT_DATABASE[unit.templateId];
              const stats = calculateStats(template, unit.level, unit.equipment, state.equipmentInventory);
              
              return (
                <>
                  {/* Hero Section */}
                  <div className="flex flex-col items-center bg-zinc-900 rounded-2xl p-6 border border-zinc-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-zinc-800/50 to-transparent"></div>
                    <div className="w-32 h-32 mb-4 relative z-10">
                      <img src={template.spriteUrl} alt={template.name} className="w-full h-full object-contain drop-shadow-2xl" />
                    </div>
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: template.rarity }).map((_, i) => (
                        <span key={i} className="text-yellow-400 text-lg">★</span>
                      ))}
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-wide">{template.name}</h2>
                    <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">{template.element} Element</div>
                    
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold text-zinc-300">Lv. {unit.level} <span className="text-zinc-500 text-xs">/ {template.maxLevel}</span></span>
                        <span className="text-[10px] text-blue-400 font-mono">
                          {unit.level >= template.maxLevel ? 'MAX' : `${unit.exp} / ${getExpForLevel(unit.level)} EXP`}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800 mb-4">
                        <div 
                          className="bg-blue-500 h-full" 
                          style={{ width: `${unit.level >= template.maxLevel ? 100 : (unit.exp / getExpForLevel(unit.level)) * 100}%` }}
                        />
                      </div>
                      <button
                        onClick={() => onNavigateToFusion && onNavigateToFusion(unit.instanceId)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                      >
                        <Zap size={16} /> Fuse Units
                      </button>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Combat Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <StatBox label="HP" value={stats.hp} color="text-red-400" bg="bg-red-500/10" />
                      <StatBox label="ATK" value={stats.atk} color="text-orange-400" bg="bg-orange-500/10" />
                      <StatBox label="DEF" value={stats.def} color="text-blue-400" bg="bg-blue-500/10" />
                      <StatBox label="REC" value={stats.rec} color="text-emerald-400" bg="bg-emerald-500/10" />
                    </div>
                  </div>

                  {/* Skill Section */}
                  <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Brave Burst</h3>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl border border-zinc-700 shrink-0">
                        ✨
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-white text-lg">{template.skill.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase border border-zinc-700">
                            {template.skill.type}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-2">{template.skill.description}</p>
                        <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 inline-block px-2 py-1 rounded">
                          Cost: {template.skill.cost} BC
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Section */}
                  <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-8">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Equipment</h3>
                    <div className="flex flex-col gap-3">
                      <EquipSlotButton 
                        unit={unit} 
                        slot="weapon" 
                        icon={<Sword size={20} />} 
                        inventory={state.equipmentInventory} 
                        onClick={() => setEquipModalSlot('weapon')} 
                        onUnequip={() => unequipItem(unit.instanceId, 'weapon')}
                      />
                      <EquipSlotButton 
                        unit={unit} 
                        slot="armor" 
                        icon={<Shield size={20} />} 
                        inventory={state.equipmentInventory} 
                        onClick={() => setEquipModalSlot('armor')} 
                        onUnequip={() => unequipItem(unit.instanceId, 'armor')}
                      />
                      <EquipSlotButton 
                        unit={unit} 
                        slot="accessory" 
                        icon={<Gem size={20} />} 
                        inventory={state.equipmentInventory} 
                        onClick={() => setEquipModalSlot('accessory')} 
                        onUnequip={() => unequipItem(unit.instanceId, 'accessory')}
                      />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Select Item Modal */}
      {equipModalSlot && inspectUnitId && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl h-[80%]">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950">
              <h3 className="font-bold text-lg text-zinc-100 capitalize">Select {equipModalSlot}</h3>
              <button onClick={() => setEquipModalSlot(null)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {state.equipmentInventory
                .filter(eq => EQUIPMENT_DATABASE[eq.templateId].type === equipModalSlot)
                .map(eq => {
                  const template = EQUIPMENT_DATABASE[eq.templateId];
                  // Check who has it equipped
                  const equippedBy = state.inventory.find(u => 
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
                      <div className="text-2xl">{template.icon}</div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-white">{template.name}</div>
                        <div className="text-[10px] text-zinc-400">{template.description}</div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-1">
                          {Object.entries(template.statsBonus).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' ')}
                        </div>
                      </div>
                      {equippedBy && (
                        <div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                          E: {UNIT_DATABASE[equippedBy.templateId].name}
                        </div>
                      )}
                    </button>
                  );
                })}
                {state.equipmentInventory.filter(eq => EQUIPMENT_DATABASE[eq.templateId].type === equipModalSlot).length === 0 && (
                  <div className="text-center text-zinc-500 text-sm mt-10">No {equipModalSlot}s found in inventory.</div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EquipSlotButton({ unit, slot, icon, inventory, onClick, onUnequip }: { unit: any, slot: EquipSlot, icon: React.ReactNode, inventory: any[], onClick: () => void, onUnequip: () => void }) {
  const equipId = unit.equipment[slot];
  const equipInst = equipId ? inventory.find(e => e.instanceId === equipId) : null;
  const template = equipInst ? EQUIPMENT_DATABASE[equipInst.templateId] : null;

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={onClick}
        className="flex-1 flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-zinc-500">
          {template ? <span className="text-xl">{template.icon}</span> : icon}
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">{slot}</div>
          <div className={`text-sm font-bold ${template ? 'text-white' : 'text-zinc-600'}`}>
            {template ? template.name : 'Empty Slot'}
          </div>
        </div>
      </button>
      {template && (
        <button 
          onClick={onUnequip}
          className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-red-900/50 hover:text-red-400 hover:border-red-900 transition-colors text-zinc-500"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}

function StatBox({ label, value, color, bg }: { label: string, value: number, color: string, bg: string }) {
  return (
    <div className={`flex flex-col p-3 rounded-xl border border-zinc-800/50 ${bg}`}>
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-lg font-black font-mono ${color}`}>{value}</span>
    </div>
  );
}
