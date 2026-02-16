"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useParams } from "next/navigation"
import { Users, ExternalLink, Shield, Target } from "lucide-react"
import Link from "next/link"

export default function CommunityDetailPage() {
    const { id } = useParams()
    const [community, setCommunity] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return;
        const fetchDetails = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const response = await fetch(`${baseUrl}/community/${id}`);
                const res = await response.json();
                if (res.success && res.data) {
                    setCommunity(res.data);
                }
            } catch (error) {
                
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Header />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="animate-pulse text-zinc-500">Loading community...</div>
                </div>
            </div>
        )
    }

    if (!community) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Header />
                <div className="container mx-auto px-4 py-20 text-center">
                    <h1 className="text-3xl font-bold text-zinc-400">Community Not Found</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <Header />

            {/* Hero Section */}
            <div className="relative border-b-2 border-orange-900/30 bg-zinc-950">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none"></div>
                <div className="container mx-auto px-4 py-16 max-w-6xl relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-24 h-24 bg-orange-600 flex items-center justify-center font-black text-4xl text-black uppercase italic transform -rotate-3 border-2 border-white">
                            {community.name.substring(0, 2)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs rounded-md">
                                    Community {community.id.substring(0, 4)}
                                </Badge>
                                <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-mono text-xs rounded-none">
                                    EST. {new Date(community.createdAt).getFullYear()}
                                </Badge>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                                {community.name}
                            </h1>
                            <p className="text-zinc-400 text-lg md:text-xl font-mono max-w-3xl leading-relaxed">
                                {community.description}
                            </p>
                        </div>
                        <div className="w-full md:w-auto flex flex-col gap-3 min-w-[200px]">
                            <div className="bg-zinc-900 border border-zinc-800 p-4 text-center">
                                <div className="text-xs text-zinc-500 mb-1">Members</div>
                                <div className="text-3xl font-black text-white">{community.memberCount}</div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-4 text-center">
                                <div className="text-xs text-zinc-500 mb-1">Active Campaigns</div>
                                <div className="text-3xl font-bold text-amber-400">{community.tasks?.length || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

                    {/* Left Column: Tasks */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                            <Target className="h-5 w-5 text-amber-400" />
                            <h2 className="text-xl font-bold text-white tracking-tight">Active Campaigns</h2>
                        </div>

                        <div className="space-y-4">
                            {community.tasks && community.tasks.length > 0 ? (
                                community.tasks.map((task: any) => (
                                    <Link href={`/task/${task.id || task._id}`} key={task.id || task._id}>
                                        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all p-6 group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold text-white uppercase italic group-hover:text-orange-500 transition-colors">
                                                    {task.Title}
                                                </h3>
                                                <Badge className="bg-zinc-800 text-zinc-400 rounded-none font-mono text-xs">
                                                    {task.status || "ACTIVE"}
                                                </Badge>
                                            </div>
                                            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{task.Description}</p>
                                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                                                <span className="text-orange-500">REWARD: {task.Amount} XLM</span>
                                                <span>•</span>
                                                <span>DEADLINE: {new Date(task.Deadline).toLocaleDateString()}</span>
                                            </div>
                                        </Card>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-zinc-500 text-sm">No active campaigns for this community yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Members */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                            <Shield className="h-6 w-6 text-zinc-600" />
                            <h2 className="text-xl font-bold text-white tracking-tight">Members</h2>
                        </div>

                        <Card className="bg-zinc-950 border-zinc-900 p-0 overflow-hidden">
                            <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {community.members && community.members.length > 0 ? (
                                    community.members.map((member: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 hover:bg-zinc-900 transition-colors">
                                            <Avatar className="h-8 w-8 rounded-none border border-zinc-800">
                                                <AvatarFallback className="bg-orange-950 text-orange-500 font-bold rounded-none text-xs">
                                                    {member.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-mono text-zinc-300 truncate">{member}</div>
                                                <div className="text-[10px] uppercase text-zinc-600">Member</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-zinc-500 text-sm font-mono text-center py-4">Roster empty. Be the first to join.</div>
                                )}
                            </div>
                        </Card>

                        <div className="bg-orange-950/20 border border-orange-900/30 p-4">
                            <h4 className="text-orange-500 font-black uppercase italic text-sm mb-2">How to Join?</h4>
                            <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                                To join this community, simply <span className="text-white font-bold">Donate</span> to any of their active campaigns. Your participation will be recorded on the Stellar blockchain.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
