"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { apiService } from "@/lib/api-service"
import { Trophy, Sword, Shield, Zap } from "lucide-react"

interface LeaderboardItem {
    divisionId: string
    name: string
    captain: string
    missionsCompleted: number
    totalReiatsuInfused: number
    rank: number
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const fetchLeaderboard = async () => {
        try {
            setIsLoading(true)
            // Call the new leaderboard API
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/stats/leaderboard`)
            const data = await response.json()
            if (data.success) {
                setLeaderboard(data.data)
            }
        } catch (err) {
            console.error("Error fetching leaderboard:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="h-6 w-6 text-yellow-500" />
            case 2: return <Sword className="h-6 w-6 text-zinc-400" />
            case 3: return <Shield className="h-6 w-6 text-orange-700" />
            default: return <span className="text-zinc-700 font-black italic">{rank}</span>
        }
    }

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

                    <div className="bg-zinc-950 border border-zinc-900 overflow-hidden relative">
                        {/* Ink Splash Effect (Simulated with Gradient) */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 blur-[100px] -z-10" />

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-900 bg-zinc-950">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">Rank</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">Division</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">Captain</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic text-center">Missions</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest italic text-right">Reiatsu Raised</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-zinc-700 font-mono uppercase text-xs animate-pulse">
                                                Retrieving Division Intel...
                                            </td>
                                        </tr>
                                    ) : leaderboard.map((item) => (
                                        <tr
                                            key={item.divisionId}
                                            className="border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-colors group"
                                        >
                                            <td className="px-6 py-6 font-black italic text-xl">
                                                {getRankIcon(item.rank)}
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-black uppercase italic tracking-tight text-lg group-hover:text-orange-500 transition-colors">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                                        SEIREITEI REGISTERED
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="text-zinc-400 font-medium font-mono uppercase tracking-tighter">
                                                    CAPT. {item.captain}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="inline-flex items-center gap-2 bg-zinc-900 px-3 py-1 skew-x-[-12deg] border border-zinc-800">
                                                    <Zap className="h-3 w-3 text-orange-500 skew-x-[12deg]" />
                                                    <span className="text-white font-black italic skew-x-[12deg]">{item.missionsCompleted}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <span className="text-orange-500 font-black italic text-lg pr-4">
                                                    ₹{item.totalReiatsuInfused.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
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
                            <h3 className="text-white font-black uppercase italic tracking-widest text-xs">Reiatsu Density</h3>
                            <p className="text-zinc-600 text-[10px] font-mono leading-relaxed">Financial support concentration from donor souls.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
