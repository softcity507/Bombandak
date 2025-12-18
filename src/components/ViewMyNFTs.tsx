import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAccount } from 'wagmi'
import { readContract } from '@wagmi/core'
import { config } from '../config/wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'
import { NFTCard } from './NFTCard'
import { useNFTData } from '../components/NFTDataContext'
import { motion, AnimatePresence } from 'framer-motion'

export function ViewMyNFTs() {
  const { address, isConnected } = useAccount()
  const [isOpen, setIsOpen] = useState(false)
  const [userNFTs, setUserNFTs] = useState<bigint[]>([])
  const [isLoadingOwnership, setIsLoadingOwnership] = useState(false)
  const [lastOwnershipCheck, setLastOwnershipCheck] = useState<number | null>(null)

  const { nftData, globalStats, isLoading: isLoadingNFTData } = useNFTData()
  const OWNERSHIP_CACHE_DURATION = 30 * 1000

  const totalSupply = useMemo(() => {
    return globalStats.totalMinted
  }, [globalStats.totalMinted])

  const checkUserNFTs = async () => {
    if (!isConnected || !address || totalSupply === 0) {
      setUserNFTs([])
      return
    }

    if (lastOwnershipCheck && Date.now() - lastOwnershipCheck < OWNERSHIP_CACHE_DURATION) {
      return
    }

    setIsLoadingOwnership(true)

    try {
      const existingTokenIds = nftData.map(nft => nft.tokenId)
      const ownershipPromises = existingTokenIds.map(async (tokenId) => {
        try {
          const owner = await readContract(config, {
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'ownerOf',
            args: [BigInt(tokenId)],
          }) as string

          if (owner.toLowerCase() === address.toLowerCase()) {
            return BigInt(tokenId)
          }
          return null
        } catch (error) {
          return null
        }
      })

      const results = await Promise.all(ownershipPromises)
      const validNFTs = results.filter(tokenId => tokenId !== null) as bigint[]

      setUserNFTs(validNFTs)
      setLastOwnershipCheck(Date.now())
    } catch (error) {
      console.error('Error checking user NFTs:', error)
      setUserNFTs([])
    } finally {
      setIsLoadingOwnership(false)
    }
  }

  const checkUserNFTsFromContext = () => {
    if (!isConnected || !address || !nftData.length) {
      setUserNFTs([])
      return
    }

    const userOwnedNFTs = nftData
      .filter(nft => {
        const lastOwner = nft.ownerHistory[nft.ownerHistory.length - 1]
        return lastOwner && lastOwner.toLowerCase() === address.toLowerCase()
      })
      .map(nft => BigInt(nft.tokenId))

    setUserNFTs(userOwnedNFTs)
    setLastOwnershipCheck(Date.now())
  }

  useEffect(() => {
    if (isOpen && nftData.length > 0) {
      if (nftData.some(nft => nft.ownerHistory.length > 0)) {
        checkUserNFTsFromContext()
      } else {
        checkUserNFTs()
      }
    }
  }, [isConnected, address, nftData, isOpen])

  const handleOpen = () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const isLoading = isLoadingNFTData || isLoadingOwnership

  const enrichedUserNFTs = useMemo(() => {
    return userNFTs.map(tokenId => {
      const nftInfo = nftData.find(nft => nft.tokenId === Number(tokenId))
      return {
        tokenId,
        ...nftInfo
      }
    })
  }, [userNFTs, nftData])

  const Modal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={handleClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-[#050510] border border-primary/30 w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.1)] clip-path-slant"
      >
        {/* Header */}
        <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div>
            <h2 className="text-2xl font-bold font-display text-white uppercase tracking-widest flex items-center gap-3">
              <span className="text-primary">Inventory</span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white/50 hover:text-white hover:bg-white/10 rounded-none p-2 transition-colors uppercase text-xs tracking-widest font-bold"
          >
            Close [Esc]
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {!isConnected ? (
            <div className="text-center py-20 opacity-50">
              <h3 className="text-2xl font-display text-white mb-2">ACCESS DENIED</h3>
              <p className="font-mono text-gray-400">Establish connection to mainframe.</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-20">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="font-display text-primary animate-pulse tracking-widest uppercase">Scanning Blockchain...</h3>
            </div>
          ) : userNFTs.length === 0 ? (
            <div className="text-center py-20 border border-white/5 bg-white/5 dashboard-grid">
              <h3 className="text-xl font-display text-white mb-2">NO SIGNALS DETECTED</h3>
              <p className="text-gray-500 font-mono mb-6">Inventory empty. Initiate drop to populate.</p>
              {totalSupply > 0 && (
                <p className="text-xs text-primary/50 uppercase tracking-widest">{totalSupply} UNITS IN CIRCULATION</p>
              )}
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Units Owned', value: userNFTs.length, color: 'text-white' },
                  { label: 'Active', value: enrichedUserNFTs.filter(nft => nft.isAlive && nft.timeLeft && nft.timeLeft > 0).length, color: 'text-success' },
                  { label: 'Casualties', value: enrichedUserNFTs.filter(nft => nft.isDead || (nft.timeLeft && nft.timeLeft <= 0)).length, color: 'text-accent' },
                  { label: 'Total Jumps', value: enrichedUserNFTs.reduce((sum, nft) => sum + (nft.transferCount || 0), 0), color: 'text-primary' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 p-4 relative group">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{stat.label}</div>
                    <div className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</div>
                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={`w-1 h-1 rounded-full ${stat.color.replace('text-', 'bg-')} shadow-[0_0_5px_currentColor]`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userNFTs.map((tokenId) => (
                  <motion.div
                    key={tokenId.toString()}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NFTCard tokenId={tokenId} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white/5 p-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase">
          <div>System Status: ONLINE</div>
          <div>Secured by MONAD</div>
        </div>
      </motion.div>
    </div>
  )

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        className="w-full py-4 btn-primary bg-primary/20 hover:bg-primary/30 text-white border-primary/50 hover:border-primary shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
      >
        ACCESS INVENTORY
      </motion.button>

      <AnimatePresence>
        {isOpen && createPortal(<Modal />, document.body)}
      </AnimatePresence>
    </>
  )
}