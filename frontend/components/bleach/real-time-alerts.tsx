"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ShieldAlert, Zap, Sword } from "lucide-react"
import { apiService } from "@/lib/api-service"

export function RealTimeAlerts() {
    const { toast } = useToast()
    const [lastSealedCount, setLastSealedCount] = useState<number | null>(null)

    useEffect(() => {
        // Initial load to establish baseline
        checkNewMissions(true)

        // Poll every 15 seconds for new sealed missions (Seireitei Intel Sync)
        const interval = setInterval(() => {
            checkNewMissions()
        }, 15000)

        return () => clearInterval(interval)
    }, [lastSealedCount])

    const checkNewMissions = async (isInitial = false) => {
        try {
            const response = await apiService.getPosts()
            if (response.success && Array.isArray(response.data)) {
                const sealedMissions = response.data.filter(p => p.Status === "Completed")

                if (isInitial) {
                    setLastSealedCount(sealedMissions.length)
                    return
                }

                if (lastSealedCount !== null && sealedMissions.length > lastSealedCount) {
                    const newMission = sealedMissions[0] // Get the most recent one

                    toast({
                        title: "SEIREITEI ALERT: MISSION SEALED",
                        description: (
                            <div className="flex flex-col gap-2 mt-2">
                                <p className="text-xs font-black italic uppercase text-orange-500 tracking-tighter">
                                    {newMission.Title || newMission.title}
                                </p>
                                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                    Strategic threat eliminated from Rukongai.
                                </p>
                            </div>
                        ),
                        variant: "default",
                        className: "bg-black border-2 border-orange-600 rounded-none text-white font-black italic",
                    })

                    setLastSealedCount(sealedMissions.length)
                }
            }
        } catch (err) {
            // Silently ignore polling errors to not disrupt UX
        }
    }

    return null // Invisible component that manages global side-effect
}
