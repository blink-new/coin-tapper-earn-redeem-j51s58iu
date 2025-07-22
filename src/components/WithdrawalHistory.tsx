import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { blink } from '../blink/client'
import { DollarSign, Calendar, Mail, TrendingUp, Coins } from 'lucide-react'

interface WithdrawalHistoryProps {
  totalWithdrawn: number
  userId: string
}

interface Withdrawal {
  id: string
  userId: string
  amount: number
  coinsSpent: number
  paypalEmail: string
  status: string
  createdAt: string
}

export function WithdrawalHistory({ totalWithdrawn, userId }: WithdrawalHistoryProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)

  const loadWithdrawals = useCallback(async () => {
    try {
      const data = await blink.db.withdrawals.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 50
      })
      setWithdrawals(data)
    } catch (error) {
      console.error('Error loading withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadWithdrawals()
    }
  }, [userId, loadWithdrawals])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">Withdrawal History</h2>
          <p className="text-slate-300">Loading your withdrawal history...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Withdrawal History</h2>
        <p className="text-slate-300">Track your PayPal withdrawals</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <CardTitle className="text-sm text-slate-300">Total Withdrawn</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              ${totalWithdrawn.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <CardTitle className="text-sm text-slate-300">Withdrawals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {withdrawals.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal List */}
      <div className="space-y-4">
        {withdrawals.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-12">
              <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No withdrawals yet</h3>
              <p className="text-slate-500">
                Start tapping to earn coins and make your first withdrawal!
              </p>
            </CardContent>
          </Card>
        ) : (
          withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-green-400 text-lg">
                        ${withdrawal.amount.toFixed(2)}
                      </div>
                      <div className="text-slate-400 text-sm flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        {withdrawal.coinsSpent.toLocaleString()} coins
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(withdrawal.status)}>
                    {withdrawal.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>{withdrawal.paypalEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(withdrawal.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {withdrawals.length > 0 && (
        <div className="text-center text-slate-400 text-sm">
          Showing {withdrawals.length} withdrawal{withdrawals.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}