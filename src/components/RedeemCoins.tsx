import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Progress } from './ui/progress'
import { Coins, DollarSign, Mail, CheckCircle } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface RedeemCoinsProps {
  coins: number
  onWithdrawal: (amount: number, coinsSpent: number, paypalEmail: string) => Promise<boolean>
}

interface RedeemTier {
  coins: number
  amount: number
  label: string
  popular?: boolean
}

const redeemTiers: RedeemTier[] = [
  { coins: 5000, amount: 1, label: '$1' },
  { coins: 10000, amount: 5, label: '$5', popular: true },
  { coins: 100000, amount: 20, label: '$20' },
  { coins: 1000000, amount: 100, label: '$100' }
]

export function RedeemCoins({ coins, onWithdrawal }: RedeemCoinsProps) {
  const [selectedTier, setSelectedTier] = useState<RedeemTier | null>(null)
  const [paypalEmail, setPaypalEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleRedeem = async () => {
    if (!selectedTier || !paypalEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your PayPal email address.",
        variant: "destructive"
      })
      return
    }

    if (coins < selectedTier.coins) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${selectedTier.coins.toLocaleString()} coins to redeem ${selectedTier.label}.`,
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)

    // Show processing toast
    toast({
      title: "Processing Withdrawal...",
      description: `Sending ${selectedTier.label} to ${paypalEmail}`,
    })

    try {
      const success = await onWithdrawal(selectedTier.amount, selectedTier.coins, paypalEmail)
      
      if (success) {
        toast({
          title: "🎉 Withdrawal Successful!",
          description: `${selectedTier.label} demo payout completed! Check your withdrawal history.`,
        })
        setIsDialogOpen(false)
        setPaypalEmail('')
        setSelectedTier(null)
      } else {
        toast({
          title: "Withdrawal Failed",
          description: "Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getProgressPercentage = (tierCoins: number) => {
    return Math.min((coins / tierCoins) * 100, 100)
  }

  const canAfford = (tierCoins: number) => {
    return coins >= tierCoins
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Redeem Coins</h2>
        <p className="text-slate-300">Exchange your coins for PayPal cash</p>
        <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-4 mt-3 animate-pulse">
          <p className="text-blue-400 text-sm font-bold flex items-center justify-center gap-2">
            🎮 Demo Mode Active
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">SIMULATION</span>
          </p>
          <p className="text-blue-300 text-xs mt-1">This is a portfolio demo - withdrawals are simulated, no real money is sent</p>
        </div>
      </div>

      <div className="grid gap-4">
        {redeemTiers.map((tier) => {
          const progress = getProgressPercentage(tier.coins)
          const affordable = canAfford(tier.coins)
          
          return (
            <Card 
              key={tier.coins} 
              className={`
                relative border-2 transition-all duration-200 hover:scale-[1.02]
                ${affordable 
                  ? 'border-yellow-400 bg-slate-800/50' 
                  : 'border-slate-700 bg-slate-800/30'
                }
                ${tier.popular ? 'ring-2 ring-orange-500 ring-opacity-50' : ''}
              `}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    POPULAR
                  </span>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${affordable ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-slate-400'}
                    `}>
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className={`text-xl ${affordable ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {tier.label}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {tier.coins.toLocaleString()} coins
                      </CardDescription>
                    </div>
                  </div>
                  
                  {affordable && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Progress</span>
                    <span className={affordable ? 'text-green-400' : 'text-slate-400'}>
                      {coins.toLocaleString()} / {tier.coins.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                  <div className="text-xs text-slate-400 text-center">
                    {progress >= 100 ? 'Ready to redeem!' : `${(100 - progress).toFixed(1)}% to go`}
                  </div>
                </div>

                <Dialog open={isDialogOpen && selectedTier?.coins === tier.coins} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className={`w-full ${
                        affordable 
                          ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-900' 
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                      disabled={!affordable}
                      onClick={() => setSelectedTier(tier)}
                    >
                      {affordable ? `Redeem ${tier.label}` : 'Not enough coins'}
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-yellow-400">Confirm Demo Withdrawal</DialogTitle>
                      <DialogDescription className="text-slate-300">
                        Demo: Redeem {tier.coins.toLocaleString()} coins for {tier.label} (no real money sent)
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300">Amount:</span>
                          <span className="text-yellow-400 font-semibold">{tier.label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Coins:</span>
                          <span className="text-slate-300">{tier.coins.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="paypal-email" className="text-slate-300">
                          PayPal Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="paypal-email"
                            type="email"
                            placeholder="your-email@example.com"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            className="pl-10 bg-slate-900 border-slate-700 text-slate-100"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-700"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleRedeem}
                          disabled={isProcessing || !paypalEmail.trim()}
                          className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-900"
                        >
                          {isProcessing ? 'Processing...' : `Confirm ${tier.label}`}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="font-semibold text-yellow-400">Your Balance</span>
        </div>
        <div className="text-2xl font-bold text-white mb-1">
          {coins.toLocaleString()} coins
        </div>
        <div className="text-slate-400 text-sm">
          Keep tapping to earn more!
        </div>
      </div>
    </div>
  )
}