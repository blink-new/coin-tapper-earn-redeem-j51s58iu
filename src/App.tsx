import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { TapToEarn } from './components/TapToEarn'
import { RedeemCoins } from './components/RedeemCoins'
import { WithdrawalHistory } from './components/WithdrawalHistory'
import { Toaster } from './components/ui/toaster'
import { Coins, Gift, History } from 'lucide-react'

interface UserStats {
  id: string
  userId: string
  totalCoins: number
  totalWithdrawn: number
  createdAt: string
  updatedAt: string
}

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadUserStats = useCallback(async () => {
    if (!user?.id) return

    try {
      const stats = await blink.db.userStats.list({
        where: { userId: user.id },
        limit: 1
      })

      if (stats.length === 0) {
        // Create initial stats for new user
        const newStats = await blink.db.userStats.create({
          userId: user.id,
          totalCoins: 0,
          totalWithdrawn: 0.0
        })
        setUserStats(newStats)
      } else {
        setUserStats(stats[0])
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadUserStats()
    }
  }, [user?.id, loadUserStats])

  const updateCoins = async (newCoinCount: number) => {
    if (!user?.id || !userStats) return

    try {
      const updatedStats = await blink.db.userStats.update(userStats.id, {
        totalCoins: newCoinCount,
        updatedAt: new Date().toISOString()
      })
      setUserStats({ ...userStats, totalCoins: newCoinCount })
    } catch (error) {
      console.error('Error updating coins:', error)
    }
  }

  const updateWithdrawal = async (amount: number, coinsSpent: number, paypalEmail: string) => {
    if (!user?.id || !userStats) return false

    try {
      // DEMO MODE: Simulate successful PayPal payout
      // In a real app, this would call PayPal's API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API delay

      // Create withdrawal record
      await blink.db.withdrawals.create({
        userId: user.id,
        amount,
        coinsSpent,
        paypalEmail,
        status: 'completed',
        batchId: `DEMO_${Date.now()}`, // Demo batch ID
        createdAt: new Date().toISOString()
      })

      // Update user stats
      const newCoinCount = userStats.totalCoins - coinsSpent
      const newTotalWithdrawn = userStats.totalWithdrawn + amount

      await blink.db.userStats.update(userStats.id, {
        totalCoins: newCoinCount,
        totalWithdrawn: newTotalWithdrawn,
        updatedAt: new Date().toISOString()
      })

      setUserStats({
        ...userStats,
        totalCoins: newCoinCount,
        totalWithdrawn: newTotalWithdrawn
      })

      return true
    } catch (error) {
      console.error('Error processing withdrawal:', error)
      return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-yellow-400 text-lg font-semibold">Loading Coin Tapper...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 coin-glow">
            <Coins className="w-12 h-12 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">Coin Tapper</h1>
          <p className="text-slate-300 mb-6">Tap to earn coins and redeem for PayPal cash!</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-8 py-3 rounded-xl font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 transform hover:scale-105"
          >
            Sign In to Start Earning
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-400 mb-2">Coin Tapper</h1>
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-xl font-semibold text-yellow-400">
              {userStats?.totalCoins?.toLocaleString() || 0}
            </span>
            <span>coins</span>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tap" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
            <TabsTrigger value="tap" className="flex items-center gap-2 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Tap</span>
            </TabsTrigger>
            <TabsTrigger value="redeem" className="flex items-center gap-2 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Redeem</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tap" className="mt-6">
            <TapToEarn 
              coins={userStats?.totalCoins || 0} 
              onCoinsUpdate={updateCoins}
            />
          </TabsContent>

          <TabsContent value="redeem" className="mt-6">
            <RedeemCoins 
              coins={userStats?.totalCoins || 0}
              onWithdrawal={updateWithdrawal}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <WithdrawalHistory 
              totalWithdrawn={userStats?.totalWithdrawn || 0}
              userId={user.id}
            />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}

export default App