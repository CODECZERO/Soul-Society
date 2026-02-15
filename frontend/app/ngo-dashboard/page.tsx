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
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { apiService, type Post } from "@/lib/api-service"

// Simple chart component to avoid recharts SSR issues
const SimpleChart = ({ data }: { data: any[] }) => {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="h-[300px] w-full p-4">
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-blue-500 rounded-t"
              style={{
                height: `${(item.value / maxValue) * 200}px`,
                minHeight: '4px'
              }}
            />
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {item.name}
            </div>
            <div className="text-xs font-medium">
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
  const { isAuthenticated, ngoProfile } = useSelector((state: RootState) => state.ngoAuth)

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isUploadProofOpen, setIsUploadProofOpen] = useState(false)
  const [isSendPaymentOpen, setIsSendPaymentOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDonations: 0,
    fundsUsed: 0,
    remainingBalance: 0,
    verifiedProjects: 0,
  })
  const [donations, setDonations] = useState<any[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/ngo/login")
    }
  }, [isAuthenticated, router])

  // Load NGO posts and stats
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        const postsResponse = await apiService.getPosts()
        if (postsResponse.success) {
          // Filter posts for this NGO
          const ngoPosts = postsResponse.data.filter((post: Post) => post.NgoRef === ngoProfile?.id)
          setPosts(ngoPosts)

          // Calculate stats from posts (CollectedAmount is already in INR from backend)
          const totalRaised = ngoPosts.reduce((sum, post) => sum + (post.CollectedAmount || 0), 0)
          const fundsUsed = Math.floor(totalRaised * 0.68) // Mock calculation - you can track actual expenses
          const remainingBalance = totalRaised - fundsUsed

          setStats({
            totalDonations: totalRaised,  // Total raised in INR
            fundsUsed,                    // Funds used in INR
            remainingBalance,             // Remaining in INR
            verifiedProjects: ngoPosts.length,
          })

          // Load donations for this NGO's posts (optional - for detailed view)
          const allDonationsResponse = await apiService.getDonations()
          if (allDonationsResponse.success) {
            const ngoPostIds = ngoPosts.map(p => p._id)
            const ngoDonations = allDonationsResponse.data.filter((d: any) =>
              ngoPostIds.includes(d.postIDs)
            )
            setDonations(ngoDonations)
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && ngoProfile) {
      loadDashboardData()
    }
  }, [isAuthenticated, ngoProfile])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Convert posts to task format with real donation data
  const tasks = posts.map(post => {
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

  const chartData = [
    { month: "Jan", donations: 15000, usage: 8000 },
    { month: "Feb", donations: 22000, usage: 18000 },
    { month: "Mar", donations: 35000, usage: 28000 },
    { month: "Apr", donations: 28000, usage: 25000 },
    { month: "May", donations: 25000, usage: 19500 },
  ]

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="py-8 md:py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-orange-600" />
              <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Command Center</h1>
            </div>
            <Button
              onClick={() => setIsCreateTaskOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-black font-black uppercase italic rounded-none tracking-widest h-14 skew-x-[-12deg] px-8 w-full md:w-auto"
            >
              <span className="skew-x-[12deg]">Deploy Division Order</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none text-center group hover:border-orange-500/50 transition-all">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Spiritual Infusion</p>
              <p className="text-3xl font-black text-white italic tracking-tighter">₹{stats.totalDonations.toLocaleString()}</p>
            </Card>
            <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none text-center group hover:border-orange-500/50 transition-all">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Energy Manifested</p>
              <p className="text-3xl font-black text-orange-500 italic tracking-tighter">₹{stats.fundsUsed.toLocaleString()}</p>
            </Card>
            <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none text-center group hover:border-orange-500/50 transition-all">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Available Reiatsu</p>
              <p className="text-3xl font-black text-white italic tracking-tighter">
                ₹{stats.remainingBalance.toLocaleString()}
              </p>
            </Card>
            <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none text-center group hover:border-orange-500/50 transition-all">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Active Orders</p>
              <p className="text-3xl font-black text-orange-500 italic tracking-tighter">{stats.verifiedProjects}</p>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none mb-12">
            <h2 className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500 mb-8 border-b border-zinc-900 pb-4">Energy Flow Analysis</h2>
            <SimpleChart data={chartData} />
            <div className="flex justify-center gap-8 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Inflow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Expenditure</span>
              </div>
            </div>
          </Card>

          {/* Tasks Management */}
          <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none">
            <h2 className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500 mb-8 border-b border-zinc-900 pb-4">Tactical Manifest</h2>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Gathering intelligence...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 font-bold uppercase italic tracking-widest text-xs mb-8">No active orders in the manifest</p>
                <Button
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="bg-zinc-900 hover:bg-orange-600 text-white hover:text-black border border-zinc-800 hover:border-orange-600 font-black uppercase italic rounded-none skew-x-[-12deg] h-14 px-8"
                >
                  <span className="skew-x-[12deg]">Initiate First Deployment</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-black border border-zinc-900 rounded-none p-6 flex flex-col md:flex-row justify-between md:items-center gap-6 hover:border-orange-500/30 transition-all group"
                  >
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter group-hover:text-orange-500 transition-colors">{task.title}</h3>
                      <div className="flex gap-4 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">
                        <span>RAISED: ₹{task.raised.toLocaleString()}</span>
                        <span className="text-zinc-800">|</span>
                        <span>GOAL: ₹{task.goal.toLocaleString()}</span>
                        <span className="text-zinc-800">|</span>
                        <span>{task.proofCount} SIGNATURES</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      {task.status === "active" ? (
                        <div className="w-2 h-2 bg-orange-500 animate-pulse rounded-full" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-orange-600" />
                      )}
                      <div className="flex gap-2 flex-1 md:flex-none">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsSendPaymentOpen(true)
                          }}
                          className="rounded-none bg-black border-zinc-800 text-[10px] font-black uppercase italic tracking-widest skew-x-[-12deg] flex-1 md:flex-none hover:bg-zinc-900 transition-colors"
                        >
                          <span className="skew-x-[12deg] flex items-center gap-2">
                            Manifest Resource
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsUploadProofOpen(true)
                          }}
                          className="rounded-none bg-black border-zinc-800 text-[10px] font-black uppercase italic tracking-widest skew-x-[-12deg] flex-1 md:flex-none hover:bg-orange-600 hover:text-black hover:border-orange-600 transition-colors"
                        >
                          <span className="skew-x-[12deg] flex items-center gap-2">
                            Forge Proof
                          </span>
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
