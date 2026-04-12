import Image from 'next/image';

export default function HomeScreen({ onNavigate }: { onNavigate: (screen: any) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 drop-shadow-sm">
          BRAVE<br/>FRONTIER<br/>CLONE
        </h1>
        <p className="text-zinc-400 text-sm">Tactical RPG MVP</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-8">
        <MenuButton 
          title="Quest" 
          subtitle="Story Mode" 
          color="from-blue-500 to-cyan-600"
          onClick={() => onNavigate('quest')}
        />
        <MenuButton 
          title="Units" 
          subtitle="Manage Team" 
          color="from-emerald-500 to-green-600"
          onClick={() => onNavigate('units')}
        />
        <MenuButton 
          title="Summon" 
          subtitle="Get Heroes" 
          color="from-purple-500 to-pink-600"
          onClick={() => onNavigate('summon')}
        />
        <MenuButton 
          title="Arena" 
          subtitle="Coming Soon" 
          color="from-zinc-600 to-zinc-700"
          onClick={() => {}}
          disabled
        />
        
        <div className="col-span-2">
          <MenuButton 
            title="QR Hunt" 
            subtitle="Scan Codes for Loot!" 
            color="from-emerald-400 to-teal-600"
            onClick={() => onNavigate('qrhunt')}
          />
        </div>
      </div>
    </div>
  );
}

function MenuButton({ title, subtitle, color, onClick, disabled }: { title: string, subtitle: string, color: string, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-2xl p-4 text-left transition-transform active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90`} />
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide">{title}</h3>
        <p className="text-xs text-white/80 font-medium">{subtitle}</p>
      </div>
    </button>
  );
}
