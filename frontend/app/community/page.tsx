"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Target, ArrowRight } from "lucide-react"
import Link from "next/link"

import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"

export default function CommunityPage() {
    const [communities, setCommunities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { isAuthenticated: ngoAuthenticated, ngoProfile } = useSelector((state: RootState) => state.ngoAuth)

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const response = await fetch(`${baseUrl}/community/all`);
                const res = await response.json();
                if (res.success && Array.isArray(res.data)) {
                    setCommunities(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch communities", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunities();
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500/30">
            <Header />

            <main className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-8 bg-amber-500 rounded-full" />
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            Community <span className="text-amber-400">Hub</span>
                        </h1>
                    </div>
                    <p className="text-zinc-400 text-lg max-w-2xl pl-5 ml-0.5">
                        Join a community. Support campaigns. Make a difference together.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-zinc-900/50 animate-pulse border border-zinc-800 rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(ngoAuthenticated && ngoProfile
                            ? communities.filter(c => (c.id || c._id) === ngoProfile.id)
                            : communities
                        ).map((community, idx) => (
                            <Link href={`/community/${community.id || community._id}`} key={community.id || community._id || idx} className="group block h-full">
                                <Card className="h-full bg-zinc-900/50 border-zinc-800 group-hover:border-amber-500/40 transition-all rounded-lg overflow-hidden flex flex-col">
                                    {/* Image Header */}
                                    <div className="h-32 bg-zinc-900 border-b border-zinc-800 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center text-zinc-700 font-bold text-4xl opacity-20">
                                            {community.name.substring(0, 2)}
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                                                {community.name}
                                            </h3>
                                            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs rounded-md">
                                                ID-{community.id.substring(0, 4)}
                                            </Badge>
                                        </div>

                                        <p className="text-zinc-400 text-sm mb-6 line-clamp-3 flex-1">
                                            {community.description || "A community dedicated to making a positive impact."}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4 mb-6">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-zinc-500" />
                                                <span className="text-sm text-zinc-300">
                                                    {community.memberCount || 0} <span className="text-zinc-600">Members</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-zinc-500" />
                                                <span className="text-sm text-zinc-300">
                                                    {community.tasks?.length || 0} <span className="text-zinc-600">Campaigns</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <Button className="w-full bg-zinc-800 hover:bg-amber-500 text-white hover:text-black font-semibold rounded-md border border-zinc-700 hover:border-amber-500 transition-all">
                                                View Community <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}

                        {communities.length === 0 && (
                            <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 bg-zinc-900/30 rounded-lg">
                                <p className="text-zinc-500 text-sm">No communities found yet. Check back soon!</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
