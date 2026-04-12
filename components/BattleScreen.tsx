import { useState, useEffect } from 'react';
import { PlayerState, calculateStats } from '@/lib/gameState';
import { UNIT_DATABASE, ENEMIES, STAGES, UnitTemplate, getElementMultiplier } from '@/lib/gameData';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '@/lib/audio';
import { BattleUnit } from '@/lib/battleTypes';
import { BBCutIn } from './BBCutIn';
import { UnitSprite } from './UnitSprite';

export default function BattleScreen({ state, stageId, onEnd }: { state: PlayerState, stageId: number, onEnd: (victory: boolean) => void }) {
  const [playerUnits, setPlayerUnits] = useState<BattleUnit[]>(() => {
    return state.team
      .filter(id => id !== null)
      .map((instanceId, idx) => {
        const inst = state.inventory.find(u => u.instanceId === instanceId)!;
        const template = UNIT_DATABASE[inst.templateId];
        const stats = calculateStats(template, inst.level, inst.equipment, state.equipmentInventory);
        return {
          id: `p_${idx}`,
          template,
          isPlayer: true,
          hp: stats.hp,
          maxHp: stats.hp,
          atk: stats.atk,
          def: stats.def,
          bbGauge: 0,
          maxBb: template.skill.cost,
          isDead: false,
          queuedBb: false,
          actionState: 'idle'
        };
      });
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
        bbGauge: 0,
        maxBb: 100,
        isDead: false,
        queuedBb: false,
        actionState: 'idle'
      };
    });
  });

  const [turnState, setTurnState] = useState<'player_input' | 'player_executing' | 'enemy_executing' | 'victory' | 'defeat'>('player_input');
  const [combatLog, setCombatLog] = useState<string[]>(['Battle Started!']);
  const [bbFlash, setBbFlash] = useState(false);
  const [bbCutInUnit, setBbCutInUnit] = useState<BattleUnit | null>(null);
  const [bbHitEffect, setBbHitEffect] = useState<{ targetId: string, element: string } | null>(null);

  const addLog = (msg: string) => {
    setCombatLog(prev => [...prev.slice(-4), msg]);
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

  const executeTurn = async () => {
    if (turnState !== 'player_input') return;
    setTurnState('player_executing');
    
    let currentEnemies = [...enemyUnits];
    let currentPlayer = [...playerUnits];

    // Player attacks
    for (let i = 0; i < currentPlayer.length; i++) {
      const attacker = currentPlayer[i];
      if (attacker.isDead) continue;

      // Find alive enemy
      const targetIdx = currentEnemies.findIndex(e => !e.isDead);
      if (targetIdx === -1) break; // All enemies dead
      const target = currentEnemies[targetIdx];

      // Calculate damage
      const isBb = attacker.queuedBb;
      const powerMultiplier = isBb ? attacker.template.skill.power : 1.0;
      const elementMultiplier = getElementMultiplier(attacker.template.element, target.template.element);
      const isWeakness = elementMultiplier > 1.0;
      
      let rawDamage = Math.max(1, (attacker.atk * powerMultiplier) - (target.def * 0.5));
      let finalDamage = Math.floor(rawDamage * elementMultiplier);

      // ANIMATION: Attacker moves
      currentPlayer[i] = { ...attacker, actionState: isBb ? 'skill' : 'attacking' };
      setPlayerUnits([...currentPlayer]);
      
      if (isBb) {
        setBbCutInUnit(attacker);
        playSound('bb_cast');
        await new Promise(r => setTimeout(r, 1500)); // Wait for cut-in
        setBbCutInUnit(null);
        setBbFlash(true);
        setTimeout(() => setBbFlash(false), 150);
        await new Promise(r => setTimeout(r, 200));
      } else {
        await new Promise(r => setTimeout(r, 200));
      }

      // Apply damage & ANIMATION: Target hurt
      currentEnemies[targetIdx] = {
        ...target,
        hp: Math.max(0, target.hp - finalDamage),
        isDead: target.hp - finalDamage <= 0,
        actionState: isBb ? 'bb_hurt' : 'hurt',
        isWeaknessHit: isWeakness
      };
      setEnemyUnits([...currentEnemies]);

      if (isBb) {
        setBbHitEffect({ targetId: target.id, element: attacker.template.element });
        playSound('bb_hit');
        if (isWeakness) setTimeout(() => playSound('weakness'), 100);
        setTimeout(() => setBbHitEffect(null), 800);
      } else {
        if (isWeakness) {
          playSound('weakness');
        } else {
          playSound('hit');
        }
      }

      addLog(`${attacker.template.name} ${isBb ? 'uses BB!' : 'attacks'} ${target.template.name} for ${finalDamage} dmg! ${isWeakness ? '(Weakness!)' : ''}`);
      
      await new Promise(r => setTimeout(r, 400));

      // Reset states
      currentPlayer[i] = {
        ...currentPlayer[i],
        queuedBb: false,
        bbGauge: isBb ? 0 : Math.min(attacker.maxBb, attacker.bbGauge + 5), // Gain BB on attack
        actionState: 'idle'
      };
      currentEnemies[targetIdx] = {
        ...currentEnemies[targetIdx],
        actionState: currentEnemies[targetIdx].isDead ? 'dead' : 'idle',
        isWeaknessHit: false
      };
      setPlayerUnits([...currentPlayer]);
      setEnemyUnits([...currentEnemies]);
      
      // Small delay between attacks
      await new Promise(r => setTimeout(r, 100));
    }

    // Check win condition
    if (currentEnemies.every(e => e.isDead)) {
      setTurnState('victory');
      addLog("Victory!");
      setTimeout(() => onEnd(true), 2000);
      return;
    }

    setTurnState('enemy_executing');

    // Enemy attacks
    for (let i = 0; i < currentEnemies.length; i++) {
      const attacker = currentEnemies[i];
      if (attacker.isDead) continue;

      // Find alive player
      const targetIdx = currentPlayer.findIndex(p => !p.isDead);
      if (targetIdx === -1) break; // All players dead
      const target = currentPlayer[targetIdx];

      const elementMultiplier = getElementMultiplier(attacker.template.element, target.template.element);
      const isWeakness = elementMultiplier > 1.0;
      let rawDamage = Math.max(1, attacker.atk - (target.def * 0.5));
      let finalDamage = Math.floor(rawDamage * elementMultiplier);

      // ANIMATION: Attacker moves
      currentEnemies[i] = { ...attacker, actionState: 'attacking' };
      setEnemyUnits([...currentEnemies]);
      await new Promise(r => setTimeout(r, 200));

      // Apply damage & ANIMATION: Target hurt
      currentPlayer[targetIdx] = {
        ...target,
        hp: Math.max(0, target.hp - finalDamage),
        isDead: target.hp - finalDamage <= 0,
        bbGauge: Math.min(target.maxBb, target.bbGauge + 2), // Gain BB on taking damage
        actionState: 'hurt',
        isWeaknessHit: isWeakness
      };
      setPlayerUnits([...currentPlayer]);

      if (isWeakness) {
        playSound('weakness');
      } else {
        playSound('hit');
      }
      addLog(`${attacker.template.name} attacks ${target.template.name} for ${finalDamage} dmg! ${isWeakness ? '(Weakness!)' : ''}`);
      
      await new Promise(r => setTimeout(r, 400));

      // Reset states
      currentEnemies[i] = {
        ...currentEnemies[i],
        actionState: 'idle'
      };
      currentPlayer[targetIdx] = {
        ...currentPlayer[targetIdx],
        actionState: currentPlayer[targetIdx].isDead ? 'dead' : 'idle',
        isWeaknessHit: false
      };
      setEnemyUnits([...currentEnemies]);
      setPlayerUnits([...currentPlayer]);

      await new Promise(r => setTimeout(r, 100));
    }

    // Check lose condition
    if (currentPlayer.every(p => p.isDead)) {
      setTurnState('defeat');
      addLog("Defeat...");
      setTimeout(() => onEnd(false), 2000);
      return;
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
      <div className="flex-1 relative z-10 flex flex-col justify-between py-6 px-2">
        
        {/* Enemies */}
        <div className="flex justify-center gap-4 flex-wrap max-w-[300px] mx-auto">
          {enemyUnits.map(unit => (
            <div key={unit.id} className="flex justify-center w-[72px]">
              <UnitSprite 
                unit={unit} 
                hitEffectElement={bbHitEffect?.targetId === unit.id ? bbHitEffect.element : null}
              />
            </div>
          ))}
        </div>

        {/* Players */}
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-8 mt-auto max-w-[280px] mx-auto">
          {playerUnits.map((unit) => (
            <div key={unit.id} className="flex justify-center w-[72px]">
              <UnitSprite 
                unit={unit} 
                onClick={() => toggleBb(unit.id)} 
                interactive={turnState === 'player_input'}
                hitEffectElement={bbHitEffect?.targetId === unit.id ? bbHitEffect.element : null}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 bg-zinc-900/90 border-t border-zinc-800 p-4 pb-safe">
        {turnState === 'player_input' ? (
          <button 
            onClick={executeTurn}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-black text-xl tracking-widest shadow-[0_0_15px_rgba(79,70,229,0.5)] active:scale-95 transition-transform"
          >
            FIGHT
          </button>
        ) : turnState === 'victory' ? (
          <div className="w-full py-4 bg-yellow-500 text-black text-center rounded-xl font-black text-xl tracking-widest">
            STAGE CLEARED!
          </div>
        ) : turnState === 'defeat' ? (
          <div className="w-full py-4 bg-red-900 text-white text-center rounded-xl font-black text-xl tracking-widest">
            GAME OVER
          </div>
        ) : (
          <div className="w-full py-4 bg-zinc-800 text-zinc-500 text-center rounded-xl font-bold tracking-widest">
            EXECUTING TURN...
          </div>
        )}
      </div>
    </div>
  );
}
