"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/redux/store"
import { connectWallet } from "@/lib/redux/slices/wallet-slice"
import { WalletType } from "@/lib/wallet-types"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, X, Shield, Swords, Ghost } from "lucide-react"

interface BleachWalletSelectorProps {
    isOpen: boolean
    onClose: () => void
}

export function BleachWalletSelector({ isOpen, onClose }: BleachWalletSelectorProps) {
    const dispatch = useDispatch<AppDispatch>()
    const { isConnecting, error } = useSelector((state: RootState) => state.wallet)

    const wallets: { id: WalletType; name: string; icon: any; description: string }[] = [
        {
            id: "freighter",
            name: "Freighter",
            icon: Shield,
            description: "Standard Soul Reaper Gear",
        },
        {
            id: "albedo",
            name: "AlbedoMask",
            icon: Ghost,
            description: "Hollow-fied Connection",
        },
        {
            id: "rabet",
            name: "Rabet",
            icon: Swords,
            description: "Vanguard Signer",
        }
    ]

    const handleConnect = async (walletId: WalletType) => {
        try {
            await dispatch(connectWallet(walletId)).unwrap()
            onClose()
        } catch (err) {
            console.error("Failed to connect:", err)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black border-2 border-orange-600 text-white rounded-none max-w-md p-0 overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-orange-500 hover:text-white hover:bg-orange-600 rounded-none"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <DialogHeader className="p-8 pt-10 border-b border-orange-900/50 bg-gradient-to-b from-orange-900/20 to-transparent">
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-orange-500 flex items-center gap-3">
                        <Swords className="h-8 w-8" />
                        Wallet Unseal
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 font-mono text-xs mt-2">
                        Release your spiritual pressure to connect with the Soul Society.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {wallets.map((wallet) => (
                        <button
                            key={wallet.id}
                            onClick={() => handleConnect(wallet.id)}
                            disabled={isConnecting}
                            className="group relative w-full p-4 bg-zinc-900 border border-zinc-800 hover:border-orange-500 transition-all duration-300 disabled:opacity-50 text-left overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-orange-600/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-2 bg-black border border-zinc-700 group-hover:border-orange-500 transition-colors">
                                    <wallet.icon className="h-6 w-6 text-zinc-500 group-hover:text-orange-500" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg group-hover:text-orange-400 transition-colors uppercase italic">
                                        {wallet.name}
                                    </div>
                                    <div className="text-xs text-zinc-500 font-mono">
                                        {wallet.description}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="px-6 pb-6 mt-[-10px]">
                        <div className="p-3 bg-red-950/30 border border-red-900 text-red-400 text-xs font-mono">
                            [ERROR]: {error}
                        </div>
                    </div>
                )}

                {isConnecting && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
                            <div className="text-orange-500 font-black italic uppercase tracking-widest animate-pulse">
                                Resonance in progress...
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest text-center font-bold">
                    Secure Seireitei Protocol v2.0
                </div>
            </DialogContent>
        </Dialog>
    )
}
