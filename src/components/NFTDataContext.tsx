import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { readContract, readContracts } from '@wagmi/core'
import { config } from '../config/wagmi'
import { formatEther } from 'viem'
import type { Address } from 'viem'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'

// Types
interface NFTData {
  tokenId: number
  transferCount: number
  realLifetime: number
  timeLeft: number
  isAlive: boolean
  isDead: boolean
  ownerHistory: string[]
}

interface GlobalStats {
  totalMinted: number
  totalAlive: number
  totalDead: number
  totalTransfers: number
  averageLifetime: number
  rewardPool: {
    formatted: string
    raw: string
  }
}

interface NFTDataContextType {
  nftData: NFTData[]
  globalStats: GlobalStats
  isLoading: boolean
  lastRefresh: number | null
  forceRefresh: () => void
  getLeaderboardData: () => NFTData[]
  getGlobalStatsData: () => GlobalStats
  // Mint deadline functionality
  getMintTimeLeft: () => string
  isMintStillActive: () => boolean
  gameEnded: boolean
}

const defaultGlobalStats: GlobalStats = {
  totalMinted: 0,
  totalAlive: 0,
  totalDead: 0,
  totalTransfers: 0,
  averageLifetime: 0,
  rewardPool: {
    formatted: '0',
    raw: '0'
  }
}

const NFTDataContext = createContext<NFTDataContextType | undefined>(undefined)

