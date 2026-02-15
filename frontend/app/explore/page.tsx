"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { TaskCard } from "@/components/task-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { apiService, type Post } from "@/lib/api-service"
import { mockTasks, categories } from "@/lib/mock-data"

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
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

      // If no cache or cache expired, fetch fresh data
      const response = await apiService.getPosts()
      if (response && response.success && Array.isArray(response.data)) {
        setPosts(response.data)
        // Cache the response
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: response.data,
            timestamp: Date.now()
          }));
        }
      } else {
        console.warn('Unexpected API response format:', response)
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error("Error loading posts:", err)
      setError("Failed to load posts. Showing cached or sample data.")

      // Try to use cached data if available
      const cacheKey = 'cached_posts';
      const cachedData = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;

      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        setPosts(data);
      } else {
        // Fallback to mock data if no cache
        setPosts(mockTasks.map(task => ({
          _id: task.id.toString(),
          Title: task.title,
          Type: task.category,
          Description: task.description,
          Location: task.location,
          ImgCid: task.image,
          NeedAmount: task.goal.toString(),
          CollectedAmount: task.raised,
          WalletAddr: "GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJUCHUZI7VCZE7FDCVXWH6HUP",
          NgoRef: task.ngo,
          id: task.id,
          ngo: task.ngo,
          goal: task.goal,
          raised: task.raised,
          image: task.image,
          category: task.category
        })))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Convert API posts to task format for TaskCard component
  const convertPostToTask = (post: Post) => ({
    id: post._id, // Use MongoDB _id directly (string), not parseInt
    title: post.Title,
    ngo: post.NgoRef,
    description: post.Description,
    goal: parseInt(post.NeedAmount),
    raised: post.CollectedAmount || 0, // Use real collected amount from backend (in INR)
    image: post.ImgCid && post.ImgCid.startsWith('/') ? post.ImgCid : `/placeholder.jpg`,
    category: post.Type,
    _id: post._id, // Keep original _id for backend calls
  })

  const allTasks = posts.map(convertPostToTask)

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
    <div className="min-h-screen bg-black">
      <Header />

      <div className="py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-2 h-10 bg-orange-600" />
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
              Mission Registry
            </h1>
          </div>

          {/* Search and Filter */}
          <div className="mb-12 space-y-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
              <Input
                placeholder="TRACK HOLLOW SIGNATURES OR DIVISION ORDERS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-zinc-950 border-zinc-900 rounded-none text-white font-mono uppercase tracking-widest placeholder:text-zinc-700 focus-visible:ring-orange-600 focus-visible:border-orange-600 h-14"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              {["All", ...categories].map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-none font-black uppercase italic tracking-widest text-[10px] skew-x-[-12deg] transition-all ${selectedCategory === category
                      ? "bg-orange-600 text-black border-orange-600"
                      : "bg-black text-zinc-500 border-zinc-900 hover:border-orange-500 hover:text-white"
                    }`}
                >
                  <span className="skew-x-[12deg]">{category}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {error ? (
            <div className="text-center text-red-500 mb-8">
              {error} - Showing sample data
            </div>
          ) : null}

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              // Ensure we're passing the correct task structure to TaskCard
              const taskForCard = {
                ...task,
                // Ensure all required fields have default values
                Title: task.Title || '',
                Description: task.Description || '',
                NeedAmount: task.NeedAmount || '0',
                CollectedAmount: task.CollectedAmount || 0,
                ImgCid: task.ImgCid || '',
                Type: task.Type || 'Other',
                Location: task.Location || 'Unknown',
                WalletAddr: task.WalletAddr || '',
                NgoRef: task.NgoRef || '',
                // For backward compatibility with mock data
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
              <p className="text-muted-foreground text-lg">No tasks found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
