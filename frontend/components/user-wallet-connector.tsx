"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { connectWallet, disconnectWallet } from "@/lib/redux/slices/wallet-slice"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Wallet, ExternalLink, AlertCircle, CheckCircle } from "lucide-react"
import { WalletSelector } from "./wallet-selector"

interface UserWalletConnectorProps {
  onConnect?: (publicKey: string) => void
  onDisconnect?: () => void
  className?: string
}

export function UserWalletConnector({ 
  onConnect, 
  onDisconnect, 
  className = "" 
}: UserWalletConnectorProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { isConnected, publicKey, isConnecting, error } = useSelector((state: RootState) => state.wallet)
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false)

  const handleConnect = async (walletType: string) => {
    try {
      await dispatch(connectWallet(walletType))
      if (onConnect && publicKey) {
        onConnect(publicKey)
      }
    } catch (error) {
      console.error("Wallet connection failed:", error)
    }
  }

  const handleDisconnect = () => {
    dispatch(disconnectWallet())
    if (onDisconnect) {
      onDisconnect()
    }
  }

  if (isConnected && publicKey) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Wallet Connected</p>
              <p className="text-xs text-muted-foreground font-mono">
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className={`p-6 text-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Wallet className="h-8 w-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Stellar wallet to donate and interact with campaigns
            </p>
          </div>

          {error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={() => setWalletSelectorOpen(true)}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground">
            <p>Supported wallets: Freighter, Albedo, LOBSTR</p>
            <a 
              href="https://freighter.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              Install Freighter <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </Card>

      <WalletSelector 
        isOpen={walletSelectorOpen} 
        onClose={() => setWalletSelectorOpen(false)}
        onSelect={handleConnect}
      />
    </>
  )
}
