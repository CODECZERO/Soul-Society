"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { getUserProfile } from "@/lib/api-service"
import { Sword, Zap, Shield, Trophy, History, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/redux/store"

export default function ProfilePage() {
    const params = useParams()
    const walletAddr = params.walletAddr as string
    const [profile, setProfile] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const exchangeRate = useSelector((state: RootState) => state.donation.exchangeRate)

    useEffect(() => {
        if (walletAddr) {
            fetchProfile()
        }
    }, [walletAddr])

    const fetchProfile = async () => {
        try {
            setIsLoading(true)
            const response = await getUserProfile(walletAddr)
            if (response.success) {
                setProfile(response.data)
            }
        } catch (err) {
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black">
                <Header />
                <div className="flex flex-col items-center justify-center py-48 gap-4">
                    <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-mono uppercase tracking-[0.3em] text-xs">Synchronizing Spiritual Signature...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-black">
                <Header />
                <div className="text-center py-48">
                    <h2 className="text-2xl font-black text-zinc-700 uppercase italic italic tracking-widest">Profile Not Found</h2>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />

            <div className="py-12 px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
                        <div className="w-32 h-32 bg-zinc-950 border-2 border-orange-600 flex items-center justify-center relative group">
                            <Sword className="h-16 w-16 text-orange-600 group-hover:scale-110 transition-transform" />
                            <div className="absolute -bottom-3 -right-3 bg-orange-600 px-2 py-1 skew-x-[-12deg]">
                                <span className="text-[10px] font-black text-black uppercase skew-x-[12deg]">Active</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-2 h-10 bg-orange-600" />
                                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
                                    {profile.rank} Record
                                </h1>
                            </div>
                            <p className="text-zinc-500 font-mono text-xs mb-4 ml-6 break-all">
                                SIGNATURE: {walletAddr}
                            </p>
                            <div className="flex flex-wrap gap-2 ml-6">
                                <Badge className="bg-zinc-900 border-zinc-800 text-orange-500 rounded-none px-4 py-1 skew-x-[-12deg]">
                                    <span className="skew-x-[12deg] uppercase font-black text-[10px] italic">Gotei 13 Registered</span>
                                </Badge>
                                <Badge className="bg-zinc-900 border-zinc-800 text-zinc-400 rounded-none px-4 py-1 skew-x-[-12deg]">
                                    <span className="skew-x-[12deg] uppercase font-black text-[10px] italic">Sector: Rukongai</span>
                                </Badge>
                                {profile.isVerifiedOnChain && (
                                    <Badge className="bg-orange-600 border-orange-600 text-black rounded-none px-4 py-1 skew-x-[-12deg]">
                                        <span className="skew-x-[12deg] uppercase font-black text-[10px] italic">Synchronized</span>
                                    </Badge>
                                )}
                            </div>
                            {profile.onChainReiatsu && profile.onChainReiatsu !== "0" && (
                                <div className="mt-4 ml-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[10px] uppercase font-black border-zinc-800 hover:bg-orange-600 hover:text-black hover:border-orange-600 transition-colors rounded-none"
                                        onClick={() => window.alert('Reiatsu Token metadata copied! Add manually to Freighter using Reiatsu Contract ID.')}
                                    >
                                        Add tokens to wallet
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Stats Left Column */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="bg-zinc-950 border-zinc-900 rounded-none relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-[60px] -z-10 group-hover:bg-orange-600/10 transition-colors" />
                                <CardHeader>
                                    <CardTitle className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Zap className="h-3 w-3 text-orange-600" /> Spiritual Pressure
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-white italic tracking-tighter mb-2">
                                        ₹{Math.round(profile.totalReiatsu * (exchangeRate || 15)).toLocaleString()}
                                    </div>
                                    {profile.onChainReiatsu && profile.onChainReiatsu !== "0" && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-mono text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 border border-orange-500/20">
                                                On-Chain: {profile.onChainReiatsu} REI
                                            </span>
                                        </div>
                                    )}
                                    <div className="h-1 bg-zinc-900 w-full mb-4">
                                        <div
                                            className="h-full bg-orange-600"
                                            style={{ width: `${Math.min((profile.totalReiatsu / 1000) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-600 font-mono uppercase leading-relaxed">
                                        Collective spiritual energy infused into extraction platforms.
                                    </p>
                                    {profile.isVerifiedOnChain && (
                                        <div className="mt-4 flex items-center gap-1.5 py-1.5 px-3 bg-zinc-900/50 border border-zinc-800">
                                            <ShieldCheck className="h-3 w-3 text-orange-600" />
                                            <span className="text-[9px] font-black text-orange-600 uppercase italic">On-Chain Verified Record</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-950 border-zinc-900 rounded-none">
                                <CardHeader>
                                    <CardTitle className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Trophy className="h-3 w-3 text-zinc-600" /> Combat Record
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                                        <span className="text-[10px] font-mono text-zinc-600 uppercase">Missions Sealed</span>
                                        <span className="text-2xl font-black text-white italic">{profile.missionsCompletedCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-mono text-zinc-600 uppercase">Success Rate</span>
                                        <span className="text-2xl font-black text-orange-500 italic">100%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Activity Right Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-zinc-950 border-zinc-900 rounded-none h-full">
                                <CardHeader className="border-b border-zinc-900 pb-6 mb-6">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <History className="h-4 w-4 text-orange-600" /> Mission Archive
                                        </CardTitle>
                                        <span className="text-[10px] font-mono text-zinc-700 uppercase">Immutable Record</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 px-6">
                                    <div className="space-y-4 pb-8">
                                        {profile.completedMissions.length > 0 ? (
                                            profile.completedMissions.map((mission: any) => (
                                                <div key={mission.id} className="group p-4 bg-zinc-900/40 border border-zinc-900/50 hover:bg-zinc-900 hover:border-orange-600/30 transition-all flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-white font-black uppercase italic tracking-tight group-hover:text-orange-500 transition-colors">
                                                            {mission.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className={`h-1.5 w-1.5 rounded-full ${mission.dangerLevel === 'Extreme' ? 'bg-red-600 animate-pulse' : 'bg-orange-600'}`} />
                                                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                                                DANGER: {mission.dangerLevel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-md">
                                                        <ShieldCheck className="h-3 w-3 text-orange-600" />
                                                        <span className="text-orange-600 text-[10px] font-black italic">SEALED</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 border border-dashed border-zinc-900">
                                                <p className="text-zinc-700 font-black uppercase italic tracking-widest text-xs">No Missions Sealed in Archive</p>
                                            </div>
                                        )}
                                    </div>

                                    {profile.recentInfusions.length > 0 && (
                                        <div className="mt-8 border-t border-zinc-900 pt-8">
                                            <h3 className="text-xs font-mono text-zinc-600 uppercase tracking-[0.3em] mb-6">Recent Donations</h3>
                                            <div className="space-y-4 pb-8">
                                                {profile.recentInfusions.map((infusion: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center text-sm border-b border-zinc-900/50 pb-4 last:border-0 hover:translate-x-1 transition-transform cursor-pointer">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-orange-600/10 flex items-center justify-center border border-orange-600/20">
                                                                <Zap className="h-3 w-3 text-orange-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-black italic">± ₹{Math.round(infusion.amount * (exchangeRate || 15))}</p>
                                                                <p className="text-[10px] font-mono text-zinc-600">{new Date(infusion.date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-orange-700 hover:text-orange-500 truncate max-w-xs">{infusion.txn}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
