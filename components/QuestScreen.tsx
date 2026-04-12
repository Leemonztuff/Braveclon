import { STAGES } from '@/lib/gameData';

export default function QuestScreen({ onStartBattle }: { onStartBattle: (stageId: number) => void }) {
  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-xl font-black italic text-zinc-100 mb-6 uppercase tracking-wider">Select Quest</h2>
      
      <div className="flex flex-col gap-4">
        {STAGES.map(stage => (
          <div key={stage.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
            <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700 flex justify-between items-center">
              <span className="font-bold text-sm text-zinc-300">{stage.name}</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">⚡ {stage.energy}</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-white">{stage.area}</h3>
                <p className="text-xs text-zinc-500 mt-1">{stage.description}</p>
              </div>
              <button 
                onClick={() => onStartBattle(stage.id)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                START
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
