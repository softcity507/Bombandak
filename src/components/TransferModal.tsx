import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { isAddress } from 'viem'
import { useBombandak } from '../hooks/useBombandak'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'
import { motion, AnimatePresence } from 'framer-motion'

interface TransferModalProps {
  tokenId: bigint
  onClose: () => void
}

export function TransferModal({ tokenId, onClose }: TransferModalProps) {
  const { address } = useAccount()
  const { transfer, isLoading } = useBombandak()
  const [toAddress, setToAddress] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed'>('idle')

  const { data: nftData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getNFTData',
    args: [tokenId],
  })

  const handleTransfer = async () => {
    setError('')
    setSuccess('')
    setTxStatus('idle')

    // Validations
    if (!toAddress.trim()) {
      setError('Please enter a recipient address')
      return
    }

    if (!isAddress(toAddress)) {
      setError('Invalid address format')
      return
    }

    if (toAddress.toLowerCase() === address?.toLowerCase()) {
      setError('Cannot transfer to yourself')
      return
    }

    if (nftData) {
      const [, , ownerHistory, , ,] = nftData
      const hasOwnedBefore = ownerHistory.some(
        (addr: string) => addr.toLowerCase() === toAddress.toLowerCase()
      )

      if (hasOwnedBefore) {
        setError('CRITICAL: Target address is a previous owner. Unit will DETONATE immediately!')
      }
    }

    try {
      setIsTransferring(true)
      setTxStatus('pending')

      // Lancer la transaction
      await transfer(toAddress, tokenId)

      // Transaction envoyée avec succès
      setTxStatus('confirming')

      // Fermer la modal après 3 secondes
      setTimeout(() => {
        onClose()
      }, 5000)

    } catch (err: any) {
      setTxStatus('failed')
      console.error('Transfer error:', err)

      // Gestion des différents types d'erreurs
      if (err?.message?.includes('User rejected') ||
        err?.message?.includes('user rejected') ||
        err?.message?.includes('User denied') ||
        err?.code === 4001) {
        setError('Sequence Aborted by User')
      } else if (err?.message?.includes('insufficient funds')) {
        setError('Insufficient Fuel (Gas)')
      } else if (err?.message?.includes('NFT is dead')) {
        setError('Unit Destroyed - Cannot Transfer')
      } else if (err?.message?.includes('Not the owner')) {
        setError('Authorization Failed - Not Owner')
      } else if (err?.message?.includes('NFT has expired')) {
        setError('Unit Expired - Cannot Transfer')
      } else {
        setError(`Transfer failed: ${err?.message || 'Unknown system error'}`)
      }
    } finally {
      setIsTransferring(false)
    }
  }

  const getStatusMessage = () => {
    switch (txStatus) {
      case 'pending':
        return 'Waiting for signature confirmation...'
      case 'confirming':
        return 'Broadcasting to network...'
      case 'confirmed':
        return 'Transfer Sequence Completed.'
      case 'failed':
        return 'Transfer Sequence Failed.'
      default:
        return ''
    }
  }

  const ownerHistory = nftData ? nftData[2] : []
  const isProcessing = isTransferring || isLoading

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md shadow-2xl overflow-hidden clip-path-slant group"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-success via-primary to-success animate-pulse-slow" />

        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-white/5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold font-display text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-6 bg-success"></span>
              Initiate Transfer
            </h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-500 hover:text-white transition-colors disabled:opacity-50"
            >
              [CLOSE]
            </button>
          </div>
          <div className="text-xs text-primary font-mono mt-1">UNIT ID: #{tokenId.toString()}</div>
        </div>

        <div className="p-6 space-y-6">

          {/* Status Message */}
          <AnimatePresence>
            {txStatus !== 'idle' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`p-4 border-l-4 font-mono text-xs ${txStatus === 'failed' ? 'bg-red-500/10 border-red-500 text-red-400' :
                    txStatus === 'confirmed' ? 'bg-green-500/10 border-green-500 text-green-400' :
                      'bg-blue-500/10 border-blue-500 text-blue-400'
                  }`}
              >
                {getStatusMessage()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Previous Owners Warning */}
          {ownerHistory.length > 0 && (
            <div className="bg-accent/10 border border-accent/20 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-20 text-accent text-4xl font-bold">!</div>
              <h4 className="text-accent font-bold font-display uppercase text-xs tracking-widest mb-2">Hazard Warning</h4>
              <p className="text-[10px] text-gray-400 mb-2">Avoid previous operators. Transferring to any of these addresses will cause immediate detonation:</p>
              <div className="max-h-24 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1">
                {ownerHistory.map((addr: string, index) => (
                  <div key={index} className="text-accent/70 hover:text-accent transition-colors truncate">
                    {addr}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                Target Coordinates (Address)
              </label>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="0x..."
                disabled={isProcessing}
                className="w-full bg-black border border-white/20 p-3 text-white font-mono text-sm focus:border-primary focus:outline-none focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all placeholder-white/20"
              />
            </div>

            {error && (
              <div className="text-xs text-accent font-bold font-mono border border-accent/20 bg-accent/5 p-2 animate-pulse">
                ERROR: {error}
              </div>
            )}

            {success && txStatus === 'confirming' && (
              <div className="text-xs text-success font-bold font-mono border border-success/20 bg-success/5 p-2">
                SUCCESS: {success}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest border border-white/10 transition-colors disabled:opacity-50"
              >
                Abort
              </button>
              <button
                onClick={handleTransfer}
                disabled={isProcessing || !toAddress.trim()}
                className={`py-3 text-xs font-bold uppercase tracking-widest border transition-all ${isProcessing || !toAddress.trim()
                    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                    : 'bg-success/20 border-success text-success hover:bg-success/30 hover:shadow-[0_0_15px_rgba(0,255,148,0.3)]'
                  }`}
              >
                {isProcessing ? 'Processing...' : 'Execute'}
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  )
}