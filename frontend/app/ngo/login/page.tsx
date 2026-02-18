"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Building2, Heart } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { loginNGO, clearNGOError } from "@/lib/redux/slices/ngo-auth-slice"

export default function NGOLoginPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.ngoAuth)
  const { isConnected: walletConnected } = useSelector((state: RootState) => state.wallet)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/ngo-dashboard")
    } else if (walletConnected) {
      router.push("/")
    }
  }, [isAuthenticated, walletConnected, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) return
    dispatch(clearNGOError())
    const result = await dispatch(loginNGO(formData))
    if (result.type.endsWith("fulfilled")) {
      router.push("/ngo-dashboard")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500/30 selection:text-white">
      <Header />

      <section className="relative overflow-hidden border-b border-zinc-800/50 py-12 sm:py-16 md:py-20 px-4">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-950/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-md relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">NGO Login</h1>
              <p className="text-zinc-400 text-sm mt-0.5">
                Sign in to manage donations and tasks
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert className="bg-red-950/30 border-red-900/50 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-zinc-300">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="h-11 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="h-11 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg"
                disabled={isLoading || !formData.email || !formData.password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/ngo/signup"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
