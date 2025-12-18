"use client";

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther } from 'viem';
import { motion } from 'framer-motion';

interface NFTMintButtonProps {
  onMintSuccess?: (txHash: string) => void;
  onMintError?: (error: string) => void;
}

// Configuration du contrat NFT (à adapter selon votre contrat)
const NFT_CONTRACT_ADDRESS = '0x22deb11cabe6b075895dcc6bcb616c715513b2d6' as `0x${string}`; // Using internal config address
const NFT_MINT_PRICE = '0.001'; // Prix en ETH/MON

// ABI minimal pour la fonction mint
const NFT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
] as const;

export default function NFTMintButton({ onMintSuccess, onMintError }: NFTMintButtonProps) {
  const { address, isConnected } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  const {
    writeContract,
    data: hash,
    error: writeError
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = async () => {
    if (!isConnected || !address) {
      onMintError?.('Please connect your wallet first');
      return;
    }

    try {
      setIsMinting(true);

      await writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [],
        value: parseEther(NFT_MINT_PRICE),
      });

    } catch (error: unknown) {
      console.error('Mint error:', error);
      setIsMinting(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mint NFT';
      onMintError?.(errorMessage);
    }
  };

  // Gérer le succès de la transaction
  if (isConfirmed && hash && !mintSuccess) {
    setMintSuccess(true);
    setIsMinting(false);
    onMintSuccess?.(hash);
  }

  // Gérer les erreurs
  if ((writeError || confirmError) && isMinting) {
    setIsMinting(false);
    const errorMessage = writeError?.message || confirmError?.message || 'Transaction failed';
    onMintError?.(errorMessage);
  }

  // État de succès
  if (mintSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-3 p-4 bg-green-500/10 border border-green-500/50"
      >
        <div className="text-green-400 font-bold font-display uppercase tracking-wider">
          ✅ Unit Initialized
        </div>
        {hash && (
          <a
            href={`https://testnet.monadscan.xyz/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:text-white underline uppercase tracking-widest block"
          >
            Trace Signal
          </a>
        )}
        <button
          onClick={() => setMintSuccess(false)}
          className="text-[10px] text-gray-500 hover:text-white mt-2 uppercase"
        >
          Initialize Another
        </button>
      </motion.div>
    );
  }

  // État de minting en cours
  if (isMinting || isConfirming) {
    return (
      <div className="relative">
        <button
          disabled
          className="w-full btn-primary opacity-50 cursor-wait flex items-center justify-center gap-3"
        >
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {isConfirming ? 'CONFIRMING...' : 'INITIALIZING...'}
        </button>
        <div className="absolute inset-0 bg-primary/5 animate-pulse-fast pointer-events-none" />
      </div>
    );
  }

  // État non connecté - Afficher le bouton de connexion
  if (!isConnected) {
    return (
      <div className="text-center">
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            if (!connected) {
              return (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openConnectModal}
                  type="button"
                  className="w-full btn-accent shadow-[0_0_20px_rgba(255,0,60,0.3)] animate-pulse-slow"
                >
                  Connect to Mainframe
                </motion.button>
              );
            }
            return null;
          }}
        </ConnectButton.Custom>
      </div>
    );
  }

  // État connecté - Afficher le bouton de mint
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-between items-center text-xs text-gray-500 border-b border-white/10 pb-2">
        <span className="uppercase tracking-wider">Operator</span>
        <span className="font-mono text-primary">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
      </div>
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)" }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          e.stopPropagation();
          handleMint();
        }}
        className="w-full btn-primary text-lg"
      >
        INITIATE DROP <span className="text-sm opacity-70 ml-2">({NFT_MINT_PRICE} MON)</span>
      </motion.button>
    </div>
  );
}