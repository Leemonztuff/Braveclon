import { useState, useEffect } from 'react';
import { PlayerState, calculateStats } from '@/lib/gameState';
import { UNIT_DATABASE, ENEMIES, STAGES, UnitTemplate, getElementMultiplier } from '@/lib/gameData';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '@/lib/audio';
import { BattleUnit } from '@/lib/battleTypes';
import { BBCutIn } from './BBCutIn';
import { UnitSprite } from './UnitSprite';

interface FloatingDamage {
  id: string;
  targetId: string;
  damage: number;
  isHeal: boolean;
  isWeakness: boolean;
}

export default function BattleScreen({ state, stageId, onEnd }: { state: PlayerState, stageId: number, onEnd: (victory: boolean) => void }) {
  const validTeam = state.team.filter(id => id !== null && state.inventory.some(u => u.instanceId === id));
  
  const [playerUnits, setPlayerUnits] = useState<BattleUnit[]>(() => {
    return validTeam
      .map((instanceId, idx) => {
        const inst = state.inventory.find(u => u.instanceId === instanceId);
        if (!inst) return null;
        const template = UNIT_DATABASE[inst.templateId];
        if (!template) return null;
        const stats = calculateStats(template, inst.level, inst.equipment, state.equipmentInventory);
        return {
          id: `p_${idx}`,
          template,
          isPlayer: true,
          hp: stats.hp,
          maxHp: stats.hp,
          atk: stats.atk,
          def: stats.def,
          spd: stats.spd,
          bbGauge: 0,
          maxBb: template.skill.cost,
          isDead: false,
          queuedBb: false,
          actionState: 'idle'
        };
      })
      .filter((u): u is BattleUnit => u !== null);
  });

  const [enemyUnits, setEnemyUnits] = useState<BattleUnit[]>(() => {
    const stageData = STAGES.find(s => s.id === stageId) || STAGES[0];
    return stageData.enemies.map((enemyId, idx) => {
      const template = ENEMIES.find(e => e.id === enemyId) || ENEMIES[0];
      return {
        id: `e_${idx}`,
        template,
        isPlayer: false,
        hp: template.baseStats.hp,
        maxHp: template.baseStats.hp,
        atk: template.baseStats.atk,
        def: template.baseStats.def,
        spd: template.baseStats.spd,
        bbGauge: 0,
        maxBb: template.skill.cost,
        isDead: false,
        queuedBb: false,
        actionState: 'idle'
      };
    });
  });

  const [turnState, setTurnState] = useState<'player_input' | 'executing' | 'victory' | 'defeat'>('player_input');
  const [combatLog, setCombatLog] = useState<string[]>(['Battle Started!']);
  const [bbFlash, setBbFlash] = useState(false);
  const [bbCutInUnit, setBbCutInUnit] = useState<BattleUnit | null>(null);
  const [bbHitEffect, setBbHitEffect] = useState<{ targetId: string, element: string } | null>(null);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);

  const addLog = (msg: string) => {
    setCombatLog(prev => [...prev.slice(-4), msg]);
  };

  const addFloatingDamage = (targetId: string, damage: number, isHeal: boolean, isWeakness: boolean) => {
    const id = `fd_${Date.now()}_${Math.random()}`;
    setFloatingDamages(prev => [...prev, { id, targetId, damage, isHeal, isWeakness }]);
    setTimeout(() => {
      setFloatingDamages(prev => prev.filter(fd => fd.id !== id));
    }, 1000);
  };

  const toggleBb = (id: string) => {
    if (turnState !== 'player_input') return;
    setPlayerUnits(prev => prev.map(u => {
      if (u.id === id && u.bbGauge >= u.maxBb && !u.isDead) {
        return { ...u, queuedBb: !u.queuedBb };
      }
      return u;
    }));
  };

  const getNextAttacker = (players: BattleUnit[], enemies: BattleUnit[]): { attacker: BattleUnit, targets: BattleUnit[], isPlayer: boolean } | null => {
    const allAlive = [...players.filter(p => !p.isDead), ...enemies.filter(e => !e.isDead)];
    if (allAlive.length === 0) return null;
    
    allAlive.sort((a, b) => b.spd - a.spd);
    const fastest = allAlive[0];
    const isPlayer = players.some(p => p.id === fastest.id);
    
    return {
      attacker: fastest,
      targets: isPlayer ? enemies.filter(e => !e.isDead) : players.filter(p => !p.isDead),
      isPlayer
    };
  };

  const executeAttack = async (
    attacker: BattleUnit,
    target: BattleUnit,
    isPlayer: boolean,
    isBb: boolean,
    currentPlayer: BattleUnit[],
    currentEnemies: BattleUnit[]
  ): Promise<{ player: BattleUnit[], enemies: BattleUnit[] }> => {
    let newPlayer = [...currentPlayer];
    let newEnemies = [...currentEnemies];
    const skill = attacker.template.skill;
    const skillType = skill.type;
    
    if (isPlayer && !isBb) {
      const attackerIdx = newPlayer.findIndex(p => p.id === attacker.id);
      if (attackerIdx !== -1) {
        newPlayer[attackerIdx] = {
          ...newPlayer[attackerIdx],
          bbGauge: Math.min(newPlayer[attackerIdx].maxBb, newPlayer[attackerIdx].bbGauge + 3)
        };
      }
    }

    if (isBb) {
      const attackerIdx = isPlayer ? newPlayer.findIndex(p => p.id === attacker.id) : newEnemies.findIndex(e => e.id === attacker.id);
      if (attackerIdx !== -1) {
        if (isPlayer) newPlayer[attackerIdx] = { ...newPlayer[attackerIdx], bbGauge: 0, actionState: 'skill' };
        else newEnemies[attackerIdx] = { ...newEnemies[attackerIdx], bbGauge: 0, actionState: 'skill' };
      }
      
      if (skillType === 'heal') {
        const healPower = Math.floor(attacker.atk * skill.power);
        if (isPlayer) {
          newPlayer = newPlayer.map(p => {
            if (!p.isDead) {
              const newHp = Math.min(p.maxHp, p.hp + healPower);
              addFloatingDamage(p.id, healPower, true, false);
              return { ...p, hp: newHp };
            }
            return p;
          });
          addLog(`${attacker.template.name} heals all allies for ${healPower} HP!`);
        } else {
          newEnemies = newEnemies.map(e => {
            if (!e.isDead) {
              const newHp = Math.min(e.maxHp, e.hp + healPower);
              addFloatingDamage(e.id, healPower, true, false);
              return { ...e, hp: newHp };
            }
            return e;
          });
          addLog(`${attacker.template.name} heals for ${healPower} HP!`);
        }
        
        setBbCutInUnit(attacker);
        playSound('bb_cast');
        await new Promise(r => setTimeout(r, 1500));
        setBbCutInUnit(null);
      } else {
        const elementMultiplier = getElementMultiplier(attacker.template.element, target.template.element);
        const isWeakness = elementMultiplier > 1.0;
        const powerMultiplier = skill.power;
        let rawDamage = Math.max(1, (attacker.atk * powerMultiplier) - (target.def * 0.5));
        let finalDamage = Math.floor(rawDamage * elementMultiplier);

        setPlayerUnits(isPlayer ? newPlayer : prev => prev);
        setEnemyUnits(!isPlayer ? newEnemies : prev => prev);
        
        setBbCutInUnit(attacker);
        playSound('bb_cast');
        await new Promise(r => setTimeout(r, 1500));
        setBbCutInUnit(null);
        setBbFlash(true);
        setTimeout(() => setBbFlash(false), 150);
        await new Promise(r => setTimeout(r, 200));

        if (isPlayer) {
          newEnemies = newEnemies.map(e => {
            if (e.id === target.id) {
              const newHp = Math.max(0, e.hp - finalDamage);
              addFloatingDamage(e.id, finalDamage, false, isWeakness);
              return { ...e, hp: newHp, isDead: newHp <= 0, actionState: 'bb_hurt', isWeaknessHit: isWeakness };
            }
            return e;
          });
          setEnemyUnits(newEnemies);
          setBbHitEffect({ targetId: target.id, element: attacker.template.element });
          playSound('bb_hit');
          if (isWeakness) setTimeout(() => playSound('weakness'), 100);
          setTimeout(() => setBbHitEffect(null), 800);
        } else {
          newPlayer = newPlayer.map(p => {
            if (p.id === target.id) {
              const newHp = Math.max(0, p.hp - finalDamage);
              addFloatingDamage(p.id, finalDamage, false, isWeakness);
              const newBb = Math.min(p.maxBb, p.bbGauge + 3);
              return { ...p, hp: newHp, isDead: newHp <= 0, bbGauge: newBb, actionState: 'bb_hurt', isWeaknessHit: isWeakness };
            }
            return p;
          });
          setPlayerUnits(newPlayer);
          setBbHitEffect({ targetId: target.id, element: attacker.template.element });
          playSound('bb_hit');
          if (isWeakness) setTimeout(() => playSound('weakness'), 100);
          setTimeout(() => setBbHitEffect(null), 800);
        }

        addLog(`${attacker.template.name} uses ${skill.name}! ${finalDamage} dmg! ${isWeakness ? '(Weakness!)' : ''}`);
      }
    } else {
      const elementMultiplier = getElementMultiplier(attacker.template.element, target.template.element);
      const isWeakness = elementMultiplier > 1.0;
      let rawDamage = Math.max(1, attacker.atk - (target.def * 0.5));
      let finalDamage = Math.floor(rawDamage * elementMultiplier);

      if (isPlayer) {
        newPlayer = newPlayer.map(p => {
          if (p.id === attacker.id) return { ...p, actionState: 'attacking' };
          return p;
        });
        setPlayerUnits(newPlayer);
      } else {
        newEnemies = newEnemies.map(e => {
          if (e.id === attacker.id) return { ...e, actionState: 'attacking' };
          return e;
        });
        setEnemyUnits(newEnemies);
      }
      
      await new Promise(r => setTimeout(r, 200));

      if (isPlayer) {
        newEnemies = newEnemies.map(e => {
          if (e.id === target.id) {
            const newHp = Math.max(0, e.hp - finalDamage);
            addFloatingDamage(e.id, finalDamage, false, isWeakness);
            return { ...e, hp: newHp, isDead: newHp <= 0, actionState: 'hurt', isWeaknessHit: isWeakness };
          }
          return e;
        });
        setEnemyUnits(newEnemies);
        
        const attackerIdx = newPlayer.findIndex(p => p.id === attacker.id);
        if (attackerIdx !== -1) {
          newPlayer[attackerIdx] = {
            ...newPlayer[attackerIdx],
            bbGauge: Math.min(newPlayer[attackerIdx].maxBb, newPlayer[attackerIdx].bbGauge + 3),
            actionState: 'idle'
          };
        }
        setPlayerUnits(newPlayer);
        
        if (isWeakness) playSound('weakness');
        else playSound('hit');
      } else {
        newPlayer = newPlayer.map(p => {
          if (p.id === target.id) {
            const newHp = Math.max(0, p.hp - finalDamage);
            addFloatingDamage(p.id, finalDamage, false, isWeakness);
            const newBb = Math.min(p.maxBb, p.bbGauge + 3);
            return { ...p, hp: newHp, isDead: newHp <= 0, bbGauge: newBb, actionState: 'hurt', isWeaknessHit: isWeakness };
          }
          return p;
        });
        setPlayerUnits(newPlayer);
        
        const attackerIdx = newEnemies.findIndex(e => e.id === attacker.id);
        if (attackerIdx !== -1) {
          newEnemies[attackerIdx] = { ...newEnemies[attackerIdx], actionState: 'idle' };
        }
        setEnemyUnits(newEnemies);
        
        if (isWeakness) playSound('weakness');
        else playSound('hit');
      }

      addLog(`${attacker.template.name} attacks ${target.template.name} for ${finalDamage} dmg! ${isWeakness ? '(Weakness!)' : ''}`);
    }

    await new Promise(r => setTimeout(r, 400));

    if (isPlayer) {
      newPlayer = newPlayer.map(p => {
        if (p.id === attacker.id) return { ...p, queuedBb: false, actionState: 'idle' };
        return p;
      });
      newEnemies = newEnemies.map(e => {
        if (e.id === target.id) return { ...e, actionState: e.isDead ? 'dead' : 'idle', isWeaknessHit: false };
        return e;
      });
    } else {
      newEnemies = newEnemies.map(e => {
        if (e.id === attacker.id) return { ...e, queuedBb: false, actionState: 'idle' };
        return e;
      });
      newPlayer = newPlayer.map(p => {
        if (p.id === target.id) return { ...p, actionState: p.isDead ? 'dead' : 'idle', isWeaknessHit: false };
        return p;
      });
    }
    
    setPlayerUnits(newPlayer);
    setEnemyUnits(newEnemies);
    
    await new Promise(r => setTimeout(r, 100));

    return { player: newPlayer, enemies: newEnemies };
  };

  const executeTurn = async () => {
    if (turnState !== 'player_input') return;
    setTurnState('executing');
    
    let currentEnemies = [...enemyUnits];
    let currentPlayer = [...playerUnits];

    while (true) {
      const attackerData = getNextAttacker(currentPlayer, currentEnemies);
      if (!attackerData || attackerData.targets.length === 0) break;
      
      const { attacker, targets, isPlayer } = attackerData;
      
      if (attacker.isDead) continue;
      
      const target = targets[0];
      const isBb = attacker.queuedBb;
      
      const result = await executeAttack(attacker, target, isPlayer, isBb, currentPlayer, currentEnemies);
      currentPlayer = result.player;
      currentEnemies = result.enemies;

      const enemyDead = currentEnemies.every(e => e.isDead);
      const playerDead = currentPlayer.every(p => p.isDead);
      
      if (enemyDead) {
        setTurnState('victory');
        addLog("Victory!");
        setTimeout(() => onEnd(true), 2000);
        return;
      }

      if (playerDead) {
        setTurnState('defeat');
        addLog("Defeat...");
        setTimeout(() => onEnd(false), 2000);
        return;
      }
    }

    setTurnState('player_input');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('https://cdn.jsdelivr.net/gh/Leem0nGames/gameassets@main/file_0000000071b471f5851dd21e1a9fc22e.png')] opacity-50 bg-cover bg-center" />

      {/* BB Cut-in Overlay */}
      <AnimatePresence>
        {bbCutInUnit && <BBCutIn unit={bbCutInUnit} />}
      </AnimatePresence>

      {/* BB Flash Overlay */}
      <AnimatePresence>
        {bbFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/40 z-40 pointer-events-none mix-blend-overlay" 
          />
        )}
      </AnimatePresence>

      {/* Top HUD */}
      <div className="relative z-10 p-2 flex justify-between items-start">
        <div className="bg-black/50 p-2 rounded text-xs font-mono">
          {combatLog.map((log, i) => (
            <div key={i} className="text-zinc-300">{log}</div>
          ))}
        </div>
      </div>

      {/* Battle Area */}
      <div className="flex-1 relative z-10 py-6 px-2 min-h-0">
        
        {/* Floating Damage Numbers */}
        {floatingDamages.map(fd => {
          const isEnemyTarget = enemyUnits.some(e => e.id === fd.targetId);
          return (
            <motion.div
              key={fd.id}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -50, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className={`absolute z-50 pointer-events-none font-black text-2xl ${
                fd.isHeal ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]' :
                fd.isWeakness ? 'text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]' :
                'text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]'
              } ${isEnemyTarget ? 'left-24' : 'right-24'}`}
            >
              {fd.isHeal ? '+' : '-'}{fd.damage}
            </motion.div>
          );
        })}

        {/* Enemies - Left side, staggered formation */}
        <div className="absolute left-4 top-1/4 flex flex-col gap-3">
          {enemyUnits.map((unit, idx) => (
            <motion.div
              key={unit.id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
              style={{ marginTop: idx % 2 === 1 ? '40px' : '0px' }}
            >
              <UnitSprite 
                unit={unit} 
                hitEffectElement={bbHitEffect?.targetId === unit.id ? bbHitEffect.element : null}
              />
            </motion.div>
          ))}
        </div>

        {/* Players - Right side, staggered formation */}
        <div className="absolute right-4 bottom-1/4 flex flex-col gap-3">
          {playerUnits.map((unit, idx) => (
            <motion.div
              key={unit.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="relative cursor-pointer"
              style={{ marginTop: idx % 2 === 1 ? '40px' : '0px' }}
              onClick={() => toggleBb(unit.id)}
            >
              <UnitSprite 
                unit={unit} 
                interactive={turnState === 'player_input'}
                hitEffectElement={bbHitEffect?.targetId === unit.id ? bbHitEffect.element : null}
              />
            </motion.div>
          ))}
        </div>

        {/* Side-scrolling battlefield ground effect */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50" />
      </div>

      {/* Controls - Unit Tray */}
      <div className="relative z-10 bg-zinc-900/95 border-t border-zinc-800 p-2 pb-safe">
        <div className="flex justify-center gap-2 overflow-x-auto pb-2">
          {playerUnits.map((unit, idx) => {
            const hpPercent = (unit.hp / unit.maxHp) * 100;
            const bbPercent = (unit.bbGauge / unit.maxBb) * 100;
            const isSelected = unit.queuedBb;
            const isDead = unit.isDead;
            
            return (
              <button
                key={unit.id}
                disabled={isDead || turnState !== 'player_input'}
                onClick={() => toggleBb(unit.id)}
                className={`relative flex flex-col items-center p-2 rounded-xl border-2 transition-all min-w-[70px] ${
                  isDead ? 'opacity-30 border-zinc-800 bg-zinc-900/50 cursor-not-allowed' :
                  isSelected ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.4)]' :
                  bbPercent >= 100 ? 'border-blue-400 bg-blue-400/10 hover:border-blue-300' :
                  'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                {/* Unit mini sprite */}
                <div className="w-10 h-10 mb-1 relative">
                  <img 
                    src={unit.template.spriteUrl} 
                    alt={unit.template.name}
                    className="w-full h-full object-contain drop-shadow-md"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {isDead && (
                    <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                      <span className="text-red-500 font-bold text-xs">X</span>
                    </div>
                  )}
                </div>
                
                {/* Element badge */}
                <div className={`text-[8px] font-bold px-1 rounded mb-1 ${
                  unit.template.element === 'Fire' ? 'bg-red-500/80 text-white' :
                  unit.template.element === 'Water' ? 'bg-blue-500/80 text-white' :
                  unit.template.element === 'Earth' ? 'bg-amber-600/80 text-white' :
                  unit.template.element === 'Thunder' ? 'bg-purple-500/80 text-white' :
                  unit.template.element === 'Light' ? 'bg-yellow-500/80 text-black' :
                  'bg-zinc-600/80 text-white'
                }`}>
                  {unit.template.element}
                </div>
                
                {/* HP Bar */}
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden mb-1">
                  <div 
                    className={`h-full transition-all ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
                
                {/* BB Gauge */}
                <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${bbPercent >= 100 ? 'bg-yellow-400 animate-pulse' : 'bg-blue-500'}`}
                    style={{ width: `${bbPercent}%` }}
                  />
                </div>
                
                {/* Ready indicator */}
                {bbPercent >= 100 && !isSelected && !isDead && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                )}
                
                {/* Leader indicator */}
                {idx === 0 && !isDead && (
                  <div className="absolute -top-1 -left-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">LDR</div>
                )}
              </button>
            );
          })}
          
          {/* Empty slots placeholder */}
          {playerUnits.length < 5 && Array.from({ length: 5 - playerUnits.length }).map((_, idx) => (
            <div key={`empty-${idx}`} className="flex items-center justify-center w-[70px] h-[90px] rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/30">
              <span className="text-zinc-600 text-xs">EMPTY</span>
            </div>
          ))}
        </div>
        
        {/* Action Button */}
        <div className="mt-2">
          {turnState === 'player_input' ? (
            <button 
              onClick={executeTurn}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-black text-lg tracking-widest shadow-[0_0_15px_rgba(79,70,229,0.5)] active:scale-95 transition-transform"
            >
              ⚔️ ATTACK
            </button>
          ) : turnState === 'victory' ? (
            <div className="w-full py-3 bg-yellow-500 text-black text-center rounded-xl font-black text-lg tracking-widest">
              ✨ STAGE CLEARED!
            </div>
          ) : turnState === 'defeat' ? (
            <div className="w-full py-3 bg-red-900 text-white text-center rounded-xl font-black text-lg tracking-widest">
              💀 GAME OVER
            </div>
          ) : (
            <div className="w-full py-3 bg-zinc-800 text-zinc-500 text-center rounded-xl font-bold tracking-widest">
              ⚡ EXECUTING...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
