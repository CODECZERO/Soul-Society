"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Loader2, Upload, AlertCircle, Wallet } from "lucide-react"
import { apiService } from "@/lib/api-service"

interface NGOSendPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  task: any  // The selected task/post
}

export function NGOSendPaymentModal({ isOpen, onClose, task }: NGOSendPaymentModalProps) {
  const [step, setStep] = useState<"form" | "uploading" | "processing" | "success" | "error">("form")
  const [formData, setFormData] = useState({
    receiverWallet: "",
    amount: "",
    description: "",
    file: null as File | null,
  })
  const [ipfsCid, setIpfsCid] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, file: e.target.files[0] })
    }
  }

  const handleSubmit = async () => {
    if (!task) {
      setError("No task selected")
      setStep("error")
      return
    }

    setError(null)
    
    try {
      // Step 1: Upload receipt to IPFS
      setStep("uploading")
      let cid = "Pending"
      
      if (formData.file) {
        try {
          const uploadResponse = await apiService.uploadToIPFS(formData.file)
          if (uploadResponse.success) {
            cid = uploadResponse.data.cid || uploadResponse.data.hash
            setIpfsCid(cid)
            console.log("Receipt uploaded to IPFS:", cid)
          }
        } catch (uploadError) {
          console.error("IPFS upload error:", uploadError)
          // Continue with "Pending" CID
        }
      }

      // Step 2: Send payment via backend
      setStep("processing")
      
      const paymentData = {
        PublicKey: formData.receiverWallet,
        PostId: task.id || task._id,
        Amount: parseFloat(formData.amount),
        Cid: cid,
      }

      console.log("Sending payment:", paymentData)
      
      const response = await apiService.walletPay(paymentData)
      
      if (response.success) {
        setTransactionHash(response.data?.transactionHash || "Success")
        setStep("success")
      } else {
        throw new Error(response.message || "Payment failed")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send payment"
      setError(message)
      setStep("error")
      console.error("Payment error:", err)
    }
  }

  const handleClose = () => {
    setStep("form")
    setFormData({ receiverWallet: "", amount: "", description: "", file: null })
    setIpfsCid("")
    setTransactionHash("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "form" && "Send Payment"}
            {step === "uploading" && "Uploading Receipt..."}
            {step === "processing" && "Processing Payment..."}
            {step === "success" && "Payment Sent Successfully"}
            {step === "error" && "Payment Failed"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4">
            {task && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium">Selected Task</p>
                <p className="font-semibold text-sm text-foreground">{task.title || task.Title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Task ID: {(task.id || task._id)?.slice(-8)}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important</p>
                <p className="text-xs mt-1">
                  Payment will be sent from the NGO wallet associated with this task. 
                  Ensure you have sufficient balance.
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Receiver Wallet Address</label>
              <Input
                placeholder="Enter Stellar wallet address (G...)"
                value={formData.receiverWallet}
                onChange={(e) => setFormData({ ...formData, receiverWallet: e.target.value })}
                className="mt-2 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Stellar address starting with 'G' (56 characters)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Amount (XLM)</label>
              <Input
                type="number"
                step="0.0000001"
                placeholder="Enter amount in XLM"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                placeholder="Describe the purpose of this payment (e.g., Payment to vendor for supplies)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Receipt/Proof (Required)</label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition">
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="payment-file-input"
                  accept="image/*,application/pdf"
                />
                <label htmlFor="payment-file-input" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {formData.file ? formData.file.name : "Click to upload receipt"}
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
                </label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                !formData.receiverWallet || 
                !formData.amount || 
                !formData.description || 
                !formData.file ||
                parseFloat(formData.amount) <= 0
              }
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Send Payment
            </Button>
          </div>
        )}

        {step === "uploading" && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
            <p className="text-muted-foreground">Uploading receipt to IPFS...</p>
            <p className="text-xs text-muted-foreground">This may take a few moments</p>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
            <p className="text-muted-foreground">Processing payment on Stellar network...</p>
            <p className="text-xs text-muted-foreground">Please wait while the transaction is being processed</p>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Payment Sent</p>
              <p className="text-2xl font-bold text-foreground">{formData.amount} XLM</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-mono text-xs text-foreground break-all">
                  {formData.receiverWallet}
                </p>
              </div>
              
              {ipfsCid && ipfsCid !== "Pending" && (
                <div>
                  <p className="text-xs text-muted-foreground">Receipt CID</p>
                  <p className="font-mono text-xs text-foreground break-all">{ipfsCid}</p>
                </div>
              )}
              
              {transactionHash && transactionHash !== "Success" && (
                <div>
                  <p className="text-xs text-muted-foreground">Transaction Hash</p>
                  <p className="font-mono text-xs text-foreground break-all">{transactionHash}</p>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Payment has been recorded on the blockchain and saved to the expense ledger.
            </p>

            <Button onClick={handleClose} className="w-full bg-primary hover:bg-primary/90">
              Done
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Payment Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={() => setStep("form")} className="w-full bg-primary hover:bg-primary/90">
                Try Again
              </Button>
              <Button onClick={handleClose} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