export const NFTDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nftData, setNftData] = useState<NFTData[]>([])
  const [lastRefresh, setLastRefresh] = useState<number | null>(null)
  const [forceRefreshCounter, setForceRefreshCounter] = useState(0)
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)

  // Configuration
  const CACHE_DURATION = 60 * 1000 // 1 minute cache
  const BATCH_SIZE = 50 // Fetch 50 NFTs at once (100 calls)

  // Hooks for basic contract data
  const {
    data: totalSupply,
    refetch: refetchTotalSupply,
    isLoading: isLoadingTotalSupply
  } = useReadContract({
    address: CONTRACT_ADDRESS as Address,
    abi: CONTRACT_ABI,
    functionName: 'getTotalSupply',
  })

  const {
    data: rewardPoolBalance,
    refetch: refetchRewardPool,
    isLoading: isLoadingRewardPool
  } = useReadContract({
    address: CONTRACT_ADDRESS as Address,
    abi: CONTRACT_ABI,
    functionName: 'getRewardPoolBalance',
  })

  const {
    data: gameEndedData,
    refetch: refetchGameEnded
  } = useReadContract({
    address: CONTRACT_ADDRESS as Address,
    abi: CONTRACT_ABI,
    functionName: 'gameEnded',
  })

  const {
    data: mintDeadline,
    refetch: refetchMintDeadline
  } = useReadContract({
    address: CONTRACT_ADDRESS as Address,
    abi: CONTRACT_ABI,
    functionName: 'getMintDeadline',
  })

  // Calculate mint time left
  const getMintTimeLeft = useCallback((): string => {
    if (!mintDeadline) return 'Loading...'

    const now = Math.floor(Date.now() / 1000)
    const timeLeft = Number(mintDeadline) - now

    if (timeLeft <= 0) return 'Expired'

    const days = Math.floor(timeLeft / (24 * 60 * 60))
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((timeLeft % (60 * 60)) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }, [mintDeadline])

  const isMintStillActive = useCallback((): boolean => {
    if (!mintDeadline) return false
    const now = Math.floor(Date.now() / 1000)
    return Number(mintDeadline) > now
  }, [mintDeadline])

  const gameEnded = Boolean(gameEndedData)

  // Optimized Fetch Function using Multicall
  const fetchAllNFTData = useCallback(async () => {
    if (!totalSupply || totalSupply === 0n) {
      setNftData([])
      return
    }

    // Cache check
    if (lastRefresh && Date.now() - lastRefresh < CACHE_DURATION) {
      return
    }

    setIsLoadingNFTs(true)
    const totalSupplyNumber = Number(totalSupply)

    try {
      let allResults: NFTData[] = []

      // Process in batches
      for (let i = 1; i <= totalSupplyNumber; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE - 1, totalSupplyNumber)
        const contracts: any[] = []

        // Prepare calls for this batch
        for (let id = i; id <= batchEnd; id++) {
          contracts.push(
            {
              address: CONTRACT_ADDRESS as Address,
              abi: CONTRACT_ABI,
              functionName: 'getNFTData',
              args: [BigInt(id)],
            },
            {
              address: CONTRACT_ADDRESS as Address,
              abi: CONTRACT_ABI,
              functionName: 'nftData',
              args: [BigInt(id)],
            }
          )
        }

        // Execute Multicall
        // @ts-ignore - Dynamic contracts array
        const results = await readContracts(config, { contracts })

        // Process results for this batch
        const now = Math.floor(Date.now() / 1000)

        for (let j = 0; j < results.length; j += 2) {
          const tokenId = i + (j / 2)
          const detailedResult = results[j]
          const basicResult = results[j + 1]

          if (detailedResult.status === 'success' && basicResult.status === 'success') {
            const [expiryTime, transferCount, ownerHistory, isAlive, isDead, timeLeft] = detailedResult.result as [bigint, bigint, string[], boolean, boolean, bigint]
            const [mintTime] = basicResult.result as [bigint] // nftData returns a struct/tuple, usually mintTime is first

            // Recalculate Logic
            let realLifetime = 0
            const isReallyAlive = isAlive && timeLeft > 0n
            const isReallyDead = isDead || timeLeft <= 0n || !isAlive

            if (isReallyDead) {
              realLifetime = Number(expiryTime) - Number(mintTime)
            } else if (isReallyAlive) {
              realLifetime = now - Number(mintTime)
            } else {
              realLifetime = Number(expiryTime) - Number(mintTime)
            }

            allResults.push({
              tokenId,
              transferCount: Number(transferCount),
              realLifetime: Math.max(0, realLifetime),
              timeLeft: Number(timeLeft),
              isAlive: isReallyAlive,
              isDead: isReallyDead,
              ownerHistory: ownerHistory || []
            })
          }
        }
      }

      setNftData(allResults)
      setLastRefresh(Date.now())
    } catch (error) {
      console.error('Error fetching NFT data:', error)
    } finally {
      setIsLoadingNFTs(false)
    }
  }, [totalSupply, lastRefresh, forceRefreshCounter])

  // Global Stats Logic
  const globalStats = useMemo((): GlobalStats => {
    if (!nftData.length) {
      return {
        ...defaultGlobalStats,
        rewardPool: {
          formatted: rewardPoolBalance ? parseFloat(formatEther(rewardPoolBalance)).toFixed(2) : '0.00',
          raw: rewardPoolBalance?.toString() || '0'
        }
      }
    }

    const totalMinted = nftData.length
    const totalAlive = nftData.filter(nft => nft.isAlive).length
    const totalDead = nftData.filter(nft => nft.isDead).length
    const totalTransfers = nftData.reduce((sum, nft) => sum + nft.transferCount, 0)
    const averageLifetime = totalMinted > 0
      ? nftData.reduce((sum, nft) => sum + nft.realLifetime, 0) / totalMinted
      : 0

    return {
      totalMinted,
      totalAlive,
      totalDead,
      totalTransfers,
      averageLifetime,
      rewardPool: {
        formatted: rewardPoolBalance ? parseFloat(formatEther(rewardPoolBalance)).toFixed(2) : '0.00',
        raw: rewardPoolBalance?.toString() || '0'
      }
    }
  }, [nftData, rewardPoolBalance])

  const forceRefresh = useCallback(async () => {
    setForceRefreshCounter(prev => prev + 1)
    setLastRefresh(null)
    await Promise.all([
      refetchTotalSupply(),
      refetchRewardPool(),
      refetchGameEnded(),
      refetchMintDeadline(),
    ])
    // The useEffect will trigger fetchAllNFTData since forceRefreshCounter in dep array? 
    // Actually best to just set lastRefresh null and let it handle it.
  }, [refetchTotalSupply, refetchRewardPool, refetchGameEnded, refetchMintDeadline])

  // Since fetchAllNFTData depends on forceRefreshCounter, changing it triggers fetch
  useEffect(() => {
    if (totalSupply && totalSupply > 0n) {
      fetchAllNFTData()
    }
  }, [totalSupply, fetchAllNFTData, forceRefreshCounter])

  const isLoadingGlobal = isLoadingTotalSupply || isLoadingRewardPool || isLoadingNFTs

  const getLeaderboardData = useCallback(() => nftData, [nftData])
  const getGlobalStatsData = useCallback(() => globalStats, [globalStats])

  const value: NFTDataContextType = {
    nftData,
    globalStats,
    isLoading: isLoadingGlobal,
    lastRefresh,
    forceRefresh,
    getLeaderboardData,
    getGlobalStatsData,
    getMintTimeLeft,
    isMintStillActive,
    gameEnded
  }

  return (
    <NFTDataContext.Provider value={value}>
      {children}
    </NFTDataContext.Provider>
  )
}

export const useNFTData = () => {
  const context = useContext(NFTDataContext)
  if (context === undefined) {
    throw new Error('useNFTData must be used within a NFTDataProvider')
  }
  return context
}