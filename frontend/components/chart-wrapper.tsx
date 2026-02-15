"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import the chart with no SSR
const DynamicChart = dynamic(() => import("./ui/chart"), { 
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />
})

export { DynamicChart }
