"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CreateTaskModal } from "@/components/create-task-modal"
import { UploadProofModal } from "@/components/upload-proof-modal"
import { NGOSendPaymentModal } from "@/components/ngo-send-payment-modal"
import { Plus, Upload, CheckCircle2, Clock, Loader2, Send } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux"
import { fetchPosts } from "@/lib/redux/slices/posts-slice"
import { fetchAllDonations } from "@/lib/redux/slices/donations-slice"
import { fetchNgoStats } from "@/lib/redux/slices/stats-slice"
import { useDebouncedDispatch } from "@/hooks/use-debounced-dispatch"

// Simple chart component to avoid recharts SSR issues
const SimpleChart = ({ data }: { data: any[] }) => {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="h-[300px] w-full p-4">
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-amber-500 rounded-t-md"
              style={{
                height: `${(item.value / maxValue) * 200}px`,
                minHeight: '4px'
              }}
            />
            <div className="text-xs text-zinc-500 mt-2 text-center">
              {item.name}
            </div>
            <div className="text-xs font-medium text-zinc-300">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NGODashboardPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const debouncedDispatch = useDebouncedDispatch()

  const { isAuthenticated, ngoProfile, isLoading: authLoading } = useAppSelector((state) => state.ngoAuth)
  const { posts, isLoading: postsLoading } = useAppSelector((state) => state.posts)
  const { donations, isLoading: donationsLoading } = useAppSelector((state) => state.donations)
  const { ngoStats, isLoading: statsLoading } = useAppSelector((state) => state.stats)

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isUploadProofOpen, setIsUploadProofOpen] = useState(false)
  const [isSendPaymentOpen, setIsSendPaymentOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  const isLoading = postsLoading || donationsLoading || statsLoading

  const currentNgoStats = ngoProfile ? ngoStats[ngoProfile.id] : null

  const stats = {
    totalDonations: currentNgoStats?.totalRaised || 0,
    fundsUsed: currentNgoStats?.totalSpent || 0,
    remainingBalance: currentNgoStats?.remainingBalance || 0,
    verifiedProjects: posts.filter(p => p.NgoRef === ngoProfile?.id).length,
  }

  const chartData = currentNgoStats?.chartData.map((d: any) => ({
    name: d.name,
    value: d.donations,
    expenses: d.expenses
  })) || []

  // Redirect if not authenticated and not loading
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push("/ngo/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Load NGO posts and stats
  useEffect(() => {
    if (isAuthenticated && ngoProfile) {
      debouncedDispatch(fetchPosts(false), 500)
      debouncedDispatch(fetchAllDonations(false), 500)
      debouncedDispatch(fetchNgoStats({ ngoId: ngoProfile.id }), 500)
    }
  }, [isAuthenticated, ngoProfile, debouncedDispatch])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-400" />
          <p className="text-zinc-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const ngoPosts = posts.filter(
    (post) =>
      post.NgoRef === ngoProfile?.id ||
      post.NgoRef === (ngoProfile as any)?._id ||
      (post as any).ngo === ngoProfile?.id ||
      (post as any).ngo === (ngoProfile as any)?._id
  )

  const tasks = ngoPosts.map(post => {
    const taskDonations = donations.filter(d => d.postIDs === post._id)
    const totalRaised = taskDonations.reduce((sum, d) => sum + (d.Amount || 0), 0)

    return {
      id: post._id,
      title: post.Title,
      goal: Number.parseInt(post.NeedAmount),
      raised: totalRaised,
      status: "active" as const,
      proofCount: taskDonations.length,
    }
  })

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <div className="py-8 md:py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-amber-500 rounded-full" />
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">NGO Dashboard</h1>
            </div>
            <Button
              onClick={() => setIsCreateTaskOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md px-6 h-11 w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 rounded-lg text-center hover:border-amber-500/30 transition-all">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-2">Total Donations</p>
              <p className="text-2xl font-bold text-white tracking-tight">₹{stats.totalDonations.toLocaleString()}</p>
            </Card>
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 rounded-lg text-center hover:border-amber-500/30 transition-all">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-2">Funds Deployed</p>
              <p className="text-2xl font-bold text-amber-400 tracking-tight">₹{stats.fundsUsed.toLocaleString()}</p>
            </Card>
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 rounded-lg text-center hover:border-amber-500/30 transition-all">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-2">Available Balance</p>
              <p className="text-2xl font-bold text-white tracking-tight">₹{stats.remainingBalance.toLocaleString()}</p>
            </Card>
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 rounded-lg text-center hover:border-amber-500/30 transition-all">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-2">Active Tasks</p>
              <p className="text-2xl font-bold text-amber-400 tracking-tight">{stats.verifiedProjects}</p>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 rounded-lg mb-10">
            <h2 className="text-sm font-semibold text-zinc-400 mb-6 border-b border-zinc-800 pb-3">Donation Flow</h2>
            <SimpleChart data={chartData} />
            <div className="flex justify-center gap-8 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                <span className="text-xs text-zinc-500">Inflow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-zinc-600 rounded-full"></div>
                <span className="text-xs text-zinc-500">Expenditure</span>
              </div>
            </div>
          </Card>

          {/* Tasks Management */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 rounded-lg">
            <h2 className="text-sm font-semibold text-zinc-400 mb-6 border-b border-zinc-800 pb-3">Task List</h2>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                <span className="text-sm text-zinc-500">Loading tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm mb-6">No active tasks yet</p>
                <Button
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="bg-zinc-800 hover:bg-amber-500 text-white hover:text-black border border-zinc-700 hover:border-amber-500 font-semibold rounded-md px-6"
                >
                  Create Your First Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-md p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-amber-500/20 transition-all group"
                  >
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-lg font-semibold text-white tracking-tight group-hover:text-amber-400 transition-colors">{task.title}</h3>
                      <div className="flex gap-4 text-xs text-zinc-500">
                        <span>Raised: ₹{task.raised.toLocaleString()}</span>
                        <span className="text-zinc-700">|</span>
                        <span>Goal: ₹{task.goal.toLocaleString()}</span>
                        <span className="text-zinc-700">|</span>
                        <span>{task.proofCount} donations</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {task.status === "active" ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <div className="flex gap-2 flex-1 md:flex-none">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsSendPaymentOpen(true)
                          }}
                          className="rounded-md bg-zinc-950 border-zinc-700 text-xs font-medium flex-1 md:flex-none hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <Send className="h-3 w-3 mr-1.5" />
                          Send Payment
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsUploadProofOpen(true)
                          }}
                          className="rounded-md bg-zinc-950 border-zinc-700 text-xs font-medium flex-1 md:flex-none hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-colors"
                        >
                          <Upload className="h-3 w-3 mr-1.5" />
                          Upload Proof
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} />
      <NGOSendPaymentModal isOpen={isSendPaymentOpen} onClose={() => setIsSendPaymentOpen(false)} task={selectedTask} />
      <UploadProofModal isOpen={isUploadProofOpen} onClose={() => setIsUploadProofOpen(false)} task={selectedTask} />
    </div>
  )
}
