import { motion } from 'framer-motion'
import { NFTDataProvider } from './components/NFTDataContext'
import { WalletConnect } from './components/WalletConnect'
import MintButton from './components/MintButton'
import { GlobalStats } from './components/GlobalStats'
import { ViewMyNFTs } from './components/ViewMyNFTs'
import { Leaderboard } from './components/Leaderboard'
import { OwnerPanel } from './components/OwnerPanel'

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-white/90 selection:bg-primary/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-pulse-fast" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[100px] animate-pulse-fast" style={{ animationDelay: '1s' }} />
      </div>

      <header className="w-full px-4 sm:px-6 lg:px-8 py-6 relative z-10 border-b border-white/5 bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary flex items-center gap-4 drop-shadow-neon-blue"
          >
            <img
              src="/bombandaks.png"
              alt="Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain"
            />
            Bombandak
          </motion.h1>
          <WalletConnect />
        </div>
      </header>

      <main className="flex-1 w-full relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 lg:p-8"
          >
            <h4 className="text-2xl font-display text-primary mb-6 border-b border-white/10 pb-2">Mission Protocol</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: '1. INITIALIZE', desc: 'Mint Bombandak. 24h Countdown starts immediately.', icon: '⚡' },
                { title: '2. TRANSFER', desc: 'Send to reset the timer. Hot potato mechanics engage.', icon: '🔄' },
                { title: '3. SURVIVE', desc: 'Keep the chain alive. Last longest to secure the pool.', icon: '🛡️' },
                { title: '4. REWARD', desc: 'Winning NFT holders split the accumulated reward pool.', icon: '💎' }
              ].map((step, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-lg border border-white/5 hover:border-primary/50 transition-colors group">
                  <div className="text-xl font-display text-primary mb-2 group-hover:text-white transition-colors">{step.icon} {step.title}</div>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300">{step.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column: Stats */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="glass-panel p-6 lg:p-8">
                <GlobalStats />
              </div>
            </motion.div>

            {/* Middle Column: Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-6 lg:p-8 flex flex-col"
            >
              <h3 className="text-2xl font-display text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-accent mr-2"></span>
                Command Center
              </h3>

              <div className="space-y-6 flex-1">
                <MintButton />
                <div className="h-px bg-white/10 my-4" />
                <ViewMyNFTs />
                <OwnerPanel />
              </div>

              <img
                src="/bombandak.png"
                alt="Mascot"
                className="mx-auto w-full max-w-[250px] mt-8 opacity-80 hover:opacity-100 transition-opacity drop-shadow-neon-purple"
              />
            </motion.div>

            {/* Right Column: Leaderboard */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-panel p-0 overflow-hidden"
            >
              {/* Leaderboard has its own padding usually, but we wrapper it here */}
              <Leaderboard />
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 relative z-10 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center gap-4">
          <p className="text-gray-500 text-sm font-display tracking-widest">
            SYSTEM DESIGN BY <a href="https://x.com/sifu_lam" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors">SIFU_LAM</a>
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            POWERED BY <img src="/logomonad.png" alt="monad" className="h-3 w-auto opacity-50 grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <NFTDataProvider>
      <AppContent />
    </NFTDataProvider>
  )
}
export default App