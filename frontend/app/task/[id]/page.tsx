"use client"

import { useState, useEffect, use } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { DonateModal } from "@/components/donate-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { StellarPriceDisplay } from "@/components/stellar-price-display"
import { Heart, Share2, MapPin, Loader2, ShieldCheck, Activity, Database } from "lucide-react"
import { apiService, type Post, type Donation } from "@/lib/api-service"
import { mockTasks } from "@/lib/mock-data"

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [isDonateOpen, setIsDonateOpen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [task, setTask] = useState<any>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch real data from API
  useEffect(() => {
    const loadTaskData = async () => {
      try {
        setIsLoading(true)

        // Get all posts and find the one matching the ID
        const postsResponse = await apiService.getPosts()

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
              const donationsResponse = await apiService.getDonationsByPostId(matchedPost._id)
              if (donationsResponse.success && donationsResponse.data) {
                setDonations(donationsResponse.data)
              }
            } catch (err) {
              console.log("No donations found for this task")
            }

            // Fetch expenses for this task
            try {
              const expensesResponse = await apiService.getExpensesByPostId(matchedPost._id)
              if (expensesResponse.success && expensesResponse.data) {
                const prevTxn = expensesResponse.data.prevTxn
                if (prevTxn) {
                  setExpenses(Array.isArray(prevTxn) ? prevTxn : [prevTxn])
                }
              }
            } catch (err) {
              console.log("No expenses found for this task")
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
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-orange-600" />
              <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500">SYNCING WITH SEIREITEI INTEL...</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">DATA CORRUPTION</h2>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">THE REQUESTED SIGNAL HAS BEEN WIPED FROM THE SOUL SOCIETY RECORDS.</p>
              <Button asChild className="bg-orange-600 hover:bg-orange-700 text-black font-black uppercase italic rounded-none skew-x-[-12deg]">
                <a href="/" className="px-8"><span className="skew-x-[12deg]">Return to Registry</span></a>
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
    <div className="min-h-screen bg-black">
      <Header />

      <div className="py-12 px-4 font-sans">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="w-2 h-10 bg-orange-600" />
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Mission Briefing</h1>
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
                <div className="space-y-4">
                  <div className="flex justify-between items-end text-[12px] font-black uppercase tracking-widest italic">
                    <span className="text-orange-500">Reiatsu Infused: {formatNumber(task.CollectedAmount || task.raised)}</span>
                    <span className="text-zinc-600">Required: {formatNumber(task.NeedAmount || task.goal)}</span>
                  </div>
                  <div className="h-2 bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-orange-600 transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">{donations.length || 0} REAPERS ALIGNED WITH THIS MISSION</p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-zinc-950 border border-zinc-900 rounded-none p-1 gap-1">
                  <TabsTrigger value="overview" className="rounded-none font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-orange-600 data-[state=active]:text-black">Seireitei Intel</TabsTrigger>
                  <TabsTrigger value="donations" className="rounded-none font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-orange-600 data-[state=active]:text-black">Spiritual Infusions</TabsTrigger>
                  <TabsTrigger value="expenses" className="rounded-none font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-orange-600 data-[state=active]:text-black">Treasury Audit</TabsTrigger>
                  <TabsTrigger value="proofs" className="rounded-none font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-orange-600 data-[state=active]:text-black">Tactical Proofs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-8">
                  <div className="prose prose-invert prose-orange max-w-none">
                    <p className="text-zinc-400 font-medium leading-relaxed whitespace-pre-line text-lg">
                      {task.Description || task.description || 'No detailed intelligence available for this operation.'}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="donations" className="mt-8">
                  <div className="space-y-4">
                    {donations.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-900">
                        <Activity className="h-8 w-8 text-zinc-800 mx-auto mb-4" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">NO INFUSIONS DETECTED IN THIS SECTOR</p>
                      </div>
                    ) : (
                      donations.map((donation, index) => (
                        <div key={donation._id || index} className="bg-zinc-950 border border-zinc-900 rounded-none p-6 space-y-4 hover:border-orange-500/30 transition-colors group">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-black text-white italic uppercase tracking-tighter text-lg">Reaper Contribution</p>
                              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                DETECTED AT: {new Date(donation.createdAt || Date.now()).toLocaleString()}
                              </p>
                            </div>
                            <p className="font-black text-xl text-orange-500 italic tracking-tighter">₹{donation.Amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <StellarPriceDisplay amount={donation.Amount} />
                          </div>
                          <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest truncate">
                            REI-ATSU SIGNATURE: {donation.currentTxn}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="expenses" className="mt-8">
                  <div className="space-y-4">
                    {expenses.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-900">
                        <Database className="h-8 w-8 text-zinc-800 mx-auto mb-4" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">TREASURY VAULT IS UNTOUCHED</p>
                      </div>
                    ) : (
                      expenses.map((expense, index) => (
                        <div key={index} className="bg-zinc-950 border border-zinc-900 rounded-none p-6 space-y-4 group">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-black text-white italic uppercase tracking-tighter text-lg">Resource Manifestation</p>
                              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                AUDITED TIMESTAMP: {new Date().toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-[8px] border border-orange-500/50 text-orange-500 px-2 py-1 font-mono uppercase tracking-[0.2em] italic">SEIREITEI VERIFIED</span>
                          </div>
                          <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest break-all leading-loose">
                            TACTICAL LOG EXCERPT: {JSON.stringify(expense).substring(0, 150)}...
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="proofs" className="mt-8">
                  <div className="space-y-4">
                    {donations.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-900">
                        <ShieldCheck className="h-8 w-8 text-zinc-800 mx-auto mb-4" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">PENDING TACTICAL PROOF SUBMISSION</p>
                      </div>
                    ) : (
                      donations.map((proof, index) => (
                        <div key={proof._id || index} className="bg-zinc-950 border border-zinc-900 rounded-none p-6 space-y-4 hover:border-blue-500/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-black text-white italic uppercase tracking-tighter text-lg">Execution Verified</p>
                              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                INFUSION TARGET: ₹{proof.Amount.toLocaleString()}
                              </p>
                            </div>
                            <span className="text-[8px] bg-blue-600 text-black px-2 py-1 font-black uppercase tracking-[0.2em] italic">FORGED IN BATTLE</span>
                          </div>
                          <div>
                            <StellarPriceDisplay amount={proof.Amount} />
                          </div>
                          <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest truncate">
                            BLOCKCHAIN HASH: {proof.currentTxn}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-zinc-950 border border-zinc-900 rounded-none p-8 space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Spiritual Pressure Level</p>
                  <div className="text-6xl font-black text-white italic tracking-tighter">
                    {Math.floor((((task.CollectedAmount || task.raised || 0) / (task.NeedAmount || task.goal || 1)) * 100) || 0)}%
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-mono text-zinc-500 uppercase">REMAINING:</span>
                    <span className="text-2xl font-black text-orange-500 italic">₹{Math.max(0, (task.NeedAmount || task.goal || 0) - (task.CollectedAmount || task.raised || 0)).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setIsDonateOpen(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-black font-black uppercase italic rounded-none tracking-widest h-14 skew-x-[-12deg]"
                    size="lg"
                  >
                    <span className="skew-x-[12deg]">Release Reiatsu</span>
                  </Button>

                  <Button variant="outline" className="w-full bg-black border-zinc-800 text-white font-black uppercase italic rounded-none tracking-widest skew-x-[-12deg]" size="lg">
                    <span className="skew-x-[12deg]">Transmit Order</span>
                  </Button>
                </div>

                <div className="pt-8 border-t border-zinc-900 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                    <div className="w-1 h-1 bg-orange-500 animate-pulse" />
                    Verified by Seireitei Protocol
                  </div>
                  <div className="space-y-3 font-mono">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-600 uppercase">ALIGNMENTS</span>
                      <span className="text-white font-bold">{donations.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-600 uppercase">AUDITED RECORDS</span>
                      <span className="text-white font-bold">{donations.length}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-[10px] text-zinc-600 uppercase block mb-1">TOTAL SPIRIT ENERGY GATHERED</span>
                      <div className="text-3xl font-black text-white italic tracking-tighter">₹{formatNumber(task.CollectedAmount || task.raised || 0)}</div>
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
    </div>
  )
}
