"use client"

import type React from "react"
import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { closeAuthModal, setAuthMode } from "@/lib/redux/slices/ui-slice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, AlertCircle, X, Building2, Users } from "lucide-react"
import { useNGOAuth } from "@/lib/ngo-auth-context"

export function NGOAuthModal() {
  const dispatch = useDispatch<AppDispatch>()
  const { showAuthModal, authMode } = useSelector((state: RootState) => state.ui)
  const { isLoading: ngoLoading, error: ngoError, login, signup } = useNGOAuth()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    ngoName: "",
    regNumber: "",
    description: "",
    phoneNo: "",
  })

  if (!showAuthModal || authMode === null) return null

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(formData.email, formData.password)
      dispatch(closeAuthModal())
    } catch (error) {
      console.error("NGO Login error:", error)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    try {
      await signup({
        name: formData.ngoName,
        registrationNumber: formData.regNumber,
        description: formData.description,
        email: formData.email,
        phoneNo: formData.phoneNo,
        password: formData.password,
      })
      dispatch(closeAuthModal())
    } catch (error) {
      console.error("NGO Signup error:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 relative">
        <button
          onClick={() => dispatch(closeAuthModal())}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {authMode === "login" ? "NGO Login" : "NGO Registration"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {authMode === "login"
              ? "Sign in to manage your campaigns and donations"
              : "Register your NGO to start fundraising"}
          </p>
        </div>

        {ngoError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{ngoError}</p>
          </div>
        )}

        <form onSubmit={authMode === "login" ? handleLoginSubmit : handleSignupSubmit} className="space-y-4">
          {authMode === "signup" && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">NGO Name *</label>
                <Input
                  placeholder="Your organization name"
                  value={formData.ngoName}
                  onChange={(e) => setFormData({ ...formData, ngoName: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Registration Number *</label>
                <Input
                  placeholder="NGO registration number"
                  value={formData.regNumber}
                  onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Phone Number *</label>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNo}
                  onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Description *</label>
                <textarea
                  placeholder="Tell us about your organization's mission and work"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-md text-foreground bg-background"
                  rows={3}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-foreground">Email *</label>
            <Input
              type="email"
              placeholder="your@organization.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Password *</label>
            <Input
              type="password"
              placeholder="Enter secure password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          {authMode === "signup" && (
            <div>
              <label className="text-sm font-medium text-foreground">Confirm Password *</label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1"
                required
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={ngoLoading} className="flex-1">
              {ngoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {authMode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : authMode === "login" ? (
                "Sign In"
              ) : (
                "Create NGO Account"
              )}
            </Button>
            {authMode === "signup" && (
              <Button type="button" variant="outline" onClick={() => dispatch(closeAuthModal())} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center">
          {authMode === "login" ? (
            <p className="text-sm text-muted-foreground">
              Don't have an NGO account?{" "}
              <button
                onClick={() => dispatch(setAuthMode("signup"))}
                className="text-primary hover:underline font-medium"
              >
                Register your NGO
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Already have an NGO account?{" "}
              <button
                onClick={() => dispatch(setAuthMode("login"))}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium">For Individual Donors:</p>
              <p>Use the "Connect Wallet" option to donate with your Stellar wallet</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
