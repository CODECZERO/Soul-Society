"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { TaskCard } from "@/components/task-card"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { apiService, type Post } from "@/lib/api-service"

export default function BountyBoardPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadBounties()
    }, [])

    const loadBounties = async () => {
        try {
            setIsLoading(true)
            const response = await apiService.getPosts()
            if (response && response.success && Array.isArray(response.data)) {
                // Filter only Suppression tasks for Bounty Board
                const bounties = response.data.filter(p => p.Type === "Suppression" || p.category === "Suppression")
                setPosts(bounties)
            }
        } catch (err) {
            console.error("Error loading bounties:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredBounties = posts.filter((task) => {
        const title = task.Title || task.title || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase());
    })

    return (
        <div className="min-h-screen bg-black">
            <Header />

            <div className="py-12 px-4">
                <div className="mx-auto max-w-6xl">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-2 h-10 bg-red-600" />
                        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
                            Hollow Bounty Board
                        </h1>
                    </div>
                    <p className="text-zinc-500 font-mono uppercase tracking-widest text-xs mb-8 ml-6">
                        Authorized suppression tasks for certified Soul Reapers only.
                    </p>

                    <div className="mb-12">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
                            <Input
                                placeholder="TRACK HOLLOW SIGNATURES..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 bg-zinc-950 border-zinc-900 rounded-none text-white font-mono uppercase tracking-widest placeholder:text-zinc-700 focus-visible:ring-red-600 focus-visible:border-red-600 h-14"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                            <p className="text-zinc-500 font-mono uppercase tracking-[0.3em] text-xs">Scanning Spiritual Pressure...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBounties.map((task) => (
                                <TaskCard key={task._id} task={task} />
                            ))}
                        </div>
                    )}

                    {!isLoading && filteredBounties.length === 0 && (
                        <div className="text-center py-24 border border-dashed border-zinc-900">
                            <p className="text-zinc-600 font-black uppercase italic tracking-widest">
                                No active hollow threats detected in this sector.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
