import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ArrowLeft, QrCode, Sparkles, AlertCircle } from 'lucide-react';
import { PlayerState } from '@/lib/gameState';
import { UNIT_DATABASE } from '@/lib/gameData';
import { motion, AnimatePresence } from 'motion/react';

interface QRHuntScreenProps {
  state: PlayerState;
  onBack: () => void;
  onScan: (data: string) => { success: boolean; message: string; rewardType?: string; rewardValue?: any };
}

export default function QRHuntScreen({ state, onBack, onScan }: QRHuntScreenProps) {
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; rewardType?: string; rewardValue?: any } | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = (text: string) => {
    if (!isScanning) return;
    setIsScanning(false);
    
    const result = onScan(text);
    setScanResult(result);
  };

  const handleContinue = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  const scansLeft = Math.max(0, 5 - (state.qrState?.scansToday || 0));

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white relative">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-zinc-800 bg-zinc-900/50">
        <button onClick={onBack} className="p-2 mr-2 bg-zinc-800 rounded-full active:scale-95 transition-transform">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            QR HUNT
          </h1>
          <p className="text-xs text-zinc-400">Scan real-world codes for loot!</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-emerald-400">{scansLeft} / 5</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Scans Left</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        
        {scansLeft === 0 && !scanResult ? (
          <div className="text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800 max-w-sm">
            <AlertCircle className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Daily Limit Reached</h2>
            <p className="text-zinc-400 text-sm">You have used all 5 of your QR scans for today. Come back tomorrow for more loot!</p>
          </div>
        ) : (
          <>
            {/* Scanner View */}
            <div className={`w-full max-w-sm aspect-square rounded-3xl overflow-hidden border-4 ${isScanning ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-zinc-800'} relative transition-all duration-500`}>
              {isScanning ? (
                <Scanner 
                  onScan={(result) => handleScan(result[0].rawValue)}
                  components={{
                    onOff: true,
                    torch: true,
                    zoom: true,
                    finder: true,
                  }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-zinc-700" />
                </div>
              )}
              
              {/* Scanning Overlay Animation */}
              {isScanning && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent h-1/2"
                  animate={{ y: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
              )}
            </div>

            <p className="mt-8 text-center text-zinc-400 text-sm max-w-xs">
              {isScanning ? "Point your camera at any QR code (posters, menus, screens) to extract its hidden energy." : "Processing QR signature..."}
            </p>
          </>
        )}

        {/* Reward Modal */}
        <AnimatePresence>
          {scanResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            >
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
                
                {scanResult.success ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 relative">
                      <Sparkles className="w-10 h-10 text-emerald-400" />
                      <motion.div 
                        className="absolute inset-0 border-2 border-emerald-400 rounded-full"
                        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">Loot Found!</h2>
                    <p className="text-emerald-400 font-bold text-lg mb-6">{scanResult.message}</p>
                    
                    {/* Visual representation of reward */}
                    {scanResult.rewardType === 'unit' && scanResult.rewardValue && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-yellow-400 mb-6 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                        <img src={UNIT_DATABASE[scanResult.rewardValue].spriteUrl} alt="Unit" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">Scan Failed</h2>
                    <p className="text-red-400 font-bold mb-6">{scanResult.message}</p>
                  </>
                )}

                <button 
                  onClick={handleContinue}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold tracking-wider transition-colors"
                >
                  CONTINUE
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
