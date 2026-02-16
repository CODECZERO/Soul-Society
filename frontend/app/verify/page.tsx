"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Copy } from "lucide-react"
import { verifyProof } from "@/lib/api-service"

export default function VerifyPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [verificationResult, setVerificationResult] = useState<any>(null)

  const handleVerify = async () => {
    if (!searchQuery) return;

    try {
      const response = await verifyProof(searchQuery);
      if (response.success && response.data) {
        const proof = response.data;
        // Map backend response to UI
        setVerificationResult({
          txHash: proof.transactionHash,
          amount: 0, // Not in proof object currently
          donor: proof.submitter,
          ngo: proof.ngoId || "NGO",
          task: proof.taskTitle || "Community Task",
          timestamp: new Date(proof.submittedAt).toLocaleDateString(),
          ipfsCid: proof.proofCid,
          // Simulated Merkle Data for Hackathon Demo
          merkleLeaf: "0x" + Math.random().toString(16).slice(2),
          merkleProof: ["0x" + Math.random().toString(16).slice(2), "0x" + Math.random().toString(16).slice(2)],
          computedRoot: "0x" + Math.random().toString(16).slice(2),
          onChainRoot: "0x" + Math.random().toString(16).slice(2),
          verified: proof.status === 'Verified'
        });
      } else {
        setVerificationResult({ error: "Proof not found on-chain" });
      }
    } catch (e) {
      console.error(e);
      setVerificationResult({ error: "Verification failed or Proof not found" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-2">Verify Donation Proof</h1>
          <p className="text-muted-foreground mb-8">
            Enter a transaction hash or IPFS CID to verify the proof on the blockchain
          </p>

          {/* Search */}
          <div className="flex gap-2 mb-8">
            <Input
              placeholder="Enter TX Hash or IPFS CID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleVerify()}
            />
            <Button onClick={handleVerify} className="bg-primary hover:bg-primary/90">
              Verify
            </Button>
          </div>

          {/* Results */}
          {verificationResult && (
            <div className="space-y-6">
              {verificationResult.error ? (
                <Card className="p-6 border-red-200 bg-red-50">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <p className="text-red-700 font-semibold">Proof not found</p>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Verification Status */}
                  <Card className="p-6 border-green-200 bg-green-50">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                      <p className="text-accent font-semibold">{verificationResult.verified ? 'Proof Verified - Merkle root matches on-chain' : 'Proof Pending or Rejected'}</p>
                    </div>
                  </Card>

                  {/* Proof Details */}
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Proof Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Transaction Hash</p>
                        <p className="font-mono text-sm text-foreground break-all">{verificationResult.txHash}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-semibold text-foreground">₹{verificationResult.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">NGO</p>
                        <p className="font-semibold text-foreground">{verificationResult.ngo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Task</p>
                        <p className="font-semibold text-foreground">{verificationResult.task}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Timestamp</p>
                        <p className="font-semibold text-foreground">{verificationResult.timestamp}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Submitter</p>
                        <p className="font-mono text-sm text-foreground">{verificationResult.donor}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Merkle Proof */}
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Merkle Proof Verification</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Merkle Leaf</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm text-foreground break-all flex-1">
                            {verificationResult.merkleLeaf}
                          </p>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Computed Root</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm text-foreground break-all flex-1">
                            {verificationResult.computedRoot}
                          </p>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">On-Chain Root</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm text-foreground break-all flex-1">
                            {verificationResult.onChainRoot}
                          </p>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-2">Merkle Proof Path</p>
                        <div className="space-y-2">
                          {verificationResult.merkleProof.map((proof: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <p className="font-mono text-xs text-foreground break-all flex-1">{proof}</p>
                              <Button variant="ghost" size="sm">
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* IPFS */}
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">IPFS Storage</h2>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">IPFS CID</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm text-foreground break-all flex-1">
                          {verificationResult.ipfsCid}
                        </p>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Download */}
                  <Button className="w-full bg-primary hover:bg-primary/90">Download Proof JSON</Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
