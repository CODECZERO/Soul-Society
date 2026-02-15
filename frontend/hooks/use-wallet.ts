"use client"

import { useState, useEffect, useCallback } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { connectWallet, disconnectWallet, signTransaction, setBalance } from "@/lib/redux/slices/wallet-slice"
import { getAccountBalance } from "@/lib/stellar-utils"

export interface WalletInfo {
  isConnected: boolean
  publicKey: string | null
  balance: number
  isConnecting: boolean
  error: string | null
  walletType: string | null
}

export interface WalletActions {
  connect: (walletType: 'freighter' | 'albedo' | 'rabet') => Promise<void>
  disconnect: () => void
  signTx: (transactionXDR: string) => Promise<string>
  refreshBalance: () => Promise<void>
}

export function useWallet(): WalletInfo & WalletActions {
  const dispatch = useDispatch<AppDispatch>()
  const walletState = useSelector((state: RootState) => state.wallet)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Connect wallet
  const connect = useCallback(async (walletType: 'freighter' | 'albedo' | 'rabet') => {
    try {
      await dispatch(connectWallet(walletType)).unwrap()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    }
  }, [dispatch])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    dispatch(disconnectWallet())
  }, [dispatch])

  // Sign transaction
  const signTx = useCallback(async (transactionXDR: string): Promise<string> => {
    try {
      const result = await dispatch(signTransaction(transactionXDR)).unwrap()
      return result
    } catch (error) {
      console.error("Failed to sign transaction:", error)
      throw error
    }
  }, [dispatch])

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletState.publicKey) return

    try {
      setIsRefreshing(true)
      const balance = await getAccountBalance(walletState.publicKey)
      dispatch(setBalance(balance))
    } catch (error) {
      console.error("Failed to refresh balance:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [walletState.publicKey, dispatch])

  // Auto-refresh balance when wallet connects
  useEffect(() => {
    if (walletState.isConnected && walletState.publicKey) {
      refreshBalance()
    }
  }, [walletState.isConnected, walletState.publicKey, refreshBalance])

  return {
    // State
    isConnected: walletState.isConnected,
    publicKey: walletState.publicKey,
    balance: walletState.balance,
    isConnecting: walletState.isConnecting || isRefreshing,
    error: walletState.error,
    walletType: walletState.walletType,
    
    // Actions
    connect,
    disconnect,
    signTx,
    refreshBalance,
  }
}

// Hook for checking if Freighter is available
export function useFreighterAvailable() {
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    const checkFreighter = async () => {
      try {
        const { isConnected } = await import("@stellar/freighter-api")
        const result = await isConnected()
        setIsAvailable(!result.error && result.isConnected)
      } catch (error) {
        setIsAvailable(false)
      }
    }

    checkFreighter()

    // Listen for Freighter installation
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'FREIGHTER_EXTENSION_READY') {
        checkFreighter()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return isAvailable
}

// Hook for getting network information
export function useNetworkInfo() {
  const [network, setNetwork] = useState<string>('')
  const [isTestnet, setIsTestnet] = useState(false)

  useEffect(() => {
    const getNetworkInfo = async () => {
      try {
        const { getNetwork } = await import("@stellar/freighter-api")
        const result = await getNetwork()
        if (!result.error) {
          setNetwork(result.network)
          setIsTestnet(result.network === 'TESTNET')
        }
      } catch (error) {
        console.error("Failed to get network info:", error)
      }
    }

    getNetworkInfo()
  }, [])

  return { network, isTestnet }
}
