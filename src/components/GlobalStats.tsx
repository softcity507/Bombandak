import { useNFTData } from '../components/NFTDataContext'

export function GlobalStats() {
  const {
    globalStats,
    isLoading,
    getMintTimeLeft,
    isMintStillActive,
    gameEnded
  } = useNFTData()

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Expired'
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl lg:text-2xl font-bold font-display text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-primary mr-2"></span>
          Global Intel
        </h3>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>

      {/* Mint Deadline */}
      {isMintStillActive() ? (
        <div className="relative overflow-hidden bg-primary/5 border border-primary/30 rounded-none p-4 mb-6 group hover:bg-primary/10 transition-colors clip-path-slant">
          <div className="absolute top-0 right-0 p-1">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </div>
          <div className="text-center">
            <div className="text-primary font-display tracking-widest text-sm mb-1 uppercase">Mint Deadline</div>
            <div className="text-2xl font-bold text-white font-display tracking-wider drop-shadow-neon-blue">
              {getMintTimeLeft()}
            </div>
            <div className="text-[10px] text-primary/60 mt-1 uppercase tracking-widest">
              Closing: July 16, 2025 • 23:59 UTC
            </div>
          </div>
        </div>
      ) : !gameEnded && (
        <div className="bg-orange-500/5 border border-orange-500/30 rounded-none p-4 mb-6">
          <div className="text-center">
            <div className="text-orange-500 font-display tracking-widest text-sm mb-1 uppercase">Phase 1 Complete</div>
            <div className="text-sm text-gray-400">Mint period concluded. No new units.</div>
          </div>
        </div>
      )}

      {/* Reward Pool */}
      <div className="relative bg-gradient-to-r from-warning/10 to-accent/10 border border-warning/30 p-4 mb-6 clip-path-slant">
        <div className="text-center">
          <div className="text-warning font-display tracking-widest text-xs mb-2 uppercase">Total Reward Pool</div>
          <div className="text-3xl lg:text-4xl font-bold text-white font-display tracking-wider mb-1 drop-shadow-neon-red">
            {globalStats.rewardPool.formatted} <span className="text-lg text-gray-400">MON</span>
          </div>
          {gameEnded && (
            <div className="text-xs text-success mt-1 font-bold uppercase tracking-widest">
              Rewards Distributed
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-white/5 p-3 text-center hover:border-warning/50 transition-colors">
          <div className="text-xl font-bold font-display text-warning">{globalStats.totalMinted}/500</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Minted</div>
        </div>
        <div className="bg-surface border border-white/5 p-3 text-center hover:border-success/50 transition-colors">
          <div className="text-xl font-bold font-display text-success">{globalStats.totalAlive}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Active</div>
        </div>
        <div className="bg-surface border border-white/5 p-3 text-center hover:border-accent/50 transition-colors">
          <div className="text-xl font-bold font-display text-accent">{globalStats.totalDead}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Detonated</div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-4 text-sm border-t border-white/5 pt-4">
        <div className="flex justify-between items-center group">
          <span className="text-gray-400 group-hover:text-primary transition-colors text-xs uppercase tracking-wider">Total Transfers</span>
          <span className="text-primary font-bold font-display">{globalStats.totalTransfers}</span>
        </div>

        <div className="flex justify-between items-center group">
          <span className="text-gray-400 group-hover:text-secondary transition-colors text-xs uppercase tracking-wider">Avg. Lifespan</span>
          <span className="text-secondary font-bold font-display">{formatTime(globalStats.averageLifetime)}</span>
        </div>
      </div>

      {/* Survival Rate Bar */}
      {globalStats.totalMinted > 0 && (
        <div className="mt-6">
          <div className="flex justify-between text-[10px] text-gray-400 mb-2 uppercase tracking-wider">
            <span>Survival Rate</span>
            <span className="text-white font-bold">{Math.round((globalStats.totalAlive / globalStats.totalMinted) * 100)}%</span>
          </div>
          <div className="w-full bg-surface/50 h-1 overflow-hidden">
            <div
              className="bg-gradient-to-r from-success/50 to-success h-full shadow-[0_0_10px_rgba(0,255,148,0.5)] transition-all duration-1000 ease-out"
              style={{ width: `${(globalStats.totalAlive / globalStats.totalMinted) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameEnded && (
        <div className="mt-6 p-4 bg-accent/10 border border-accent/50 text-center animate-pulse">
          <div className="text-accent font-display font-bold uppercase tracking-widest text-lg">Mission Terminated</div>
          <div className="text-xs text-accent/70 mt-1 uppercase">Cycle Complete</div>
        </div>
      )}
    </div>
  )
}