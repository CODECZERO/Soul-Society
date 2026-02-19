"use client"

import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { closeAuthModal, setAuthMode } from "@/lib/redux/slices/ui-slice"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Wallet, Users, X, Loader2 } from "lucide-react"
import { UserWalletConnector } from "./user-wallet-connector"
import { useNGOAuth } from "@/lib/ngo-auth-context"

export function AuthModal() {
  const dispatch = useDispatch<AppDispatch>()
  const { showAuthModal, authMode } = useSelector((state: RootState) => state.ui)
  const { isAuthenticated: ngoAuthenticated, isLoading } = useNGOAuth()

  if (!showAuthModal) return null

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-lg shadow-xl">
          <Loader2 className="h-8 w-8 text-amber-500 mx-auto mb-4 animate-spin" />
          <p className="text-center text-zinc-400">Loading authentication state...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 relative bg-zinc-950 border border-zinc-800 text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        <button
          onClick={() => dispatch(closeAuthModal())}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Soul-Society
          </h1>
          <p className="text-zinc-400">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* NGO Section */}
          <div className="space-y-4 relative z-10">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-full">
                  <Building2 className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">For NGOs</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Create campaigns, manage donations, and track your impact
              </p>
            </div>

            {ngoAuthenticated ? (
              <div className="text-center p-4 bg-green-950/20 border border-green-900/30 rounded-lg">
                <p className="text-sm text-green-400 font-medium">✅ NGO Account Connected</p>
                <p className="text-xs text-green-500/70 mt-1">You can now create tasks and manage donations</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() => dispatch(setAuthMode("login"))}
                  className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  variant="outline"
                >
                  NGO Login
                </Button>
                <Button
                  onClick={() => dispatch(setAuthMode("signup"))}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold h-10"
                >
                  Register NGO
                </Button>
              </div>
            )}
          </div>

          {/* User Section */}
          <div className="space-y-4 relative z-10">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-900/20 border border-green-800/30 rounded-full">
                  <Users className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">For Donors</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Connect your wallet to donate and support causes you care about
              </p>
            </div>

            <UserWalletConnector />
          </div>
        </div>

        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg relative z-10">
          <div className="text-center">
            <h3 className="font-medium text-sm mb-2 text-white">How it works</h3>
            <div className="grid grid-cols-3 gap-4 text-xs text-zinc-500">
              <div>
                <div className="font-medium text-zinc-400">1. NGOs</div>
                <p>Register and create campaigns</p>
              </div>
              <div>
                <div className="font-medium text-zinc-400">2. Donors</div>
                <p>Connect wallet and donate</p>
              </div>
              <div>
                <div className="font-medium text-zinc-400">3. Impact</div>
                <p>Track transparent donations</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
