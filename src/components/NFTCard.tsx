import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'
import { TransferModal } from './TransferModal'
import { motion } from 'framer-motion'

interface NFTCardProps {
  tokenId: bigint
}

export function NFTCard({ tokenId }: NFTCardProps) {
  const [showTransfer, setShowTransfer] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [useLocalFallback, setUseLocalFallback] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState<number | null>(null)

  const { data: nftData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getNFTData',
    args: [tokenId],
  })

  const { data: tokenURI } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  })

  // Déterminer quelle image locale utiliser selon l'état du NFT
  const getLocalImagePath = () => {
    if (!nftData) return '/bombandak.png'
    const [, , , isAlive, isDead, timeLeft] = nftData
    if (isDead || !isAlive || Number(timeLeft) <= 0) {
      return '/bombandakexploded.png'
    } else {
      return '/bombandak.png'
    }
  }

  useEffect(() => {
    const fetchImageFromIPFS = async () => {
      if (!tokenURI) return

      setIsImageLoading(true)
      setUseLocalFallback(false)

      const timeout = setTimeout(() => {
        setUseLocalFallback(true)
        setIsImageLoading(false)
      }, 5000)

      setLoadingTimeout(timeout)

      try {
        const metadataUrl = tokenURI.startsWith('ipfs://')
          ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
          : tokenURI

        const response = await fetch(metadataUrl)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const metadata = await response.json()

        if (metadata.image) {
          const imageUrl = metadata.image.startsWith('ipfs://')
            ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : metadata.image

          setImageUrl(imageUrl)
          clearTimeout(timeout)
          setIsImageLoading(false)
        } else {
          throw new Error('No image in metadata')
        }
      } catch (error) {
        clearTimeout(timeout)
        setUseLocalFallback(true)
        setIsImageLoading(false)
      }
    }

    fetchImageFromIPFS()

    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
    }
  }, [tokenURI])

  if (!nftData) {
    return (
      <div className="bg-surface border border-white/5 rounded-none p-4 animate-pulse clip-path-slant">
        <div className="h-4 bg-white/10 w-2/3 mb-2"></div>
        <div className="h-40 bg-white/5 w-full mb-2"></div>
      </div>
    )
  }

  const [, transferCount, ownerHistory, isAlive, isDead, timeLeft] = nftData

  const formatTimeLeft = (seconds: bigint) => {
    const totalSeconds = Number(seconds)
    if (totalSeconds <= 0) return 'DETONATED'

    const days = Math.floor(totalSeconds / (24 * 60 * 60))
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const isActuallyAlive = isAlive && timeLeft > 0n
  const isDanger = timeLeft > 0n && Number(timeLeft) < 24 * 60 * 60

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        className={`glass-panel p-4 relative group overflow-hidden ${!isActuallyAlive ? 'border-accent/30' :
            isDanger ? 'border-warning/30' :
              'border-success/30'
          }`}
      >
        {/* Holographic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="flex justify-between items-start mb-3 relative z-10">
          <h3 className="text-lg font-bold font-display text-white drop-shadow-md">
            Unit #{tokenId.toString()}
          </h3>
          <span className={`px-2 py-0.5 text-[10px] font-bold font-display uppercase tracking-widest border ${isActuallyAlive
              ? 'bg-success/10 border-success text-success shadow-[0_0_10px_rgba(0,255,148,0.3)]'
              : 'bg-accent/10 border-accent text-accent shadow-[0_0_10px_rgba(255,0,60,0.3)]'
            }`}>
            {isActuallyAlive ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div className="mb-4 relative rounded-lg overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
          {/* Image Logic */}
          <div className="aspect-square bg-black/50 relative">
            {!isImageLoading && !useLocalFallback && imageUrl ? (
              <img src={imageUrl} alt={`Unit ${tokenId}`} className="w-full h-full object-cover" onError={handleIPFSImageError} />
            ) : (
              <img src={getLocalImagePath()} alt="Fallback" className="w-full h-full object-cover" />
            )}
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-20 pointer-events-none mix-blend-overlay" />
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Countdown</span>
            <span className={`text-xl font-bold font-display ${!isActuallyAlive ? 'text-accent' :
                isDanger ? 'text-warning animate-pulse' :
                  'text-success'
              }`}>
              {formatTimeLeft(timeLeft)}
            </span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            {isActuallyAlive && (
              <div className={`h-full ${isDanger ? 'bg-warning' : 'bg-success'}`} style={{ width: '100%' }} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
          <div className="bg-black/20 p-2 rounded">
            <div className="text-gray-500">JUMPS</div>
            <div className="text-white font-bold">{transferCount.toString()}</div>
          </div>
          <div className="bg-black/20 p-2 rounded">
            <div className="text-gray-500">HISTORY</div>
            <div className="text-white font-bold">{ownerHistory.length}</div>
          </div>
        </div>

        {isActuallyAlive ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTransfer(true)}
            className="w-full py-2 bg-gradient-to-r from-success/20 to-success/10 border border-success/50 text-success font-display font-bold text-sm tracking-widest hover:bg-success/30 hover:shadow-[0_0_15px_rgba(0,255,148,0.4)] transition-all"
          >
            INITIATE TRANSFER
          </motion.button>
        ) : (
          <div className="w-full py-2 bg-accent/10 border border-accent/20 text-accent text-center font-display font-bold text-sm tracking-widest opacity-50 cursor-not-allowed">
            UNIT DESTROYED
          </div>
        )}
      </motion.div>

      {showTransfer && (
        <TransferModal
          tokenId={tokenId}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </>
  )
}