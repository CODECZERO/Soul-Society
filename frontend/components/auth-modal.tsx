"use client"

import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { closeAuthModal, setAuthMode } from "@/lib/redux/slices/ui-slice"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Wallet, Users, X } from "lucide-react"
import { UserWalletConnector } from "./user-wallet-connector"
import { useNGOAuth } from "@/lib/ngo-auth-context"

export function AuthModal() {
  const dispatch = useDispatch<AppDispatch>()
  const { showAuthModal, authMode } = useSelector((state: RootState) => state.ui)
  const { isAuthenticated: ngoAuthenticated, isLoading } = useNGOAuth()

  if (!showAuthModal) return null
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg">
          <p className="text-center">Loading authentication state...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 relative">
        <button
          onClick={() => dispatch(closeAuthModal())}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Soul-Society
          </h1>
          <p className="text-muted-foreground">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* NGO Section */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">For NGOs</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Create campaigns, manage donations, and track your impact
              </p>
            </div>
            
            {ngoAuthenticated ? (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">✅ NGO Account Connected</p>
                <p className="text-xs text-green-600 mt-1">You can now create tasks and manage donations</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() => dispatch(setAuthMode("login"))}
                  className="w-full"
                  variant="outline"
                >
                  NGO Login
                </Button>
                <Button
                  onClick={() => dispatch(setAuthMode("signup"))}
                  className="w-full"
                >
                  Register NGO
                </Button>
              </div>
            )}
          </div>

          {/* User Section */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">For Donors</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your wallet to donate and support causes you care about
              </p>
            </div>
            
            <UserWalletConnector />
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <h3 className="font-medium text-sm mb-2">How it works</h3>
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>
                <div className="font-medium">1. NGOs</div>
                <p>Register and create campaigns</p>
              </div>
              <div>
                <div className="font-medium">2. Donors</div>
                <p>Connect wallet and donate</p>
              </div>
              <div>
                <div className="font-medium">3. Impact</div>
                <p>Track transparent donations</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
