"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import type { WalletType } from "./wallet-types"
import { walletConnectors } from "./wallet-connectors"

interface WalletContextType {
  isConnected: boolean
  publicKey: string | null
  balance: number
  isConnecting: boolean
  error: string | null
  walletType: WalletType | null
  connect: (walletType: WalletType) => Promise<void>
  disconnect: () => void
  signTransaction: (tx: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletType, setWalletType] = useState<WalletType | null>(null)

  const connect = useCallback(async (selectedWalletType: WalletType) => {
    setIsConnecting(true)
    setError(null)

    try {
      const connector = walletConnectors[selectedWalletType]
      if (!connector) {
        throw new Error("Wallet type not supported")
      }

      const key = await connector.connect()
      setPublicKey(key)
      setWalletType(selectedWalletType)
      setIsConnected(true)

      // Fetch balance
      const { getAccountBalance } = await import("@/lib/stellar-utils")
      const bal = await getAccountBalance(key)
      setBalance(bal)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet"
      setError(message)
      console.error("[v0] Wallet connection error:", message)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setIsConnected(false)
    setPublicKey(null)
    setBalance(0)
    setError(null)
    setWalletType(null)
  }, [])

  const signTransaction = useCallback(
    async (tx: string) => {
      if (!walletType) {
        throw new Error("No wallet connected")
      }

      const connector = walletConnectors[walletType]
      return await connector.signTransaction(tx)
    },
    [walletType],
  )

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        publicKey,
        balance,
        isConnecting,
        error,
        walletType,
        connect,
        disconnect,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}

// Type augmentation for Freighter
declare global {
  interface Window {
    stellar?: {
      requestAccess: (options: { domain: string }) => Promise<{
        publicKey?: string
        error?: { message: string }
      }>
      signTransaction: (
        tx: string,
        options: { networkPassphrase: string },
      ) => Promise<{
        signedXDR?: string
        error?: { message: string }
      }>
    }
    freighter?: {
      requestAccess: (options: { domain: string }) => Promise<{
        publicKey?: string
        error?: { message: string }
      }>
      signTransaction: (
        tx: string,
        options: { networkPassphrase: string },
      ) => Promise<{
        signedXDR?: string
        error?: { message: string }
      }>
    }
  }
}
