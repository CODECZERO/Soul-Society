"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { TaskCard } from "@/components/task-card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Heart, Sparkles, Activity } from "lucide-react"
import { ReaperRegistry } from "@/components/bleach/registry"
import { getStats, getPosts, type Post } from "@/lib/api-service"
import { AuthModal } from "@/components/auth-modal"
import { NGOAuthModal } from "@/components/ngo-auth-modal"
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux"
import { fetchPosts } from "@/lib/redux/slices/posts-slice"
import { useDebouncedDispatch } from "@/hooks/use-debounced-dispatch"

export default function Home() {
  const dispatch = useAppDispatch()
  const debouncedDispatch = useDebouncedDispatch()
  const { isAuthenticated: ngoAuthenticated } = useAppSelector((state) => state.ngoAuth)
  const { posts, isLoading, error } = useAppSelector((state) => state.posts)

  const [stats, setStats] = useState({
    totalRaised: 0,
    activeDonors: 0,
    verifiedNGOs: 0,
  })

  useEffect(() => {
    // Use debounced dispatch for posts to prevent spam
    debouncedDispatch(fetchPosts(false), 500)
    loadStats()
  }, [debouncedDispatch])

  const loadStats = async () => {
    try {
      const statsResponse = await getStats()
      if (statsResponse.success) {
        setStats({
          totalRaised: statsResponse.data.totalRaised,
          activeDonors: statsResponse.data.activeDonors,
          verifiedNGOs: statsResponse.data.verifiedNGOs,
        })
      }
    } catch (err) {
    }
  }

  const loadPosts = () => {
    dispatch(fetchPosts(true)) // Force refresh if manually called
  }

  const convertPostToTask = (post: Post) => ({
    id: post._id,
    _id: post._id,
    Title: post.Title,
    title: post.Title,
    NgoRef: post.NgoRef,
    ngo: post.NgoRef,
    Description: post.Description,
    description: post.Description,
    NeedAmount: typeof post.NeedAmount === 'string' ? parseInt(post.NeedAmount) : post.NeedAmount,
    goal: typeof post.NeedAmount === 'string' ? parseInt(post.NeedAmount) : post.NeedAmount,
    CollectedAmount: post.CollectedAmount || 0,
    raised: post.CollectedAmount || 0,
    ImgCid: post.ImgCid || '',
    image: post.ImgCid || '',
    Type: post.Type,
    category: post.Type,
    Location: post.Location || 'Global',
    WalletAddr: post.WalletAddr || '',
  })

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500/30 selection:text-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-950 border-b border-zinc-800/50 py-12 sm:py-20 md:py-28 px-4">
        {/* Subtle gradient background */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-950/5 to-transparent pointer-events-none" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-6xl relative z-10">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 text-amber-400 text-[10px] font-semibold uppercase tracking-[0.3em] mb-6 sm:mb-8 rounded-md">
              <Activity className="h-3 w-3 animate-pulse" />
              Platform Active — Stellar Testnet
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-[1.1] max-w-4xl">
              Transparent <span className="text-amber-400">Donations</span> on the Blockchain
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-zinc-400 mb-6 sm:mb-8 max-w-2xl font-medium tracking-tight">
              Multi-wallet integration, Soroban smart contracts, and real-time tracking. Every donation verifiable on-chain.
            </p>

            <div className="flex gap-3 sm:gap-4 flex-wrap">
              <Link href="/explore">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg px-8 h-13">
                  <span className="flex items-center gap-2">
                    Explore Campaigns <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:border-amber-500/60 font-medium rounded-lg px-8 h-13 bg-zinc-950">
                  View Leaderboard
                </Button>
              </Link>
              {!ngoAuthenticated && (
                <Link href="/ngo/login">
                  <Button size="lg" variant="ghost" className="text-zinc-400 hover:text-amber-400 font-medium rounded-lg px-6 h-13 hover:bg-zinc-900 border border-transparent hover:border-zinc-800">
                    Partner Access
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px mt-12 sm:mt-20 bg-zinc-800 rounded-lg overflow-hidden">
            <div className="bg-zinc-900 p-5 sm:p-8">
              <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-1">Active Donors</div>
              <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{stats.activeDonors.toLocaleString() || '0'}<span className="text-amber-400">+</span></div>
            </div>
            <div className="bg-zinc-900 p-5 sm:p-8">
              <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-1">Verified NGOs</div>
              <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{stats.verifiedNGOs.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-zinc-900 p-5 sm:p-8">
              <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-1">On-Chain Verified</div>
              <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">100<span className="text-amber-400">%</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Explorer Section */}
      <section className="py-20 px-4 bg-zinc-950">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <div className="w-1 h-8 bg-amber-500 rounded-full" />
                Project Explorer
              </h2>
              <p className="text-zinc-500 mt-2 text-sm">
                Live data from Soroban smart contracts on Stellar Testnet
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md">
              <Activity className="h-3 w-3 text-green-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
                Network: {process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET'}
              </span>
            </div>
          </div>

          <ReaperRegistry />
        </div>
      </section>

      {/* Active Campaigns */}
      <section className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 mb-10">
            <div className="w-1 h-8 bg-amber-500 rounded-full" />
            Active Campaigns
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900 animate-pulse border border-zinc-800 rounded-lg h-80"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-zinc-500 mb-8 text-sm">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <TaskCard key={post._id} task={convertPostToTask(post as any)} />
            ))}
          </div>
          {posts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-zinc-500 text-sm">No active campaigns yet. Be the first to create one!</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-zinc-950 border-t border-zinc-800/50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white mb-14 tracking-tight flex items-center gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full" />
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="group">
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mb-5 group-hover:border-amber-500/50 group-hover:bg-amber-500/5 transition-all">
                <Shield className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">Connect Wallet</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Link your Stellar wallet via Freighter, Albedo, or Rabet. Secure, one-click setup.
              </p>
            </div>
            <div className="group">
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mb-5 group-hover:border-amber-500/50 group-hover:bg-amber-500/5 transition-all">
                <Heart className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">Donate Transparently</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Fund verified NGO campaigns. Every transaction recorded on the Stellar blockchain.
              </p>
            </div>
            <div className="group">
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mb-5 group-hover:border-amber-500/50 group-hover:bg-amber-500/5 transition-all">
                <Sparkles className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">Track Impact</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Real-time contract events show exactly how funds are used. Full transparency, always.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modals */}
      <AuthModal />
      <NGOAuthModal />
    </div>
  )
}
