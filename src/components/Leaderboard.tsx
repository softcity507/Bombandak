import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNFTData } from '../components/NFTDataContext'

type LeaderboardType = 'transfers' | 'longevity' | 'deaths'

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('transfers')
  const { getLeaderboardData, isLoading } = useNFTData()

  const getFilteredData = () => {
    const leaderboardData = getLeaderboardData()
    let filtered = [...leaderboardData]

    switch (activeTab) {
      case 'transfers':
        return filtered
          .sort((a, b) => b.transferCount - a.transferCount)
          .slice(0, 5)

      case 'longevity':
        return filtered
          .sort((a, b) => b.realLifetime - a.realLifetime)
          .slice(0, 5)

      case 'deaths':
        return filtered
          .filter(nft => nft.isDead || !nft.isAlive || nft.timeLeft <= 0)
          .sort((a, b) => b.realLifetime - a.realLifetime)
          .slice(0, 5)

      default:
        return []
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Expired'

    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)
    const secs = seconds % 60

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}..${address.slice(-4)}`
  }

  const getLastOwner = (ownerHistory: string[]) => {
    return ownerHistory[ownerHistory.length - 1] || 'Unknown'
  }

  const filteredData = getFilteredData()

  const tabs = [
    { id: 'transfers' as const, label: 'Transfers', color: 'text-primary' },
    { id: 'longevity' as const, label: 'Survivors', color: 'text-success' },
    { id: 'deaths' as const, label: 'Casualties', color: 'text-accent' },
  ]

  return (
    <div className="h-full flex flex-col bg-surface/50">
      <div className="p-6 border-b border-white/5">
        <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-secondary mr-2"></span>
          War Room Top 5
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 text-xs font-display font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.id === 'transfers' ? 'bg-primary' :
                  tab.id === 'longevity' ? 'bg-success' : 'bg-accent'
                  }`}
              />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-primary animate-pulse">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="font-display text-sm tracking-widest uppercase">Decryption in progress...</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence mode='popLayout'>
              {filteredData.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-display uppercase tracking-widest text-sm">
                  No Signals Detected
                </div>
              ) : (
                filteredData.map((nft, index) => (
                  <motion.div
                    key={`${nft.tokenId}-${activeTab}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 group hover:bg-white/5 transition-colors relative overflow-hidden`}
                  >
                    {/* Rank Indicator Background */}
                    {index < 3 && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${index === 0 ? 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' :
                        index === 1 ? 'bg-gray-300' :
                          'bg-orange-600'
                        }`} />
                    )}

                    <div className="flex items-center gap-4 pl-2">
                      <span className={`font-display font-bold w-6 text-center ${index === 0 ? 'text-yellow-400 text-lg' :
                        index === 1 ? 'text-gray-300 text-lg' :
                          index === 2 ? 'text-orange-600 text-lg' :
                            'text-gray-600 text-sm'
                        }`}>
                        {index + 1}
                      </span>

                      <div>
                        <div className="font-bold text-white font-display text-sm group-hover:text-primary transition-colors">
                          UNIT #{nft.tokenId.toString()}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                          Owner: {shortenAddress(getLastOwner(nft.ownerHistory))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {activeTab === 'transfers' && (
                        <>
                          <div className="text-lg font-bold text-primary font-display drop-shadow-neon-blue">
                            {nft.transferCount}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">Jumps</div>
                        </>
                      )}

                      {activeTab === 'longevity' && (
                        <>
                          <div className="text-sm font-bold text-success font-display">
                            {formatTime(nft.realLifetime)}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">
                            Active
                          </div>

                        </>
                      )}

                      {activeTab === 'deaths' && (
                        <>
                          <div className="text-sm font-bold text-accent font-display">
                            {formatTime(nft.realLifetime)}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">Recorded</div>
                        </>
                      )}
                    </div>

                    {/* Status Dot */}
                    <div className={`w-2 h-2 rounded-full absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${(nft.isAlive && nft.timeLeft > 0) ? 'bg-success shadow-[0_0_10px_#00ff94]' : 'bg-accent shadow-[0_0_10px_#ff003c]'
                      }`} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}