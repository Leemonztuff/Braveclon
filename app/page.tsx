'use client';

import { useState } from 'react';
import { useGameState } from '@/lib/gameState';
import { Home, Users, Sparkles, Swords, AlertCircle } from 'lucide-react';
import HomeScreen from '@/components/HomeScreen';
import SummonScreen from '@/components/SummonScreen';
import UnitsScreen from '@/components/UnitsScreen';
import QuestScreen from '@/components/QuestScreen';
import BattleScreen from '@/components/BattleScreen';
import QRHuntScreen from '@/components/QRHuntScreen';
import FusionScreen from '@/components/FusionScreen';
import { STAGES } from '@/lib/gameData';

type Screen = 'home' | 'units' | 'summon' | 'quest' | 'battle' | 'qrhunt' | 'fusion';

export default function GameApp() {
  const { state, isLoaded, timeToNextEnergy, addUnit, setTeamMember, spendGems, spendEnergy, processQrScan, rollGacha, equipItem, unequipItem, winBattle, fuseUnits } = useGameState();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [battleStage, setBattleStage] = useState<number | null>(null);
  const [fusionTargetId, setFusionTargetId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [battleRewards, setBattleRewards] = useState<any>(null);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">Loading...</div>;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const startBattle = (stageId: number) => {
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) return;

    if (spendEnergy(stage.energy)) {
      setBattleStage(stageId);
      setCurrentScreen('battle');
    } else {
      setAlertMessage(`Not enough energy! You need ${stage.energy} ⚡ to start this quest.`);
    }
  };

  const endBattle = (victory: boolean) => {
    setCurrentScreen('home');
    if (victory && battleStage !== null) {
      const rewards = winBattle(battleStage);
      setBattleRewards(rewards);
    }
    setBattleStage(null);
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-zinc-950 text-zinc-100 sm:items-center sm:justify-center">
      {/* Mobile container constraint for desktop viewing */}
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-zinc-900 sm:h-[844px] sm:w-[390px] sm:rounded-[40px] sm:border-[8px] sm:border-zinc-800 sm:shadow-2xl">
        
        {/* Top Bar (Header) */}
        {currentScreen !== 'battle' && (
          <header className="flex items-center justify-between bg-zinc-950 px-4 py-3 shadow-md z-10">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Player Lv.{state.level}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-medium text-emerald-400">
                  <span>⚡</span>
                  <span>{state.energy}/{state.maxEnergy}</span>
                </div>
                {state.energy < state.maxEnergy && (
                  <span className="text-[10px] text-emerald-500/80 font-mono">
                    +{formatTime(timeToNextEnergy)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm font-medium text-yellow-400">
                <span>💰</span>
                <span>{state.zel.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-pink-400">
                <span>💎</span>
                <span>{state.gems}</span>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {currentScreen === 'home' && <HomeScreen onNavigate={setCurrentScreen} />}
          {currentScreen === 'units' && <UnitsScreen state={state} setTeamMember={setTeamMember} equipItem={equipItem} unequipItem={unequipItem} onNavigateToFusion={(id) => { setFusionTargetId(id); setCurrentScreen('fusion'); }} />}
          {currentScreen === 'summon' && <SummonScreen state={state} spendGems={spendGems} addUnit={addUnit} rollGacha={rollGacha} onAlert={setAlertMessage} />}
          {currentScreen === 'quest' && <QuestScreen onStartBattle={startBattle} />}
          {currentScreen === 'battle' && <BattleScreen state={state} stageId={battleStage!} onEnd={endBattle} />}
          {currentScreen === 'qrhunt' && <QRHuntScreen state={state} onBack={() => setCurrentScreen('home')} onScan={processQrScan} />}
          {currentScreen === 'fusion' && fusionTargetId && <FusionScreen state={state} targetInstanceId={fusionTargetId} onBack={() => setCurrentScreen('units')} fuseUnits={fuseUnits} onAlert={setAlertMessage} />}
        </main>

        {/* Bottom Navigation Bar */}
        {currentScreen !== 'battle' && (
          <nav className="flex justify-around bg-zinc-950 pb-safe pt-2 border-t border-zinc-800 z-10">
            <NavButton 
              icon={<Home size={24} />} 
              label="Home" 
              isActive={currentScreen === 'home'} 
              onClick={() => setCurrentScreen('home')} 
            />
            <NavButton 
              icon={<Users size={24} />} 
              label="Units" 
              isActive={currentScreen === 'units'} 
              onClick={() => setCurrentScreen('units')} 
            />
            <NavButton 
              icon={<Swords size={24} />} 
              label="Quest" 
              isActive={currentScreen === 'quest'} 
              onClick={() => setCurrentScreen('quest')} 
            />
            <NavButton 
              icon={<Sparkles size={24} />} 
              label="Summon" 
              isActive={currentScreen === 'summon'} 
              onClick={() => setCurrentScreen('summon')} 
            />
          </nav>
        )}

        {/* Global Alert Modal */}
        {alertMessage && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wider">Notice</h2>
              <p className="text-zinc-300 font-medium mb-6">{alertMessage}</p>
              <button 
                onClick={() => setAlertMessage(null)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold tracking-wider transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
        {/* Battle Rewards Modal */}
        {battleRewards && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
              <h2 className="text-2xl font-black text-yellow-400 mb-6 uppercase tracking-wider">Quest Cleared!</h2>
              
              <div className="flex gap-6 mb-6">
                <div className="flex flex-col items-center">
                  <span className="text-3xl mb-1">💰</span>
                  <span className="text-yellow-400 font-bold">+{battleRewards.zel} Zel</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl mb-1">✨</span>
                  <span className="text-blue-400 font-bold">+{battleRewards.exp} EXP</span>
                </div>
              </div>

              {battleRewards.playerLeveledUp && (
                <div className="w-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold py-2 px-4 rounded-xl mb-4 animate-pulse">
                  Player Leveled Up! Energy Refilled!
                </div>
              )}

              {battleRewards.leveledUpUnits && battleRewards.leveledUpUnits.length > 0 && (
                <div className="w-full bg-zinc-800 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-bold text-zinc-400 mb-2 uppercase">Units Leveled Up</h3>
                  <div className="flex flex-col gap-2">
                    {battleRewards.leveledUpUnits.map((u: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm font-bold">
                        <span className="text-white">{u.name}</span>
                        <span className="text-emerald-400">Lv.{u.oldLevel} ➔ Lv.{u.newLevel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setBattleRewards(null)}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-black tracking-wider transition-colors text-lg"
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

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-14 transition-colors ${
        isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {icon}
      <span className="text-[10px] mt-1 font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
