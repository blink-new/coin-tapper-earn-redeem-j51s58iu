import { useState, useCallback } from 'react'
import { Coins } from 'lucide-react'

interface TapToEarnProps {
  coins: number
  onCoinsUpdate: (newCoins: number) => void
}

interface FloatingCoin {
  id: number
  x: number
  y: number
}

export function TapToEarn({ coins, onCoinsUpdate }: TapToEarnProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([])
  const [pulseRings, setPulseRings] = useState<number[]>([])

  const handleTap = useCallback(() => {
    // Update coins
    const newCoins = coins + 100
    onCoinsUpdate(newCoins)

    // Button press animation
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)

    // Create floating coins
    const newFloatingCoins: FloatingCoin[] = []
    for (let i = 0; i < 5; i++) {
      newFloatingCoins.push({
        id: Date.now() + i,
        x: Math.random() * 200 - 100, // Random position around button
        y: Math.random() * 50 - 25
      })
    }
    setFloatingCoins(prev => [...prev, ...newFloatingCoins])

    // Create pulse ring
    const ringId = Date.now()
    setPulseRings(prev => [...prev, ringId])

    // Clean up floating coins after animation
    setTimeout(() => {
      setFloatingCoins(prev => prev.filter(coin => !newFloatingCoins.some(nc => nc.id === coin.id)))
    }, 1000)

    // Clean up pulse ring after animation
    setTimeout(() => {
      setPulseRings(prev => prev.filter(id => id !== ringId))
    }, 600)

    // Haptic feedback (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, [coins, onCoinsUpdate])

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] relative">
      {/* Floating Coins */}
      {floatingCoins.map((coin) => (
        <div
          key={coin.id}
          className="absolute pointer-events-none floating-coin"
          style={{
            left: `calc(50% + ${coin.x}px)`,
            top: `calc(50% + ${coin.y}px)`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
            <Coins className="w-5 h-5" />
            <span>+100</span>
          </div>
        </div>
      ))}

      {/* Pulse Rings */}
      {pulseRings.map((ringId) => (
        <div
          key={ringId}
          className="absolute pointer-events-none pulse-ring border-4 border-yellow-400 rounded-full"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px'
          }}
        />
      ))}

      {/* Main Tap Button */}
      <div className="relative">
        <button
          onClick={handleTap}
          className={`
            w-48 h-48 rounded-full tap-button text-slate-900 font-bold text-xl
            transition-all duration-150 ease-out
            hover:scale-105 active:scale-95
            flex items-center justify-center gap-3
            ${isPressed ? 'scale-95' : ''}
          `}
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            boxShadow: isPressed 
              ? '0 4px 16px rgba(255, 215, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2)'
              : '0 8px 32px rgba(255, 215, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Coins className="w-12 h-12" />
          <div className="text-center">
            <div className="text-2xl font-bold">TAP</div>
            <div className="text-sm opacity-80">+100 coins</div>
          </div>
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center">
        <p className="text-slate-300 text-lg mb-2">
          Tap the coin to earn <span className="text-yellow-400 font-semibold">100 coins</span> each time!
        </p>
        <p className="text-slate-400 text-sm">
          Collect coins to redeem for PayPal cash
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {coins.toLocaleString()}
          </div>
          <div className="text-slate-300 text-sm">Total Coins Earned</div>
        </div>
      </div>
    </div>
  )
}