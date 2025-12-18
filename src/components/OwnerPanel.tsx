import { useState } from 'react'
import { useBombandak } from '../hooks/useBombandak'
import { motion, AnimatePresence } from 'framer-motion'

export function OwnerPanel() {
  const { isOwner, endGameAndDistribute, emergencyWithdraw, addToRewardPool, isLoading } = useBombandak()
  const [isEmergencyWithdrawLoading, setIsEmergencyWithdrawLoading] = useState(false)
  const [isAddingToPool, setIsAddingToPool] = useState(false)
  const [rewardAmount, setRewardAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOwner) return null

  const handleEmergencyWithdraw = async () => {
    try {
      setIsEmergencyWithdrawLoading(true)
      setError('')

      await emergencyWithdraw()
      setSuccess('Emergency withdraw completed!')
      console.log('Emergency withdraw triggered')
    } catch (error: any) {
      console.error('Emergency withdraw error:', error)
      setError(error?.message || 'Emergency withdraw failed')
    } finally {
      setIsEmergencyWithdrawLoading(false)
    }
  }

  const handleAddToRewardPool = async () => {
    if (!rewardAmount || parseFloat(rewardAmount) <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    try {
      setIsAddingToPool(true)
      setError('')
      setSuccess('')

      await addToRewardPool(rewardAmount)
      setSuccess(`Successfully added ${rewardAmount} MON to reward pool!`)
      setRewardAmount('')
      console.log('Added to reward pool:', rewardAmount)
    } catch (error: any) {
      console.error('Add to reward pool error:', error)
      if (error?.message?.includes('User rejected') || error?.code === 4001) {
        setError('Transaction cancelled by user')
      } else if (error?.message?.includes('insufficient funds')) {
        setError('Insufficient funds')
      } else {
        setError(error?.message || 'Failed to add to reward pool')
      }
    } finally {
      setIsAddingToPool(false)
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="bg-black/50 border-2 border-primary/20 p-6 rounded-none clip-path-slant mb-6 relative overflow-hidden group">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 p-2 text-primary font-mono text-xs opacity-50">ADMIN_ACCESS_GRANTED</div>

      <h4 className="text-xl font-bold font-display text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-primary animate-pulse" />
        Command Center
      </h4>

      <div className="space-y-6 relative z-10">

        {/* Add to Pool */}
        <div className="bg-white/5 border border-white/10 p-4">
          <h5 className="text-white font-bold font-display text-sm uppercase tracking-wider mb-3">Inject Liquidity (Reward Pool)</h5>

          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="AMOUNT (MON)"
              value={rewardAmount}
              onChange={(e) => {
                setRewardAmount(e.target.value)
                clearMessages()
              }}
              className="flex-1 px-4 py-2 bg-black border border-white/20 text-primary font-mono placeholder:text-gray-600 focus:border-primary focus:outline-none"
              disabled={isAddingToPool || isLoading}
            />
            <button
              onClick={handleAddToRewardPool}
              disabled={isAddingToPool || isLoading || !rewardAmount}
              className="px-6 py-2 bg-primary/20 hover:bg-primary/40 text-primary border border-primary font-bold font-display tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAddingToPool ? 'INJECTING...' : 'INJECT'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-accent/20 border border-accent text-accent font-mono text-xs"
            >
              ERROR: {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-success/20 border border-success text-success font-mono text-xs"
            >
              SUCCESS: {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <button
            onClick={endGameAndDistribute}
            disabled={isLoading}
            className="w-full py-4 bg-accent/10 hover:bg-accent/30 text-accent border border-accent font-bold font-display uppercase tracking-widest disabled:opacity-50 transition-all hover:shadow-[0_0_20px_rgba(255,0,60,0.3)]"
          >
            {isLoading ? 'EXECUTING...' : 'TERMINATE GAME & DISTRIBUTE'}
          </button>

          <button
            onClick={handleEmergencyWithdraw}
            disabled={isEmergencyWithdrawLoading || isLoading}
            className="w-full py-4 bg-warning/10 hover:bg-warning/30 text-warning border border-warning font-bold font-display uppercase tracking-widest disabled:opacity-50 transition-all hover:shadow-[0_0_20px_rgba(255,190,0,0.3)]"
          >
            {isEmergencyWithdrawLoading ? 'WITHDRAWING...' : 'EMERGENCY EVACUATION (WITHDRAW)'}
          </button>
        </div>
      </div>
    </div>
  )
}