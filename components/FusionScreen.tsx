import { useState } from 'react';
import { PlayerState } from '@/lib/gameState';
import { UNIT_DATABASE, getExpForLevel } from '@/lib/gameData';
import { X, Zap, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FusionScreen({ 
  state, 
  targetInstanceId, 
  onBack, 
  fuseUnits, 
  onAlert 
}: { 
  state: PlayerState, 
  targetInstanceId: string, 
  onBack: () => void, 
  fuseUnits: (targetId: string, materialIds: string[]) => any,
  onAlert: (msg: string) => void
}) {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [isFusing, setIsFusing] = useState(false);
  const [fusionResult, setFusionResult] = useState<any>(null);

  const safeInventory = state?.inventory || [];
  const safeZel = state?.zel || 0;
  
  const targetUnit = safeInventory.find(u => u.instanceId === targetInstanceId);
  if (!targetUnit) {
    onBack();
    return null;
  }

  const targetTemplate = UNIT_DATABASE[targetUnit.templateId];
  if (!targetTemplate) {
    onBack();
    return null;
  }
  
  const isMaxLevel = targetUnit.level >= targetTemplate.maxLevel;

  // Calculate projected stats
  let projectedExp = targetUnit.exp;
  let projectedLevel = targetUnit.level;
  let cost = targetUnit.level * 100 * selectedMaterials.length;

  selectedMaterials.forEach(matId => {
    const matUnit = safeInventory.find(u => u.instanceId === matId);
    if (!matUnit) return;
    const matTemplate = UNIT_DATABASE[matUnit.templateId];
    if (!matTemplate) return;
    
    let exp = matTemplate.rarity * 500 + matUnit.level * 50;
    if (matTemplate.element === targetTemplate.element) {
      exp = Math.floor(exp * 1.5);
    }
    projectedExp += exp;
  });

  while (projectedExp >= getExpForLevel(projectedLevel) && projectedLevel < targetTemplate.maxLevel) {
    projectedExp -= getExpForLevel(projectedLevel);
    projectedLevel++;
  }
  if (projectedLevel === targetTemplate.maxLevel) {
    projectedExp = 0;
  }

  const handleSelectMaterial = (instanceId: string) => {
    if (selectedMaterials.includes(instanceId)) {
      setSelectedMaterials(prev => prev.filter(id => id !== instanceId));
    } else {
      if (selectedMaterials.length >= 5) {
        onAlert("You can only select up to 5 materials at once.");
        return;
      }
      setSelectedMaterials(prev => [...prev, instanceId]);
    }
  };

  const handleFuse = () => {
    if (selectedMaterials.length === 0) return;
    if (safeZel < cost) {
      onAlert(`Not enough Zel! You need ${cost} 💰.`);
      return;
    }

    setIsFusing(true);
    
    // Simulate animation delay
    setTimeout(() => {
      const result = fuseUnits(targetInstanceId, selectedMaterials);
      if (result.success) {
        setFusionResult(result);
        setSelectedMaterials([]);
      }
      setIsFusing(false);
    }, 1500);
  };

  const availableMaterials = safeInventory.filter(u => {
    const inTeam = (state?.team || []).includes(u.instanceId);
    return u.instanceId !== targetInstanceId && !inTeam && u.templateId !== targetUnit.templateId;
  });

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900 shadow-md z-10">
        <button onClick={onBack} className="text-zinc-400 hover:text-white p-1 bg-zinc-800 rounded-full">
          <X size={20} />
        </button>
        <h3 className="font-black italic text-lg text-zinc-100 uppercase tracking-wider">Unit Fusion</h3>
        <div className="w-7" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Target Unit Area */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="w-20 h-20 bg-zinc-800 rounded-xl border-2 border-blue-500/50 flex items-center justify-center relative z-10">
            <img src={targetTemplate.spriteUrl} alt={targetTemplate.name} className="w-16 h-16 object-contain" style={{ imageRendering: 'pixelated' }} />
          </div>
          
          <div className="flex-1 z-10">
            <h2 className="text-lg font-bold text-white">{targetTemplate.name}</h2>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-zinc-300">Lv. {targetUnit.level}</span>
              {selectedMaterials.length > 0 && projectedLevel > targetUnit.level && (
                <>
                  <ArrowRight size={14} className="text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">Lv. {projectedLevel}</span>
                </>
              )}
            </div>

            <div className="mt-2">
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-blue-400">EXP</span>
                {isMaxLevel ? (
                  <span className="text-yellow-400">MAX</span>
                ) : (
                  <span className="text-zinc-400">
                    {selectedMaterials.length > 0 ? (
                      <span className="text-emerald-400">+{projectedExp - targetUnit.exp + (projectedLevel > targetUnit.level ? getExpForLevel(targetUnit.level) : 0)}</span>
                    ) : (
                      `${targetUnit.exp} / ${getExpForLevel(targetUnit.level)}`
                    )}
                  </span>
                )}
              </div>
              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${isMaxLevel ? 100 : (targetUnit.exp / getExpForLevel(targetUnit.level)) * 100}%` }}
                />
                {selectedMaterials.length > 0 && !isMaxLevel && (
                  <div 
                    className="absolute top-0 h-full bg-emerald-400 opacity-50 transition-all duration-300" 
                    style={{ 
                      left: `${(targetUnit.exp / getExpForLevel(targetUnit.level)) * 100}%`,
                      width: `${projectedLevel > targetUnit.level ? 100 : ((projectedExp - targetUnit.exp) / getExpForLevel(targetUnit.level)) * 100}%` 
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Material Selection Area */}
        <div className="p-4">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Select Materials</h3>
            <span className="text-xs font-mono text-zinc-400">{selectedMaterials.length} / 5</span>
          </div>

          {availableMaterials.length === 0 ? (
            <div className="text-center p-8 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed">
              <p className="text-zinc-500 text-sm">No available units to fuse.</p>
              <p className="text-zinc-600 text-xs mt-1">Units in your team cannot be fused.</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {availableMaterials.map(unit => {
                const template = UNIT_DATABASE[unit.templateId];
                const isSelected = selectedMaterials.includes(unit.instanceId);
                const isSameElement = template.element === targetTemplate.element;
                
                return (
                  <button
                    key={unit.instanceId}
                    onClick={() => handleSelectMaterial(unit.instanceId)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                      isSelected 
                        ? 'border-emerald-500 scale-95 opacity-50' 
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                    }`}
                  >
                    <img src={template.spriteUrl} alt={template.name} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] font-bold text-center py-0.5">
                      Lv.{unit.level}
                    </div>
                    {isSameElement && !isSelected && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] font-black px-1 rounded-bl">
                        1.5x
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
                        <Check className="text-emerald-400 drop-shadow-md" size={24} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800 z-20">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-zinc-400 uppercase">Fusion Cost</span>
          <span className={`text-sm font-bold font-mono ${safeZel >= cost ? 'text-yellow-400' : 'text-red-400'}`}>
            {cost.toLocaleString()} 💰
          </span>
        </div>
        <button
          onClick={handleFuse}
          disabled={selectedMaterials.length === 0 || isMaxLevel || isFusing}
          className={`w-full py-4 rounded-xl font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
            selectedMaterials.length === 0 || isMaxLevel
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] active:scale-95'
          }`}
        >
          {isFusing ? (
            <span className="animate-pulse">Fusing...</span>
          ) : isMaxLevel ? (
            'Max Level Reached'
          ) : (
            <>
              <Zap size={18} />
              Fuse Units
            </>
          )}
        </button>
      </div>

      {/* Fusion Animation Overlay */}
      <AnimatePresence>
        {isFusing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm"
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent border-b-transparent"
              />
              <motion.div 
                animate={{ rotate: -360, scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-4 border-4 border-indigo-500 rounded-full border-l-transparent border-r-transparent"
              />
              <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center z-10 border-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.8)]">
                <img src={targetTemplate.spriteUrl} alt="Target" className="w-16 h-16 object-contain animate-pulse" style={{ imageRendering: 'pixelated' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {fusionResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
              <h2 className="text-2xl font-black text-blue-400 mb-6 uppercase tracking-wider">Fusion Success!</h2>
              
              <div className="w-24 h-24 bg-zinc-800 rounded-2xl border-2 border-blue-500/50 flex items-center justify-center mb-4">
                <img src={targetTemplate.spriteUrl} alt="Target" className="w-16 h-16 object-contain" style={{ imageRendering: 'pixelated' }} />
              </div>

              <div className="text-xl font-bold text-white mb-2">{targetTemplate.name}</div>
              
              <div className="flex items-center gap-3 mb-6 text-lg font-bold">
                <span className="text-zinc-400">Lv. {fusionResult.oldLevel}</span>
                <ArrowRight className="text-zinc-600" size={20} />
                <span className="text-emerald-400">Lv. {fusionResult.newLevel}</span>
              </div>

              <div className="text-sm font-mono text-blue-400 bg-blue-500/10 px-4 py-2 rounded-lg mb-8">
                +{fusionResult.expGained} EXP
              </div>

              <button 
                onClick={() => setFusionResult(null)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black tracking-wider transition-colors"
              >
                AWESOME
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
