"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useMounted } from "@/hooks/use-mounted"
import { ipfsImageUrl } from "@/lib/ipfs"

interface BaseTask {
  _id: string
  Title?: string
  title?: string
  NgoRef?: string
  Description?: string
  description?: string
  NeedAmount: string | number
  CollectedAmount?: number
  ImgCid: string
  Type?: string
  Location?: string
  WalletAddr?: string
  Status?: "Active" | "Completed" | "Failed"
  DangerLevel?: "Low" | "Medium" | "High" | "Extreme"
  id?: string | number
  ngo?: string
  goal?: number
  raised?: number
  image?: string
  category?: string
}

interface TaskCardProps {
  task: BaseTask
}

export function TaskCard({ task }: TaskCardProps) {
  const mounted = useMounted()
  const goal = typeof task.NeedAmount === 'string' ? parseFloat(task.NeedAmount) : task.NeedAmount;
  const raised = task.CollectedAmount || 0;
  const progressPercent = goal > 0 ? (raised / goal) * 100 : 0

  const formatNumber = (num?: number | null): string => {
    if (num === undefined || num === null) return '0';
    if (!mounted) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return num.toLocaleString();
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800 rounded-lg overflow-hidden hover:border-amber-500/40 transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={ipfsImageUrl(task.ImgCid || task.image)}
          alt={task.Title || task.title || 'Task image'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-transparent" />
        <Badge className="absolute top-3 right-3 bg-amber-500/90 text-black border-none rounded-md font-semibold text-[10px] tracking-wide">
          {task.Type || task.category || 'Campaign'}
        </Badge>

        {task.DangerLevel && (
          <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-md font-semibold text-[10px] tracking-wide flex items-center gap-1 ${task.DangerLevel === "Extreme" ? "bg-red-500/90 text-white" :
              task.DangerLevel === "High" ? "bg-orange-500/90 text-white" :
                task.DangerLevel === "Medium" ? "bg-yellow-500/90 text-black" : "bg-zinc-700 text-zinc-300"
            }`}>
            Priority: {task.DangerLevel}
          </div>
        )}

        {task.Status === "Completed" && (
          <div className="absolute top-0 left-0 w-full h-full bg-green-600/20 flex items-center justify-center backdrop-blur-[1px]">
            <div className="border-2 border-green-500 px-6 py-2 rounded-md bg-black/80">
              <span className="text-xl font-bold text-green-400">Completed</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight line-clamp-2 leading-snug mb-1 group-hover:text-amber-400 transition-colors">
            {task.Title || task.title || 'Untitled Task'}
          </h3>
          {(task.NgoRef || task.WalletAddr) && (
            <Link
              href={`/profile/${task.WalletAddr}`}
              className="text-[10px] font-mono text-zinc-500 hover:text-amber-400 tracking-wide transition-colors block"
            >
              by {task.ngo || `NGO-${(task.NgoRef || '').toString().slice(-4)}`}
            </Link>
          )}
        </div>

        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
          {task.Description || task.description || 'No description available.'}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between items-end text-xs font-medium">
            <span className="text-amber-400">Raised: ₹{formatNumber(raised)}</span>
            <span className="text-zinc-500">Goal: ₹{formatNumber(goal)}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        <Link href={`/task/${task.id || task._id}`} className="block">
          <Button className="w-full bg-zinc-900 hover:bg-amber-500 border border-zinc-800 hover:border-amber-500 text-white hover:text-black font-semibold rounded-md tracking-wide transition-all">
            {raised >= goal ? "Goal Reached ✓" : "Donate Now"}
          </Button>
        </Link>
      </div>
    </Card>
  )
}
