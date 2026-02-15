"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { connectWallet, disconnectWallet } from "@/lib/redux/slices/wallet-slice"
import { processDonation, clearDonationError } from "@/lib/redux/slices/donation-slice"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function TestDonationPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { isConnected, publicKey, isConnecting, error: walletError } = useSelector((state: RootState) => state.wallet)
  const { isDonating, error: donationError, currentDonation } = useSelector((state: RootState) => state.donation)
  
  const [amount, setAmount] = useState("")
  const [taskId, setTaskId] = useState("test-task-123")

  const handleConnectWallet = async () => {
    dispatch(connectWallet('freighter'))
  }

  const handleDisconnectWallet = () => {
    dispatch(disconnectWallet())
  }

  const handleTestDonation = async () => {
    if (!isConnected || !publicKey || !amount) {
      return
    }

    // Create sign transaction function for Freighter
    const signTransactionFunction = async (transactionXDR: string) => {
      if (typeof window !== 'undefined' && (window as any).freighter) {
        const freighter = (window as any).freighter
        const signedXDR = await freighter.signTransaction(transactionXDR, {
          network: 'testnet',
          accountToSign: publicKey,
        })
        return signedXDR
      } else {
        throw new Error("Freighter wallet not available")
      }
    }

    // Clear any previous errors
    dispatch(clearDonationError())

    // Process donation through Redux
    dispatch(processDonation({
      amount: parseFloat(amount),
      currency: 'XLM',
      taskId,
      publicKey,
      signTransaction: signTransactionFunction,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Test Donation Flow</CardTitle>
            <CardDescription>
              Test the complete donation flow with real wallet integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wallet Status */}
            <div className="space-y-2">
              <h3 className="font-medium">Wallet Status</h3>
              {!isConnected ? (
                <div className="space-y-2">
                  <Button 
                    onClick={handleConnectWallet} 
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Freighter Wallet"
                    )}
                  </Button>
                  {walletError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{walletError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Wallet Connected</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1 font-mono">{publicKey}</p>
                  </div>
                  <Button 
                    onClick={handleDisconnectWallet} 
                    variant="outline" 
                    className="w-full"
                  >
                    Disconnect Wallet
                  </Button>
                </div>
              )}
            </div>

            {/* Donation Form */}
            {isConnected && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Test Donation</h3>
                  <Input
                    type="text"
                    placeholder="Task ID"
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Amount in XLM"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.0000001"
                  />
                </div>

                <Button 
                  onClick={handleTestDonation}
                  disabled={isDonating || !amount}
                  className="w-full"
                >
                  {isDonating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Donation...
                    </>
                  ) : (
                    "Test Donation"
                  )}
                </Button>

                {donationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{donationError}</AlertDescription>
                  </Alert>
                )}

                {currentDonation && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Donation Successful!</p>
                        <p className="text-xs font-mono">Amount: {currentDonation.amount} XLM</p>
                        <p className="text-xs font-mono">Task: {currentDonation.taskId}</p>
                        <p className="text-xs font-mono">TX: {currentDonation.transactionHash}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Install Freighter wallet extension</li>
                <li>2. Create a testnet account</li>
                <li>3. Connect your wallet</li>
                <li>4. Enter amount and test donation</li>
                <li>5. Sign the transaction in Freighter</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



