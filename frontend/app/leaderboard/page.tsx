"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Trophy, Sword, Shield, Zap, Search, Star } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux"
import { fetchLeaderboard, fetchContributors } from "@/lib/redux/slices/stats-slice"
import { useDebouncedDispatch } from "@/hooks/use-debounced-dispatch"

interface LeaderboardItem {
    divisionId: string
    name: string
    captain: string
    missionsCompleted: number
    totalReiatsuInfused: number
    rank: number
}

export default function LeaderboardPage() {
    const dispatch = useAppDispatch()
    const debouncedDispatch = useDebouncedDispatch()
    const { searchQuery } = useAppSelector((state) => state.ui)
    const { isAuthenticated: ngoAuthenticated, ngoProfile } = useAppSelector((state) => state.ngoAuth)
    const { leaderboard, contributors, isLoading } = useAppSelector((state) => state.stats)

    const [activeTab, setActiveTab] = useState<'divisions' | 'contributors'>(ngoAuthenticated ? 'contributors' : 'divisions')

    useEffect(() => {
        if (activeTab === 'divisions') {
            debouncedDispatch(fetchLeaderboard(false), 500)
        } else {
            debouncedDispatch(fetchContributors(ngoAuthenticated ? ngoProfile?.id || null : null), 500)
        }
    }, [activeTab, ngoAuthenticated, ngoProfile, debouncedDispatch])

    const handleManualRefresh = () => {
        if (activeTab === 'divisions') {
            dispatch(fetchLeaderboard(true))
        } else {
            dispatch(fetchContributors(ngoAuthenticated ? ngoProfile?.id || null : null))
        }
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
            case 2: return <Sword className="h-7 w-7 text-zinc-400 rotate-12" />
            case 3: return <Shield className="h-6 w-6 text-orange-700" />
            default: return <span className="text-zinc-700 font-black italic text-xl">{rank}</span>
        }
    }

    const dataToDisplay = activeTab === 'divisions' ? leaderboard : contributors

    const filteredLeaderboard = dataToDisplay.filter(item => {
        const name = item.name || item.wallet || ""
        const captain = item.captain || ""
        return (
            name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            captain.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })

    return (
        <div className="min-h-screen bg-black">
            <Header />

            <div className="py-12 px-4">
                <div className="mx-auto max-w-5xl">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-2 h-10 bg-orange-600" />
                        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
                            Gotei 13 Leaderboard
                        </h1>
                    </div>
                    <p className="text-zinc-500 font-mono uppercase tracking-widest text-xs mb-12 ml-6">
                        Ranking based on mission execution and spiritual pressure contribution.
                    </p>

                    <div className="flex gap-4 mb-8 ml-6">
                        <button
                            onClick={() => setActiveTab('divisions')}
                            className={`font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-all ${activeTab === 'divisions' ? 'bg-orange-600 border-orange-600 text-black' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                        >
                            Divisions
                        </button>
                        <button
                            onClick={() => setActiveTab('contributors')}
                            className={`font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-all ${activeTab === 'contributors' ? 'bg-orange-600 border-orange-600 text-black' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                        >
                            {ngoAuthenticated ? "Our Contributors" : "Top Contributors"}
                        </button>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-900 overflow-hidden relative">
                        {/* Ink Splash Effect (Simulated with Gradient) */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 blur-[100px] -z-10" />

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-900 bg-zinc-950">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">Rank</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">{activeTab === 'divisions' ? 'Division' : 'Contributor'}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">{activeTab === 'divisions' ? 'Captain' : 'Wallet ID'}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic text-center">{activeTab === 'divisions' ? 'Missions' : 'Missions Supported'}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic text-right">Total Donated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin" />
                                                    <p className="text-orange-500 font-mono uppercase tracking-[0.3em] text-[10px]">Retrieving Intel...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredLeaderboard.length > 0 ? filteredLeaderboard.map((item: any) => (
                                        <tr
                                            key={item.divisionId || item.wallet}
                                            className="border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-colors group"
                                        >
                                            <td className="px-6 py-6 font-black italic text-xl">
                                                {getRankIcon(item.rank)}
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-black uppercase italic tracking-tight text-lg group-hover:text-orange-500 transition-colors">
                                                        {activeTab === 'divisions' ? item.name : (item.wallet.slice(0, 12) + '...')}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                                        {activeTab === 'divisions' ? 'Verified' : 'Soul Reaper'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="text-zinc-400 font-medium font-mono uppercase tracking-tighter">
                                                    {activeTab === 'divisions' ? `CAPT. ${item.captain}` : item.wallet.slice(-8)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="inline-flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-md border border-zinc-800">
                                                    <Zap className="h-3 w-3 text-orange-500" />
                                                    <span className="text-white font-black italic">{activeTab === 'divisions' ? item.missionsCompleted : item.missionsSupported}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <span className="text-orange-500 font-black italic text-lg pr-4">
                                                    ₹{(activeTab === 'divisions' ? item.totalReiatsuInfused : item.totalDonatedINR).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-24 text-center text-zinc-800 font-black uppercase italic tracking-widest border-t border-zinc-900/50">
                                                No spiritual signatures match your query.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-zinc-950 border border-zinc-900 flex flex-col items-center text-center gap-4">
                            <Trophy className="h-8 w-8 text-orange-600" />
                            <h3 className="text-white font-black uppercase italic tracking-widest text-xs">Supreme Commander</h3>
                            <p className="text-zinc-600 text-[10px] font-mono leading-relaxed">Highest suppression record across all soul sectors.</p>
                        </div>
                        <div className="p-6 bg-zinc-950 border border-zinc-900 flex flex-col items-center text-center gap-4">
                            <Sword className="h-8 w-8 text-zinc-600" />
                            <h3 className="text-white font-black uppercase italic tracking-widest text-xs">Battle Prowess</h3>
                            <p className="text-zinc-600 text-[10px] font-mono leading-relaxed">Total hollow elimination count for the current cycle.</p>
                        </div>
                        <div className="p-6 bg-zinc-950 border border-zinc-900 flex flex-col items-center text-center gap-4">
                            <Zap className="h-8 w-8 text-zinc-400" />
                            <h3 className="text-white font-black uppercase italic tracking-widest text-xs">Donation Impact</h3>
                            <p className="text-zinc-600 text-[10px] font-mono leading-relaxed">Financial support concentration from donor souls.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
