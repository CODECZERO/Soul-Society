"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Loader2, TrendingUp, AlertCircle, Zap } from "lucide-react"
import { convertRsToXlm, convertXlmToRs } from "@/lib/exchange-rates"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { processDonation, fetchExchangeRate, clearDonationError } from "@/lib/redux/slices/donation-slice"
import { signTransaction } from "@/lib/redux/slices/wallet-slice"
import { getDonorStats } from "@/lib/api-service"
import { Trophy } from "lucide-react"
import { addTrustline } from "@/lib/stellar-utils"

interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  task: any
}

export function DonateModal({ isOpen, onClose, onSuccess, task }: DonateModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { isConnected, publicKey, walletType } = useSelector((state: RootState) => state.wallet)
  const { isDonating, error: donationError, exchangeRate, currentDonation } = useSelector((state: RootState) => state.donation)

  const [step, setStep] = useState<"amount" | "confirm" | "success" | "error">("amount")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<'INR' | 'XLM'>('INR')
  const [txHash, setTxHash] = useState("")
  const [donorBadge, setDonorBadge] = useState<any>(null)
  const [isAddingToken, setIsAddingToken] = useState(false)

  const presetAmounts = [50, 100, 200, 500]
  const stellarAmount = currency === 'INR' && amount ? convertRsToXlm(Number.parseFloat(amount), exchangeRate) : Number.parseFloat(amount) || 0
  const inrAmount = currency === 'XLM' && amount ? convertXlmToRs(Number.parseFloat(amount), exchangeRate) : Number.parseFloat(amount) || 0

  useEffect(() => {
    // Fetch exchange rate when modal opens
    if (isOpen) {
      dispatch(fetchExchangeRate())
    }
  }, [isOpen, dispatch])

  useEffect(() => {
    // Handle donation success
    if (currentDonation && currentDonation.transactionHash) {
      setTxHash(currentDonation.transactionHash)
      setStep("success")
      // Fetch donor stats to show badge update
      if (publicKey) {
        getDonorStats(publicKey).then(res => {
          if (res.success) setDonorBadge(res.data)
        })
      }
      // Trigger refresh on parent
      if (onSuccess) onSuccess()
    }
  }, [currentDonation])

  useEffect(() => {
    // Handle donation error
    if (donationError) {
      setStep("error")
    }
  }, [donationError])


  const handleConfirm = async () => {
    if (!isConnected || !publicKey || !walletType) {

      return;
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      return
    }

    // Clear any previous errors
    dispatch(clearDonationError())

    // Create sign transaction function for Freighter
    const signTransactionFunction = async (transactionXDR: string) => {
      const result = await dispatch(signTransaction(transactionXDR))
      if (result.type.endsWith('rejected')) {
        throw new Error(result.payload as string)
      }
      return result.payload as string
    }

    // Get receiver wallet address from task data with fallbacks
    const receiverWalletAddress = task.WalletAddr || task.walletAddr || task.walletAddress || task.WalletAddress;


    if (!receiverWalletAddress) {
      alert("Error: NGO wallet address not found in task data. Please contact support.")
      return
    }

    // Additional validation for Stellar public key format
    if (!receiverWalletAddress.startsWith('G') || receiverWalletAddress.length !== 56) {
      alert("Error: Invalid NGO wallet address format.")
      return
    }


    // Process donation through Redux
    dispatch(processDonation({
      amount: Number.parseFloat(amount),
      currency,
      taskId: typeof task.id === 'string' ? task.id : String(task.id), // Handle both string and number IDs
      publicKey,
      receiverPublicKey: receiverWalletAddress, // Pass NGO's wallet address from post data
      signTransaction: signTransactionFunction,
    }))
  }

  const handleClose = () => {
    setStep("amount")
    setAmount("")
    setTxHash("")
    setCurrency('INR')
    dispatch(clearDonationError())
    onClose()
  }

  const handleAddToken = async () => {
    if (!publicKey) return;
    setIsAddingToken(true);
    try {
      // Use the signTransaction thunk to prompt the wallet
      await addTrustline(publicKey, (xdr) => dispatch(signTransaction(xdr)).unwrap());
      alert("REI Token successfully added to your wallet! 🚀");
    } catch (error: any) {
      console.error("Failed to add token:", error);
      alert(error.message || "Failed to add token. Please try manually.");
    } finally {
      setIsAddingToken(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-zinc-950 border border-zinc-800 rounded-lg p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="mb-6 border-b border-zinc-800 pb-3">
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            {step === "amount" && "Make a Donation"}
            {step === "confirm" && "Confirm Donation"}
            {step === "success" && "Donation Successful"}
            {step === "error" && "Transaction Failed"}
          </DialogTitle>
        </DialogHeader>

        {step === "amount" && (
          <div className="space-y-4">
            {!isConnected && (
              <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-300">Please connect your wallet to donate</p>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-foreground">Amount</label>
                <div className="flex bg-zinc-800 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setCurrency('INR')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${currency === 'INR'
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                      }`}
                    disabled={!isConnected}
                  >
                    ₹ INR
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('XLM')}
                    className={`px-4 py-1 text-[10px] font-black uppercase italic transition-all ${currency === 'XLM'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-500 hover:text-white'
                      }`}
                    disabled={!isConnected}
                  >
                    XLM
                  </button>
                </div>
              </div>

              <Input
                type="number"
                placeholder={`ENTER AMOUNT IN ${currency}...`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-zinc-900 border-zinc-800 rounded-md text-white font-mono placeholder:text-zinc-600 focus-visible:ring-amber-500 h-12"
                disabled={!isConnected}
                step="0.0000001"
              />

              {amount && (
                <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500">
                      {currency === 'INR' ? 'Stellar Equivalent' : 'INR Equivalent'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 animate-pulse">
                      <TrendingUp className="h-3 w-3" />
                      <span>Live</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white tracking-tight transition-all duration-300">
                    {currency === 'INR'
                      ? `${stellarAmount.toFixed(4)} XLM`
                      : `₹${inrAmount.toFixed(2)}`
                    }
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    1 XLM = ₹{exchangeRate.toFixed(2)} (Live Rate)
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Quick amounts</p>
              <div className="grid grid-cols-4 gap-2">
                {(currency === 'INR' ? presetAmounts : [1, 2, 5, 10]).map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset.toString() ? "default" : "outline"}
                    onClick={() => setAmount(preset.toString())}
                    className="text-sm"
                    disabled={!isConnected}
                  >
                    {currency === 'INR' ? `₹${preset}` : `${preset} XLM`}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setStep("confirm")}
              disabled={!amount || !isConnected}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md h-11"
            >
              Continue to Confirm
            </Button>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-400">Amount ({currency})</p>
              <p className="text-2xl font-bold text-white">
                {currency === 'INR' ? `₹${amount}` : `${amount} XLM`}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-950/40 to-blue-900/30 rounded-lg p-4 border border-blue-800/50">
              <p className="text-sm text-zinc-400">
                Amount ({currency === 'INR' ? 'Stellar' : 'INR'})
              </p>
              <p className="text-2xl font-bold text-blue-400">
                {currency === 'INR'
                  ? `${stellarAmount.toFixed(4)} XLM`
                  : `₹${inrAmount.toFixed(2)}`
                }
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Exchange Rate: 1 XLM = ₹{exchangeRate.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-400">Task</p>
              <p className="font-semibold text-white">{task.title}</p>
            </div>

            <Button onClick={handleConfirm} disabled={isDonating} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              {isDonating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Transaction...
                </>
              ) : (
                "Sign with Wallet"
              )}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 sm:space-y-6 text-center py-4">
            <div className="flex justify-center">
              <div className="bg-accent/10 p-3 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-accent animate-in zoom-in duration-300" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-zinc-400 font-medium uppercase tracking-wider">Spiritual Pressure Infused</p>
              <p className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter">
                {currency === 'INR' ? `₹${amount}` : `₹${inrAmount.toFixed(2)}`}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-950/40 to-amber-900/30 rounded-lg p-3 sm:p-4 border border-amber-800/50 flex justify-between items-center text-left">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">Stellar Infusion</p>
                <p className="text-lg sm:text-xl font-bold text-amber-400">
                  {currency === 'INR' ? stellarAmount.toFixed(4) : amount} XLM
                </p>
              </div>
              <div className="bg-amber-400/10 p-2 rounded-md">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4 text-left">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Transaction Hash</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddToken}
                    disabled={isAddingToken}
                    className="text-[10px] text-blue-500 hover:underline font-bold disabled:opacity-50"
                  >
                    {isAddingToken ? "ADDING..." : "ADD TO WALLET"}
                  </button>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-amber-500 hover:underline font-bold"
                  >
                    VIEW ON-CHAIN
                  </a>
                </div>
              </div>
              <p className="font-mono text-[10px] text-zinc-400 break-all leading-relaxed bg-black/30 p-2 rounded border border-zinc-800/50">
                {txHash}
              </p>
            </div>

            {donorBadge && (
              <div className="mt-2 p-3 sm:p-4 bg-zinc-900 border border-amber-500/30 rounded-md relative overflow-hidden group text-left">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-700">
                  <Trophy className="h-24 w-24 text-amber-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Donor Recognition</p>
                  </div>
                  <h4 className="text-lg font-black text-white italic uppercase mb-2 tracking-tighter">
                    {donorBadge.currentBadge}
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      let nextThreshold = 20;
                      if (donorBadge.totalReiatsu >= 500) nextThreshold = 1000; // Next goal after Captain
                      else if (donorBadge.totalReiatsu >= 100) nextThreshold = 500;
                      else if (donorBadge.totalReiatsu >= 20) nextThreshold = 100;

                      return (
                        <>
                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((donorBadge.totalReiatsu / nextThreshold) * 100, 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-zinc-500">{donorBadge.totalReiatsu} REIATSU</span>
                            <span className="text-amber-500">NEXT: {nextThreshold}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
                    You've reached the <span className="text-amber-400 font-bold">{donorBadge.currentBadge}</span> level. Keep going!
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button onClick={handleClose} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-md h-12">
                Mission Accomplished
              </Button>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4">
            <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Transaction Failed</p>
                <p className="text-sm text-red-400 mt-1">{donationError}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={() => setStep("confirm")} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Try Again
              </Button>
              <Button onClick={handleClose} variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
