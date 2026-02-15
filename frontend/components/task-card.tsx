"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useMounted } from "@/hooks/use-mounted"

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
  WalletAddr?: string  // Add wallet address field
  Status?: "Active" | "Completed" | "Failed"
  DangerLevel?: "Low" | "Medium" | "High" | "Extreme"
  // For backward compatibility with mock data
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
  const progressPercent = (raised / goal) * 100

  // Custom number formatting to avoid hydration mismatches
  const formatNumber = (num?: number | null): string => {
    if (num === undefined || num === null) return '0';
    if (!mounted) {
      // Return a consistent format during SSR
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return num.toLocaleString();
  }

  return (
    <Card className="bg-zinc-950 border-zinc-900 rounded-none overflow-hidden hover:border-orange-500/50 transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={task.ImgCid || task.image || "/placeholder.svg"}
          alt={task.Title || task.title || 'Mission image'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale hover:grayscale-0"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black to-transparent opacity-60" />
        <Badge className="absolute top-4 right-4 bg-orange-600 text-black border-none rounded-none font-black italic uppercase text-[10px] tracking-widest skew-x-[-12deg]">
          <span className="skew-x-[12deg]">{task.Type || task.category || 'Mission'}</span>
        </Badge>

        {task.DangerLevel && (
          <div className={`absolute bottom-4 right-4 px-2 py-1 font-black italic uppercase text-[8px] tracking-widest skew-x-[-12deg] flex items-center gap-1 ${task.DangerLevel === "Extreme" ? "bg-red-600 animate-pulse" :
              task.DangerLevel === "High" ? "bg-red-500" :
                task.DangerLevel === "Medium" ? "bg-yellow-600" : "bg-zinc-800"
            }`}>
            <span className="skew-x-[12deg]">Danger: {task.DangerLevel}</span>
          </div>
        )}

        {task.Status === "Completed" && (
          <div className="absolute top-0 left-0 w-full h-full bg-orange-600/20 flex items-center justify-center backdrop-blur-[1px]">
            <div className="border-4 border-orange-600 px-6 py-2 skew-x-[-12deg] bg-black">
              <span className="text-3xl font-black text-orange-600 italic uppercase skew-x-[12deg]">Eliminated</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter line-clamp-2 leading-none mb-2 group-hover:text-orange-500 transition-colors">
            {task.Title || task.title || 'Unknown Mission'}
          </h3>
          {task.NgoRef && (
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              DEPLOYED BY: {task.ngo || `DIV-${task.NgoRef.slice(-2)}`}
            </p>
          )}
        </div>

        <p className="text-sm text-zinc-500 line-clamp-2 font-medium leading-relaxed">
          {task.Description || task.description || 'No intelligence available for this operation.'}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest italic">
            <span className="text-orange-500">Reiatsu Infused: {formatNumber(raised)}</span>
            <span className="text-zinc-600">Required: {formatNumber(goal)}</span>
          </div>
          <div className="h-1 bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-orange-600 transition-all duration-1000"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        <Link href={`/task/${task.id || task._id}`} className="block">
          <Button className="w-full bg-black hover:bg-orange-600 border border-zinc-800 hover:border-orange-500 text-white hover:text-black font-black uppercase italic rounded-none tracking-widest transition-all skew-x-[-12deg]">
            <span className="skew-x-[12deg]">
              {raised >= goal ? "Mission Success" : "Release Reiatsu"}
            </span>
          </Button>
        </Link>
      </div>
    </Card>
  )
}
