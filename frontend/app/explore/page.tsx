"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { TaskCard } from "@/components/task-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getPosts, type Post } from "@/lib/api-service"
import { mockTasks, categories } from "@/lib/mock-data"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"

export default function ExplorePage() {
  const { searchQuery } = useSelector((state: RootState) => state.ui)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setIsLoading(true)

      // Check cache first
      const cacheKey = 'cached_posts';
      const cachedData = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isCacheValid = Date.now() - timestamp < CACHE_DURATION;

        if (isCacheValid) {
          setPosts(data);
          setIsLoading(false);
          return;
        }
      }

      const response = await getPosts()
      if (response && response.success && Array.isArray(response.data)) {
        setPosts(response.data)
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: response.data,
            timestamp: Date.now()
          }));
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError("Failed to load campaigns. Showing cached data.")

      const cacheKey = 'cached_posts';
      const cachedData = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;

      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        setPosts(data);
      } else {
        setPosts([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = posts
    .filter((task) => {
      const title = task.Title || '';
      const description = task.Description || '';
      return (
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .filter(
      (task) => selectedCategory === "All" || task.Type === selectedCategory
    )

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <div className="py-10 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-amber-500 rounded-full" />
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Explore Campaigns
            </h1>
          </div>

          {/* Category Filter */}
          <div className="mb-10">
            <div className="flex gap-2 flex-wrap">
              {["All", ...categories].map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-md font-medium text-xs transition-all ${selectedCategory === category
                    ? "bg-amber-500 text-black border-amber-500"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-amber-500/50 hover:text-white"
                    }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm">Loading campaigns...</p>
            </div>
          ) : error ? (
            <div className="text-center text-zinc-500 mb-8 border border-zinc-800 bg-zinc-900/30 p-4 rounded-md text-sm">
              {error}
            </div>
          ) : null}

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              const taskForCard = {
                ...task,
                Title: task.Title || '',
                Description: task.Description || '',
                NeedAmount: task.NeedAmount || '0',
                CollectedAmount: task.CollectedAmount || 0,
                ImgCid: task.ImgCid || '',
                Type: task.Type || 'Other',
                Location: task.Location || 'Unknown',
                WalletAddr: task.WalletAddr || '',
                NgoRef: task.NgoRef || '',
                id: task._id,
                title: task.Title || '',
                description: task.Description || '',
                goal: typeof task.NeedAmount === 'string' ? parseInt(task.NeedAmount) : task.NeedAmount || 0,
                raised: task.CollectedAmount || 0,
                image: task.ImgCid || '',
                category: task.Type || 'Other',
                ngo: task.NgoRef || ''
              };

              return <TaskCard key={task._id} task={taskForCard} />;
            })}
          </div>

          {filteredTasks.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-zinc-500 text-sm">No campaigns found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
