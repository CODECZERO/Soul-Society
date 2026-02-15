"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/redux/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Swords, Shield, Activity, RefreshCw } from "lucide-react"

interface Reaper {
    name: string
    division: number
    rank: string
    powerLevel: number
    owner: string
    timestamp: string
}

export function ReaperRegistry() {
    const { isConnected, publicKey } = useSelector((state: RootState) => state.wallet)
    const [reapers, setReapers] = useState<Reaper[]>([])
    const [isRegistering, setIsRegistering] = useState(false)
    const [status, setStatus] = useState<"idle" | "pending" | "success" | "fail">("idle")
    const [txHash, setTxHash] = useState<string | null>(null)

    // Data will be fetched from contract
    useEffect(() => {
        // Initial fetch logic would go here
        setReapers([])
    }, [])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isConnected) return

        setIsRegistering(true)
        setStatus("pending")
        // Real transaction logic would call wallet-slice signTransaction
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Registration Form */}
            <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 p-6 space-y-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-600/10 border border-orange-900/50">
                    <Activity className="h-4 w-4 text-orange-500 animate-pulse" />
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                        Network: {process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET'}
                    </span>
                </div>
                <h3 className="text-2xl font-black italic uppercase text-orange-500 flex items-center gap-3">
                    <Shield className="h-6 w-6" />
                    Enlistment
                </h3>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-600 tracking-widest">Reaper Name</label>
                        <Input
                            name="reaperName"
                            placeholder="e.g. Renji Abarai"
                            className="bg-black border-zinc-800 rounded-none focus:border-orange-500 text-white font-mono"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-600 tracking-widest">Division (1-13)</label>
                        <Input
                            name="division"
                            type="number"
                            min="1"
                            max="13"
                            defaultValue="1"
                            className="bg-black border-zinc-800 rounded-none focus:border-orange-500 text-white font-mono"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={!isConnected || isRegistering}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-black font-black uppercase italic rounded-none h-12"
                    >
                        {isRegistering ? <Loader2 className="animate-spin" /> : "Initiate Spiritual Imprint"}
                    </Button>

                    {!isConnected && (
                        <p className="text-[10px] text-red-500 font-bold uppercase text-center animate-pulse">
                            [WARNING]: Release Bankai to access registry
                        </p>
                    )}
                </form>

                {status !== "idle" && (
                    <div className={`p-4 border font-mono text-[10px] uppercase tracking-tighter ${status === "success" ? "bg-green-950/20 border-green-900 text-green-500" :
                        status === "pending" ? "bg-orange-950/20 border-orange-900 text-orange-500" :
                            "bg-red-950/20 border-red-900 text-red-500"
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span>Status: {status}</span>
                            {status === "pending" && <RefreshCw className="h-3 w-3 animate-spin" />}
                        </div>
                        {txHash && (
                            <div className="break-all">
                                Hash: <span className="underline cursor-pointer">{txHash}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Real-time List */}
            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 overflow-hidden">
                <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="font-black italic uppercase text-white flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-500" />
                        Registry Feed
                    </h3>
                    <div className="text-[10px] font-mono text-zinc-600">
                        SYNCING WITH SOUL SOCIETY...
                    </div>
                </div>

                <div className="divide-y divide-zinc-900">
                    {reapers.map((reaper, i) => (
                        <div key={i} className="p-4 hover:bg-zinc-900/50 transition-colors group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-black border border-zinc-800 flex items-center justify-center font-black text-orange-600 italic">
                                        {reaper.division}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white uppercase italic group-hover:text-orange-500 transition-colors">
                                            {reaper.name}
                                        </div>
                                        <div className="text-[10px] font-mono text-zinc-600">
                                            RANK: {reaper.rank} | REI-ATSU: {reaper.powerLevel}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-mono text-orange-900 uppercase">
                                        Verification
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-500">
                                        {reaper.timestamp}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
