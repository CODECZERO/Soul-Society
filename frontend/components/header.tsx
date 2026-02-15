"use client"

import * as React from "react"
import Link from "next/link"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { WalletData } from "./wallet-data"
import { StellarPriceDisplay } from "./stellar-price-display"
import { logoutNGO } from "@/lib/redux/slices/ngo-auth-slice"
import { disconnectWallet } from "@/lib/redux/slices/wallet-slice"
import { clearAllBrowserData } from "@/lib/logout-utils"
import { Button } from "@/components/ui/button"
import { LogOut, Swords, Shield, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { BleachWalletSelector } from "./bleach/wallet-selector"

export function Header() {
  const [isMounted, setIsMounted] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { error, isConnected: walletConnected, publicKey } = useSelector((state: RootState) => state.wallet)
  const { isAuthenticated: ngoAuthenticated, ngoProfile } = useSelector((state: RootState) => state.ngoAuth)
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNGOLogout = () => {
    // Clear NGO authentication
    dispatch(logoutNGO())
    // Redirect to home
    router.push('/')
  }

  const handleFullLogout = () => {
    // Clear all browser data
    clearAllBrowserData()
    // Clear Redux state
    dispatch(logoutNGO())
    dispatch(disconnectWallet())
    // Redirect to home
    router.push('/')
  }

  // Don't render anything on the server for authenticated content
  if (!isMounted) {
    return (
      <header className="border-b-2 border-orange-950 bg-black sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-orange-600 rounded-none flex items-center justify-center transform group-hover:rotate-12 transition-transform skew-x-[-12deg]">
              <Swords className="text-black h-6 w-6 transform skew-x-[12deg]" />
            </div>
            <span className="font-black text-2xl text-white uppercase italic tracking-tighter">Soul Society</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-zinc-900 rounded-none animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b-2 border-orange-950 bg-black sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-orange-600 rounded-none flex items-center justify-center transform group-hover:rotate-12 transition-transform skew-x-[-12deg]">
            <Swords className="text-black h-6 w-6 transform skew-x-[12deg]" />
          </div>
          <span className="font-black text-2xl text-white uppercase italic tracking-tighter">Soul Society</span>
        </Link>

        <nav className="hidden md:flex gap-6 bg-zinc-900 px-6 py-2 border border-zinc-800 skew-x-[-12deg]">
          <Link href="/explore" className="text-zinc-500 hover:text-orange-500 transition font-bold uppercase italic tracking-widest text-[10px] skew-x-[12deg]">
            Registry
          </Link>
          <Link href="/bounty-board" className="text-zinc-500 hover:text-red-500 transition font-bold uppercase italic tracking-widest text-[10px] skew-x-[12deg]">
            Bounties
          </Link>
          <Link href="/leaderboard" className="text-zinc-500 hover:text-orange-500 transition font-bold uppercase italic tracking-widest text-[10px] skew-x-[12deg]">
            Gotei 13
          </Link>
          {ngoAuthenticated ? (
            <Link href="/ngo-dashboard" className="text-zinc-500 hover:text-orange-500 transition font-bold uppercase italic tracking-widest text-[10px] skew-x-[12deg]">
              Barracks
            </Link>
          ) : (
            <Link href="/verify" className="text-zinc-500 hover:text-orange-500 transition font-bold uppercase italic tracking-widest text-[10px] skew-x-[12deg]">
              Infusions
            </Link>
          )}
          {walletConnected && publicKey && (
            <Link href={`/profile/${publicKey}`} className="text-orange-600 hover:text-orange-400 transition font-black uppercase italic tracking-widest text-[10px] skew-x-[12deg]">
              Mastery
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!ngoAuthenticated && !walletConnected && (
            <Button
              onClick={() => setIsWalletSelectorOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-black font-black uppercase italic rounded-none skew-x-[-12deg] px-6"
            >
              <span className="skew-x-[12deg]">Release Bankai</span>
            </Button>
          )}

          {walletConnected && (
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-1 skew-x-[-12deg]">
              <div className="w-2 h-2 bg-orange-500 animate-pulse rounded-full skew-x-[12deg]" />
              <span className="text-orange-500 font-mono text-[10px] skew-x-[12deg]">
                {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullLogout}
                className="text-zinc-500 hover:text-red-500 p-0 h-auto skew-x-[12deg]"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          )}

          {ngoAuthenticated && ngoProfile && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleNGOLogout}
                variant="ghost"
                size="sm"
                className="text-zinc-500 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Depart</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <BleachWalletSelector
        isOpen={isWalletSelectorOpen}
        onClose={() => setIsWalletSelectorOpen(false)}
      />

      {error && <div className="bg-red-950/30 border-t border-red-900 px-4 py-2 text-xs text-red-400 font-mono tracking-tighter uppercase">[REI-ATSU LEAK]: {error}</div>}
    </header>
  )
}
