'use client';

import { useState } from 'react';
import { useGameState } from '@/lib/gameState';
import { Home, Users, Sparkles, Swords, QrCode, Wand2, X } from 'lucide-react';
import HomeScreen from '@/components/HomeScreen';
import SummonScreen from '@/components/SummonScreen';
import UnitsScreen from '@/components/UnitsScreen';
import QuestScreen from '@/components/QuestScreen';
import BattleScreen from '@/components/BattleScreen';
import QRHuntScreen from '@/components/QRHuntScreen';
import FusionScreen from '@/components/FusionScreen';
import { STAGES } from '@/lib/gameData';

type Screen = 'home' | 'units' | 'summon' | 'quest' | 'battle' | 'qrhunt' | 'fusion';

const TAB_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'quest', label: 'Quest', icon: Swords },
  { id: 'summon', label: 'Summon', icon: Sparkles },
  { id: 'units', label: 'Units', icon: Users },
  { id: 'qrhunt', label: 'QR', icon: QrCode },
] as const;

export default function GameApp() {
  const { state, isLoaded, timeToNextEnergy, addUnit, setTeamMember, spendGems, spendEnergy, processQrScan, rollGacha, rollGachaMulti, equipItem, unequipItem, winBattle, fuseUnits } = useGameState();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [battleStage, setBattleStage] = useState<number | null>(null);
  const [fusionTargetId, setFusionTargetId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [battleRewards, setBattleRewards] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="animate-spin mb-4">⚔️</div>
          <p>Loading Game...</p>
        </div>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 50,
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const startBattle = (stageId: number) => {
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) return;

    if (spendEnergy(stage.energy)) {
      triggerHaptic('medium');
      setBattleStage(stageId);
      setCurrentScreen('battle');
    } else {
      triggerHaptic('light');
      setAlertMessage(`Not enough energy! You need ${stage.energy} ⚡ to start this quest.`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const endBattle = (victory: boolean) => {
    if (victory) {
      triggerHaptic('heavy');
      if (battleStage !== null) {
        const rewards = winBattle(battleStage);
        setBattleRewards(rewards);
      }
    }
    setCurrentScreen('home');
    setBattleStage(null);
  };

  const handleNavigation = (screen: Screen) => {
    if (screen === 'qrhunt') {
      triggerHaptic('light');
    }
    setCurrentScreen(screen);
  };

  const playerTeam = state.team
    .map(id => state.inventory.find(u => u.instanceId === id!))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-zinc-950 text-zinc-100">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 safe-area">
        {currentScreen !== 'battle' && (
          <div className="flex items-center justify-between bg-zinc-950/80 backdrop-blur-sm px-4 py-3 border-b border-zinc-800/50 z-40">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Lv. {state.level}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {state.energy}/{state.maxEnergy}
                  </span>
                </div>
                {state.energy < state.maxEnergy && (
                  <span className="text-xs text-emerald-500/70 font-mono">
                    {formatTime(timeToNextEnergy)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-zinc-500 uppercase tracking-wider">💎</div>
                <div className="text-sm font-bold text-yellow-400">{state.gems}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-zinc-500 uppercase tracking-wider">🪙</div>
                <div className="text-sm font-bold text-amber-500">{state.zel}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full h-full animate-fadeIn">
            {currentScreen === 'home' && <HomeScreen onNavigate={handleNavigation} />}
            {currentScreen === 'units' && (
              <UnitsScreen
                state={state}
                setTeamMember={setTeamMember}
                equipItem={equipItem}
                unequipItem={unequipItem}
                onNavigateToFusion={() => setCurrentScreen('fusion')}
              />
            )}
            {currentScreen === 'summon' && (
              <SummonScreen 
                state={state}
                spendGems={spendGems} 
                addUnit={addUnit}
                rollGacha={rollGacha}
                rollGachaMulti={rollGachaMulti}
                onAlert={(msg) => setAlertMessage(msg)}
              />
            )}
            {currentScreen === 'quest' && <QuestScreen onStartBattle={startBattle} />}
            {currentScreen === 'qrhunt' && (
              <QRHuntScreen scansToday={state.qrState.scansToday} onScan={processQrScan} />
            )}
            {currentScreen === 'fusion' && fusionTargetId && (
              <FusionScreen
                targetUnit={state.inventory.find(u => u.instanceId === fusionTargetId)!}
                inventory={state.inventory}
                onFuse={fuseUnits}
                onClose={() => {
                  setFusionTargetId(null);
                  setCurrentScreen('units');
                }}
              />
            )}
            {currentScreen === 'battle' && battleStage !== null && (
              <BattleScreen
                state={state}
                stageId={battleStage}
                onEnd={endBattle}
              />
            )}
          </div>
        </div>

        {currentScreen !== 'battle' && (
          <nav className="bg-zinc-950 border-t border-zinc-800/50 safe-area-bottom">
            <div className="grid grid-cols-5 gap-0">
              {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNavigation(id as Screen)}
                  className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
                    currentScreen === id
                      ? 'bg-gradient-to-t from-zinc-800/50 to-transparent text-amber-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  aria-label={label}
                  aria-current={currentScreen === id ? 'page' : undefined}
                >
                  <Icon size={24} className="mb-1" />
                  <span className="text-xs font-semibold tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}

        {showAlert && alertMessage && (
          <div className="fixed top-20 left-4 right-4 bg-red-950/90 backdrop-blur border border-red-800/50 rounded-lg p-3 shadow-lg animate-slideDown z-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-100">{alertMessage}</p>
              </div>
              <button onClick={() => setShowAlert(false)} className="ml-auto text-red-200 hover:text-red-100">
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {battleRewards && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-w-lg w-full rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
              <h2 className="text-xl font-black text-amber-300 mb-4">Battle Results</h2>
              <div className="space-y-3 mb-6">
                <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400">Zel earned</p>
                  <p className="text-3xl font-black text-emerald-400">+{battleRewards.zel}</p>
                </div>
                <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400">EXP gained</p>
                  <p className="text-3xl font-black text-sky-400">+{battleRewards.exp}</p>
                </div>
                {battleRewards.playerLeveledUp && (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-emerald-200">
                    Player leveled up! Energy refilled.
                  </div>
                )}
                {battleRewards.leveledUpUnits && battleRewards.leveledUpUnits.length > 0 && (
                  <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4">
                    <h3 className="text-sm font-bold text-zinc-300 uppercase mb-3">Units Leveled Up</h3>
                    <div className="space-y-2">
                      {battleRewards.leveledUpUnits.map((u: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm text-zinc-200">
                          <span>{u.name}</span>
                          <span className="text-emerald-400">Lv.{u.oldLevel} → Lv.{u.newLevel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setBattleRewards(null)}
                className="w-full rounded-2xl bg-amber-400 py-3 text-black font-black hover:bg-amber-300 transition-colors"
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
