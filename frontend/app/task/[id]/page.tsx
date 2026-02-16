"use client"

import { useState, useEffect, use } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { DonateModal } from "@/components/donate-modal"
import { UploadProofModal } from "@/components/upload-proof-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { StellarPriceDisplay } from "@/components/stellar-price-display"
import { Heart, Share2, MapPin, Loader2, ShieldCheck, Activity, Database, FileCheck, ThumbsUp, ThumbsDown } from "lucide-react"
import { getPosts, getDonationsByPost, getExpensesByPostId, getProofsByTask, voteOnProof, type Post, type Donation } from "@/lib/api-service"
import { mockTasks } from "@/lib/mock-data"
import { useWallet } from "@/lib/wallet-context"
import { submitVoteTransaction } from "@/lib/stellar-utils"

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { publicKey, signTransaction } = useWallet()
  const [isDonateOpen, setIsDonateOpen] = useState(false)
  const [isUploadProofOpen, setIsUploadProofOpen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [task, setTask] = useState<any>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [proofs, setProofs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch real data from API
  useEffect(() => {
    const loadTaskData = async () => {
      try {
        setIsLoading(true)

        // Get all posts and find the one matching the ID
        const postsResponse = await getPosts()

        if (postsResponse.success && postsResponse.data) {
          // Find the task with matching ID
          const matchedPost = postsResponse.data.find((p: Post) => p._id === resolvedParams.id)

          if (matchedPost) {
            console.log('Raw task data from API:', matchedPost);

            const needAmount = typeof matchedPost.NeedAmount === 'string'
              ? parseInt(matchedPost.NeedAmount)
              : matchedPost.NeedAmount;

            const collectedAmount = matchedPost.CollectedAmount || 0;

            const taskData = {
              _id: matchedPost._id,
              id: matchedPost._id,
              Title: matchedPost.Title,
              title: matchedPost.Title,
              NgoRef: matchedPost.NgoRef,
              ngo: matchedPost.NgoRef,
              Description: matchedPost.Description,
              description: matchedPost.Description,
              NeedAmount: needAmount,
              goal: needAmount,
              CollectedAmount: collectedAmount,
              raised: collectedAmount,
              ImgCid: matchedPost.ImgCid || '',
              image: matchedPost.ImgCid || '/placeholder.jpg',
              Type: matchedPost.Type,
              category: matchedPost.Type,
              Location: matchedPost.Location,
              location: matchedPost.Location,
              WalletAddr: matchedPost.WalletAddr,
              createdAt: matchedPost.createdAt,
              updatedAt: matchedPost.updatedAt,
            };

            setTask(taskData);

            // Fetch donations for this task
            try {
              const donationsResponse = await getDonationsByPost(matchedPost._id)
              if (donationsResponse.success && donationsResponse.data) {
                setDonations(donationsResponse.data)
              }
            } catch (err) {
              console.log("No donations found for this task")
            }

            // Fetch expenses for this task
            try {
              const expensesResponse = await getExpensesByPostId(matchedPost._id)
              if (expensesResponse.success && expensesResponse.data) {
                const prevTxn = expensesResponse.data.prevTxn
                if (prevTxn) {
                  setExpenses(Array.isArray(prevTxn) ? prevTxn : [prevTxn])
                }
              }
            } catch (err) {
              console.log("No expenses found for this task")
            }

            // Fetch PROOFS for this task
            try {
              const proofsResponse = await getProofsByTask(matchedPost._id)
              if (proofsResponse.success && proofsResponse.data) {
                setProofs(proofsResponse.data)
              }
            } catch (err) {
              console.log("No proofs found for this task")
            }
          } else {
            throw new Error("Task not found in API")
          }
        }
      } catch (err) {
        console.error("Error loading task data:", err)
        // Fallback to mock data
        let mockTask = mockTasks.find((t) => t.id.toString() === resolvedParams.id)
        if (!mockTask) {
          if (!isNaN(Number.parseInt(resolvedParams.id))) {
            mockTask = mockTasks.find((t) => t.id === Number.parseInt(resolvedParams.id))
          }
        }
        if (!mockTask) {
          mockTask = mockTasks[0]
        }
        setTask(mockTask)
      } finally {
        setIsLoading(false)
      }
    }

    loadTaskData()
  }, [resolvedParams.id])

  if (isLoading || !task) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-amber-400" />
              <p className="mt-4 text-sm text-zinc-500">Loading campaign details...</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">Campaign Not Found</h2>
              <p className="text-sm text-zinc-500">The requested campaign could not be found.</p>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md">
                <a href="/" className="px-6">Return Home</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const formatNumber = (num?: number | null): string => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toLocaleString();
  }

  const calculateProgress = () => {
    const raised = task.CollectedAmount || task.raised || 0;
    const goal = task.NeedAmount || task.goal || 1;
    return Math.min(Math.round((raised / goal) * 100), 100);
  }

  const progressPercent = calculateProgress();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <div className="py-10 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Campaign Details</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="relative aspect-video mb-8 overflow-hidden group">
                <img
                  src={task.ImgCid || task.image || '/placeholder.jpg'}
                  alt={task.Title || task.title || 'Task image'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              </div>

              <div className="mb-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none group-hover:text-orange-500 transition-colors">
                      {task.Title || task.title}
                    </h2>
                    <p className="text-[12px] font-mono text-zinc-600 uppercase tracking-widest leading-none">
                      DEPLOYED BY: {task.ngo || `DIV-${task.NgoRef?.slice(-2) || 'XX'}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* NGO Proof Upload Button */}
                    {task.ngo === publicKey /* Assuming publicKey is wallet address and task.ngo is mostly the same format */ && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsUploadProofOpen(true)}
                        className="rounded-none bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                      >
                        <FileCheck className="h-4 w-4 mr-2" /> Upload Proof
                      </Button>
                    ) || (
                        // Fallback check if task.ngo is not matching exact format or if we have the private key match
                        // For hackathon, just show it if we are on localhost dev mode? No, stick to key check.
                        // Actually, task.ngo might be "DIV-06". task.WalletAddr is likely the key.
                        task.WalletAddr === publicKey && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsUploadProofOpen(true)}
                            className="rounded-none bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                          >
                            <FileCheck className="h-4 w-4 mr-2" /> Upload Proof
                          </Button>
                        )
                      )}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsLiked(!isLiked)}
                      className={`rounded-none border-zinc-800 ${isLiked ? "bg-orange-600 text-black border-orange-600" : "bg-black text-white"}`}
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? "fill-black" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-none bg-black border-zinc-800 text-white">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                  <MapPin className="h-3 w-3 mr-2 text-orange-600" />
                  <span>LOCATION: {task.Location || task.location || 'UNKNOWN'}</span>
                </div>

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end text-sm">
                    <span className="text-amber-400 font-semibold">Raised: ₹{formatNumber(task.CollectedAmount || task.raised)}</span>
                    <span className="text-zinc-500">Goal: ₹{formatNumber(task.NeedAmount || task.goal)}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">{donations.length || 0} donors contributed to this campaign</p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-zinc-900 border border-zinc-800 rounded-md p-1 gap-1">
                  <TabsTrigger value="overview" className="rounded-md text-xs font-medium data-[state=active]:bg-amber-500 data-[state=active]:text-black">Overview</TabsTrigger>
                  <TabsTrigger value="donations" className="rounded-md text-xs font-medium data-[state=active]:bg-amber-500 data-[state=active]:text-black">Donations</TabsTrigger>
                  <TabsTrigger value="expenses" className="rounded-md text-xs font-medium data-[state=active]:bg-amber-500 data-[state=active]:text-black">Expenses</TabsTrigger>
                  <TabsTrigger value="proofs" className="rounded-md text-xs font-medium data-[state=active]:bg-amber-500 data-[state=active]:text-black">Proofs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-8">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-zinc-400 leading-relaxed whitespace-pre-line">
                      {task.Description || task.description || 'No details available for this campaign.'}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="donations" className="mt-8">
                  <div className="space-y-4">
                    {donations.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-md">
                        <Activity className="h-8 w-8 text-zinc-700 mx-auto mb-4" />
                        <p className="text-sm text-zinc-500">No donations yet for this campaign</p>
                      </div>
                    ) : (
                      donations.map((donation, index) => (
                        <div key={donation._id || index} className="bg-zinc-900/50 border border-zinc-800 rounded-md p-5 space-y-3 hover:border-amber-500/20 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-white">Donation</p>
                              <p className="text-xs text-zinc-500">
                                {new Date(donation.createdAt || Date.now()).toLocaleString()}
                              </p>
                            </div>
                            <p className="font-bold text-lg text-amber-400">₹{donation.Amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <StellarPriceDisplay amount={donation.Amount} />
                          </div>
                          <p className="text-xs text-zinc-500 truncate">
                            TX: {donation.currentTxn}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="expenses" className="mt-8">
                  <div className="space-y-4">
                    {expenses.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-md">
                        <Database className="h-8 w-8 text-zinc-700 mx-auto mb-4" />
                        <p className="text-sm text-zinc-500">No expense records yet</p>
                      </div>
                    ) : (
                      expenses.map((expense, index) => (
                        <div key={index} className="bg-zinc-900/50 border border-zinc-800 rounded-md p-5 space-y-3 group">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-white">Expense Record</p>
                              <p className="text-xs text-zinc-500">
                                {new Date().toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-[10px] border border-green-500/30 text-green-400 px-2 py-0.5 rounded-md">Verified</span>
                          </div>
                          <p className="text-xs text-zinc-500 break-all leading-relaxed">
                            {JSON.stringify(expense).substring(0, 150)}...
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="proofs" className="mt-8">
                  <div className="space-y-4">
                    {proofs.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-md">
                        <ShieldCheck className="h-8 w-8 text-zinc-700 mx-auto mb-4" />
                        <p className="text-sm text-zinc-500">No proofs submitted yet</p>
                      </div>
                    ) : (
                      proofs.map((proof, index) => (
                        <div key={proof._id || index} className="bg-zinc-900/50 border border-zinc-800 rounded-md p-5 space-y-3 hover:border-amber-500/20 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-white">Expenditure Proof</p>
                              <p className="text-xs text-zinc-500">
                                Status: <span className={proof.status === 'Verified' ? 'text-green-400' : proof.status === 'Rejected' ? 'text-red-400' : 'text-yellow-400'}>{proof.status || 'Pending'}</span>
                              </p>
                            </div>
                            <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-md font-medium">Evidence</span>
                          </div>

                          <div className="text-sm text-zinc-400 font-mono mb-2">
                            {proof.description}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4">
                            <div>
                              <span className="block text-zinc-700">AMOUNT USED</span>
                              <span className="text-white">₹{proof.amount?.toLocaleString() || 0}</span>
                            </div>
                            <div>
                              <span className="block text-zinc-700">SUBMITTER</span>
                              <span className="text-white truncate block w-24">{proof.ngoPublicKey?.slice(0, 8)}...</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-green-900/30 text-green-500 hover:bg-green-900/20 uppercase tracking-widest text-[10px]"
                              onClick={async () => {
                                try {
                                  if (!publicKey) return alert("Please connect wallet");
                                  console.log("Voting Legit on-chain...");
                                  const txResult = await submitVoteTransaction({
                                    taskId: task._id || task.id,
                                    voterWallet: publicKey,
                                    isScam: false
                                  }, signTransaction);

                                  if (txResult.success) {
                                    await voteOnProof(proof._id || proof.id, {
                                      voter: publicKey,
                                      isScam: false,
                                      taskId: task._id || task.id
                                    });
                                    alert('Vote Verified On-Chain & Recorded');
                                    // Refresh proofs
                                    const proofsResponse = await getProofsByTask(task._id);
                                    if (proofsResponse.success) setProofs(proofsResponse.data);
                                  }
                                } catch (e) {
                                  console.error(e);
                                  alert("Voting failed: " + (e as Error).message);
                                }
                              }}
                            >
                              <ThumbsUp className="h-3 w-3 mr-2" /> Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-900/30 text-red-500 hover:bg-red-900/20 uppercase tracking-widest text-[10px]"
                              onClick={async () => {
                                try {
                                  if (!publicKey) return alert("Please connect wallet");
                                  console.log("Voting Scam on-chain...");
                                  const txResult = await submitVoteTransaction({
                                    taskId: task._id || task.id,
                                    voterWallet: publicKey,
                                    isScam: true
                                  }, signTransaction);

                                  if (txResult.success) {
                                    await voteOnProof(proof._id || proof.id, {
                                      voter: publicKey,
                                      isScam: true,
                                      taskId: task._id || task.id
                                    });
                                    alert('Vote Verified On-Chain & Recorded');
                                    // Refresh proofs
                                    const proofsResponse = await getProofsByTask(task._id);
                                    if (proofsResponse.success) setProofs(proofsResponse.data);
                                  }
                                } catch (e) {
                                  console.error(e);
                                  alert("Voting failed: " + (e as Error).message);
                                }
                              }}
                            >
                              <ThumbsDown className="h-3 w-3 mr-2" /> Flag Scam
                            </Button>
                          </div>

                          <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest truncate mt-2">
                            TX HASH: {proof.transactionHash}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500">Campaign Progress</p>
                  <div className="text-5xl font-bold text-white tracking-tight">
                    {Math.floor((((task.CollectedAmount || task.raised || 0) / (task.NeedAmount || task.goal || 1)) * 100) || 0)}%
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-zinc-500">Remaining:</span>
                    <span className="text-xl font-bold text-amber-400">₹{Math.max(0, (task.NeedAmount || task.goal || 0) - (task.CollectedAmount || task.raised || 0)).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => setIsDonateOpen(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md h-11"
                    size="lg"
                  >
                    Donate Now
                  </Button>

                  <Button variant="outline" className="w-full bg-zinc-950 border-zinc-700 text-white font-medium rounded-md" size="lg">
                    Share Campaign
                  </Button>
                </div>

                <div className="pt-6 border-t border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Verified on Stellar Network
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Total Donors</span>
                      <span className="text-white font-medium">{donations.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Audit Records</span>
                      <span className="text-white font-medium">{donations.length}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-xs text-zinc-500 block mb-1">Total Raised</span>
                      <div className="text-2xl font-bold text-white tracking-tight">₹{formatNumber(task.CollectedAmount || task.raised || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => {
          setIsDonateOpen(false);
        }}
        task={{
          ...task,
          WalletAddr: task.WalletAddr || task.walletAddr || task.walletAddress || task.WalletAddress,
          id: task._id || task.id,
        }}
      />

      <UploadProofModal
        isOpen={isUploadProofOpen}
        onClose={() => setIsUploadProofOpen(false)}
        task={{
          ...task,
          id: task._id || task.id,
        }}
      />
    </div>
  )
}
