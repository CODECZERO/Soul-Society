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
import { LogOut, Heart, Shield, Menu, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { setSearchQuery } from "@/lib/redux/slices/ui-slice"
import { Input } from "@/components/ui/input"
import { BleachWalletSelector } from "./bleach/wallet-selector"

export function Header() {
  const [isMounted, setIsMounted] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { error, isConnected: walletConnected, publicKey } = useSelector((state: RootState) => state.wallet)
  const { isAuthenticated: ngoAuthenticated, ngoProfile } = useSelector((state: RootState) => state.ngoAuth)
  const { searchQuery } = useSelector((state: RootState) => state.ui)
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNGOLogout = () => {
    dispatch(logoutNGO())
    router.push('/')
  }

  const handleFullLogout = () => {
    clearAllBrowserData()
    dispatch(logoutNGO())
    dispatch(disconnectWallet())
    router.push('/')
  }

  // SSR placeholder
  if (!isMounted) {
    return (
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Heart className="text-black h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">AidBridge</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-zinc-900 rounded-md animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
            <Heart className="text-black h-5 w-5" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">AidBridge</span>
        </Link>

        <nav className="hidden md:flex gap-1 bg-zinc-900/50 px-2 py-1 rounded-lg border border-zinc-800/50">
          <Link href="/ngo/login" className="text-zinc-400 hover:text-amber-400 transition px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-800/50">
            NGO Login
          </Link>
          <Link href="/explore" className="text-zinc-400 hover:text-amber-400 transition px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-800/50">
            Explore
          </Link>
          <Link href="/bounty-board" className="text-zinc-400 hover:text-amber-400 transition px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-800/50">
            Bounties
          </Link>
          <Link href="/leaderboard" className="text-zinc-400 hover:text-amber-400 transition px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-800/50">
            Leaderboard
          </Link>
          {ngoAuthenticated ? (
            <Link href="/ngo-dashboard" className="text-zinc-400 hover:text-amber-400 transition px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-800/50">
              Dashboard
            </Link>
          ) : (
            <Link href="/verify" className="text-zinc-400 hover:text-amber-400 transition px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-800/50">
              Donations
            </Link>
          )}
          <Link href="/community" className="text-zinc-400 hover:text-amber-400 transition px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-800/50">
            Community
          </Link>
          {walletConnected && publicKey && (
            <Link href={`/profile/${publicKey}`} className="text-amber-400 hover:text-amber-300 transition px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-800/50">
              Profile
            </Link>
          )}
        </nav>

        <div className="flex-1 max-w-xs mx-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 group-focus-within:text-amber-400 transition-colors" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="pl-9 h-8 bg-zinc-900 border-zinc-800 rounded-md text-xs text-white placeholder:text-zinc-600 focus-visible:ring-amber-500 focus-visible:border-amber-500 w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!ngoAuthenticated && !walletConnected && (
            <Button
              onClick={() => setIsWalletSelectorOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md px-5 h-9"
            >
              Connect Wallet
            </Button>
          )}

          {walletConnected && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-zinc-300 font-mono text-xs">
                {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullLogout}
                className="text-zinc-500 hover:text-red-400 p-0 h-auto"
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
                className="text-zinc-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <BleachWalletSelector
        isOpen={isWalletSelectorOpen}
        onClose={() => setIsWalletSelectorOpen(false)}
      />

      {error && <div className="bg-red-950/20 border-t border-red-900/30 px-4 py-2 text-xs text-red-400 font-mono">Connection Error: {error}</div>}
    </header>
  )
}
