"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { TaskCard } from "@/components/task-card"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Zap, Shield, Swords, Flame, Skull, Ghost, Activity } from "lucide-react"
import { ReaperRegistry } from "@/components/bleach/registry"
import { apiService, type Post } from "@/lib/api-service"
import { mockTasks } from "@/lib/mock-data"
import { AuthModal } from "@/components/auth-modal"
import { NGOAuthModal } from "@/components/ngo-auth-modal"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { openAuthModal } from "@/lib/redux/slices/ui-slice"
// Remove useNGOAuth import as we're using Redux now

export default function Home() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated: ngoAuthenticated } = useSelector((state: RootState) => state.ngoAuth)
  const { isConnected: walletConnected } = useSelector((state: RootState) => state.wallet)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalRaised: 0,
    activeDonors: 0,
    verifiedNGOs: 0,
  })

  useEffect(() => {
    loadPosts()
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const statsResponse = await apiService.getStats()
      if (statsResponse.success) {
        setStats({
          totalRaised: statsResponse.data.totalRaised,
          activeDonors: statsResponse.data.activeDonors,
          verifiedNGOs: statsResponse.data.verifiedNGOs,
        })
      }
    } catch (err) {
      console.error("Error loading stats:", err)
    }
  }

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getPosts()
      if (response.success) {
        setPosts(response.data)
      }
    } catch (err) {
      console.error("Error loading posts:", err)
      setError("Failed to load posts")
      // Fallback to mock data
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Convert API posts to task format for TaskCard component
  const convertPostToTask = (post: Post) => ({
    id: post._id, // Use MongoDB _id directly (string), not parseInt
    _id: post._id, // Keep original _id for backend calls
    Title: post.Title,
    title: post.Title, // For backward compatibility
    NgoRef: post.NgoRef,
    ngo: post.NgoRef, // For backward compatibility
    Description: post.Description,
    description: post.Description, // For backward compatibility
    NeedAmount: typeof post.NeedAmount === 'string' ? parseInt(post.NeedAmount) : post.NeedAmount,
    goal: typeof post.NeedAmount === 'string' ? parseInt(post.NeedAmount) : post.NeedAmount, // For backward compatibility
    CollectedAmount: post.CollectedAmount || 0,
    raised: post.CollectedAmount || 0, // For backward compatibility
    ImgCid: post.ImgCid || '',
    image: post.ImgCid || '', // For backward compatibility
    Type: post.Type,
    category: post.Type, // For backward compatibility
    Location: post.Location,
    WalletAddr: post.WalletAddr || '', // Include wallet address
  })

  // Show all posts instead of just featured ones
  // const featuredTasks = posts.slice(0, 3).map(convertPostToTask)

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500 selection:text-black">
      <Header />

      {/* Hero Section - Soul Society Theme */}
      <section className="relative overflow-hidden bg-black border-b border-zinc-900 py-32 px-4">
        {/* Background "Ink Splash" Effect (Simulated with CSS) */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-950/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-6xl relative z-10">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 text-orange-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-8 skew-x-[-12deg]">
              <span className="skew-x-[12deg]">Protocol: Seireitei Gate Open</span>
            </div>

            <h1 className="text-7xl font-black text-white mb-6 uppercase italic tracking-tighter leading-none max-w-4xl">
              Register in the <span className="text-orange-500">Soul Reaper</span> Registry
            </h1>

            <p className="text-xl text-zinc-500 mb-8 max-w-2xl font-medium tracking-tight h-12">
              Building on Stellar Testnet. Multi-wallet integration, Soroban smart contracts, and real-time spirit synchronization.
            </p>

            <div className="flex gap-4 flex-wrap">
              <Link href="/reaper-registry">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-black font-black uppercase italic rounded-none skew-x-[-12deg] px-8 h-14">
                  <span className="skew-x-[12deg] flex items-center gap-2">
                    Enter Seireitei <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </Link>
              <Link href="/divisions">
                <Button size="lg" variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white hover:border-orange-500 font-bold uppercase italic rounded-none skew-x-[-12deg] px-8 h-14 bg-black">
                  <span className="skew-x-[12deg]">Gotei 13 Structure</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Registry Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mt-20 border border-zinc-900">
            <div className="bg-zinc-950/50 p-8 border-r border-zinc-900">
              <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">Active Reapers</div>
              <div className="text-5xl font-black text-white italic tracking-tighter">{stats.activeDonors.toLocaleString() || '0'}<span className="text-orange-600">+</span></div>
            </div>
            <div className="bg-zinc-950/50 p-8 border-r border-zinc-900">
              <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">Contract Deployments</div>
              <div className="text-5xl font-black text-white italic tracking-tighter">{stats.verifiedNGOs.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-zinc-950/50 p-8">
              <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">Events Proof</div>
              <div className="text-5xl font-black text-white italic tracking-tighter">100<span className="text-orange-600">%</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Soul Reaper Registry Section */}
      <section className="py-24 px-4 bg-black">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                <div className="w-2 h-10 bg-orange-600" />
                Soul Reaper Registry
              </h2>
              <p className="text-zinc-500 mt-2 font-mono text-xs uppercase tracking-widest">
                Real-time spirit pressure synchronization via Soroban events
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-600/10 border border-orange-900/50">
              <Activity className="h-4 w-4 text-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                Network: {process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET'}
              </span>
            </div>
          </div>

          <ReaperRegistry />
        </div>
      </section>

      {/* Featured Missions (Previously Tasks) */}
      <section className="py-24 px-4 bg-zinc-950 border-y border-zinc-900">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4 mb-12">
            <div className="w-2 h-10 bg-orange-600" />
            Active Suppression Missions
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900 animate-pulse border border-zinc-800 h-80"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500 mb-8 font-mono uppercase text-xs">
              {error} - NO SPIRITUAL PRESSURE DETECTED
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <TaskCard key={post._id} task={convertPostToTask(post)} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Bleach Style */}
      <section className="py-24 px-4 bg-black border-t border-zinc-900">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-black text-white mb-16 italic uppercase tracking-tighter flex items-center gap-4">
            <div className="w-2 h-10 bg-orange-600" />
            Registry Protocol
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-orange-500 group-hover:bg-orange-500/10 transition-all skew-x-[-12deg]">
                <Shield className="h-8 w-8 text-orange-500 skew-x-[12deg]" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase italic tracking-tight">Connect Soul</h3>
              <p className="text-zinc-500 font-medium">
                Unseal your wallet via StellarWalletsKit. Freighter, AlbedoHouse, or Rabet.
              </p>
            </div>
            <div className="group">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-orange-500 group-hover:bg-orange-500/10 transition-all skew-x-[-12deg]">
                <Swords className="h-8 w-8 text-orange-500 skew-x-[12deg]" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase italic tracking-tight">Deploy Zanpakuto</h3>
              <p className="text-zinc-500 font-medium">Create your unique Soul Reaper entry on the Soroban smart contract registry.</p>
            </div>
            <div className="group">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-orange-500 group-hover:bg-orange-500/10 transition-all skew-x-[-12deg]">
                <Flame className="h-8 w-8 text-orange-500 skew-x-[12deg]" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase italic tracking-tight">Spirit Sync</h3>
              <p className="text-zinc-500 font-medium">
                Watch real-time contract events echo through the Soul Society in the dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal />
      <NGOAuthModal />
    </div>
  )
}
