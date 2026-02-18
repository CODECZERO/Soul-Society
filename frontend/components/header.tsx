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
import { LogOut, Heart, Shield, Menu, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { setSearchQuery } from "@/lib/redux/slices/ui-slice"
import { Input } from "@/components/ui/input"
import { BleachWalletSelector } from "./bleach/wallet-selector"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { error, isConnected: walletConnected, publicKey } = useSelector((state: RootState) => state.wallet)
  const { isAuthenticated: ngoAuthenticated, ngoProfile, isLoading: authLoading } = useSelector((state: RootState) => state.ngoAuth)
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

  const navLinks = (
    <>
      {!ngoAuthenticated && !authLoading && (
        <Link href="/ngo/login" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-amber-400 transition py-3 text-sm font-medium border-b border-zinc-800">
          NGO Login
        </Link>
      )}
      <Link href="/explore" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-amber-400 transition py-3 text-sm font-medium border-b border-zinc-800">
        Explore
      </Link>
      <Link href="/bounty-board" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-amber-400 transition py-3 text-sm font-medium border-b border-zinc-800">
        Bounties
      </Link>
      <Link href="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-amber-400 transition py-3 text-sm font-medium border-b border-zinc-800">
        Leaderboard
      </Link>
      {ngoAuthenticated ? (
        <Link href="/ngo-dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-amber-400 transition py-3 text-sm font-medium border-b border-zinc-800">
          Dashboard
        </Link>
      ) : !authLoading && (
        <Link href="/verify" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-amber-400 transition py-3 text-sm font-medium border-b border-zinc-800">
          Donations
        </Link>
      )}
      <Link href="/community" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-amber-400 transition py-3 text-sm font-medium border-b border-zinc-800">
        Community
      </Link>
      {walletConnected && publicKey && (
        <Link href={`/profile/${publicKey}`} onClick={() => setMobileMenuOpen(false)} className="block text-amber-400 hover:text-amber-300 transition py-3 text-sm font-medium border-b border-zinc-800">
          Profile
        </Link>
      )}
    </>
  );

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-3 flex justify-between items-center gap-2 min-w-0">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
            <Heart className="text-black h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="font-bold text-lg sm:text-xl text-white tracking-tight truncate">AidBridge</span>
        </Link>

        <nav className="hidden lg:flex gap-1 bg-zinc-900/50 px-2 py-1 rounded-lg border border-zinc-800/50 shrink-0">
          {!ngoAuthenticated && !authLoading && (
            <Link href="/ngo/login" className="text-zinc-400 hover:text-amber-400 transition px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-800/50">
              NGO Login
            </Link>
          )}
          {authLoading && (
            <div className="px-3 py-1.5">
              <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse"></div>
            </div>
          )}
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
          ) : !authLoading && (
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

        <div className="hidden md:block flex-1 min-w-0 max-w-xs mx-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 group-focus-within:text-amber-400 transition-colors" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="pl-9 h-8 bg-zinc-900 border-zinc-800 rounded-md text-xs text-white placeholder:text-zinc-600 focus-visible:ring-amber-500 focus-visible:border-amber-500 w-full min-w-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/50 h-9 w-9">
                <Menu className="h-5 w-5" aria-label="Open menu" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-zinc-950 border-zinc-800 p-0">
              <SheetHeader className="p-4 border-b border-zinc-800">
                <SheetTitle className="text-left text-white font-semibold">Menu</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <div className="relative group mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                    className="pl-9 h-10 bg-zinc-900 border-zinc-800 rounded-md text-sm text-white"
                  />
                </div>
                {navLinks}
              </div>
            </SheetContent>
          </Sheet>
          {!ngoAuthenticated && !walletConnected && !authLoading && (
            <Button
              onClick={() => setIsWalletSelectorOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md px-3 sm:px-5 h-9 text-sm"
            >
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
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
          {authLoading && (
            <div className="h-9 w-24 bg-zinc-900 rounded-md animate-pulse"></div>
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
