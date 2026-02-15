"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { createStellarAccount } from "@/lib/stellar-utils"
import { apiService } from "@/lib/api-service"
import { Loader2, CheckCircle2, ArrowLeft, Upload, AlertCircle } from "lucide-react"

export default function CreatePostPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, ngoProfile } = useSelector((state: RootState) => state.ngoAuth)

  const [step, setStep] = useState<"form" | "preview" | "success">("form")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "",
    category: "Education",
    image: null as File | null,
    impact: "",
    timeline: "",
  })

  // Create Stellar wallet for NGO if not exists
  useEffect(() => {
    const createWallet = async () => {
      if (isAuthenticated && ngoProfile && !walletAddress) {
        try {
          const account = await createStellarAccount()
          setWalletAddress(account.publicKey)
        } catch (err) {
          console.error("Failed to create wallet:", err)
          setError("Failed to create wallet. Please try again.")
        }
      }
    }

    createWallet()
  }, [isAuthenticated, ngoProfile, walletAddress])

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-12 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">Please log in as an NGO to create posts</p>
            <Button onClick={() => router.push("/ngo/auth")} className="bg-primary hover:bg-primary/90">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep("preview")
  }

  const handlePublish = async () => {
    if (!walletAddress) {
      setError("Wallet not ready. Please wait...")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Upload image to IPFS if provided
      let imageCid = ""
      if (formData.image) {
        const uploadResponse = await apiService.uploadToIPFS(formData.image)
        if (uploadResponse.success) {
          imageCid = uploadResponse.data.cid
        }
      }

      // Create post data
      const postData = {
        Title: formData.title,
        Type: formData.category,
        Description: formData.description,
        Location: "India", // Default location
        ImgCid: imageCid || "/placeholder.jpg",
        NeedAmount: formData.goal,
        WalletAddr: walletAddress,
        NgoRef: ngoProfile?.id || "",
      }

      // Submit to API
      const response = await apiService.createPost(postData)
      
      if (response.success) {
        setStep("success")
      } else {
        throw new Error(response.message || "Failed to create post")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create post"
      setError(message)
      console.error("Create post error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setStep("form")
    setFormData({
      title: "",
      description: "",
      goal: "",
      category: "Education",
      image: null,
      impact: "",
      timeline: "",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="py-12 px-4">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/ngo/dashboard")}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Post</h1>
              <p className="text-muted-foreground">Share your cause and start fundraising</p>
            </div>
          </div>

          {step === "form" && (
            <Card className="p-8">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!walletAddress && isAuthenticated && (
                <Alert className="mb-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Setting up your Stellar wallet... This may take a moment.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-foreground">Post Title</label>
                  <Input
                    placeholder="e.g., School Supplies for Rural Children"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-2"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    placeholder="Describe your cause in detail. What problem are you solving? Who will benefit?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-border rounded-md text-foreground"
                    rows={5}
                    required
                  />
                </div>

                {/* Goal Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Funding Goal (₹)</label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-border rounded-md text-foreground"
                    >
                      <option>Education</option>
                      <option>Health</option>
                      <option>Relief</option>
                      <option>Environment</option>
                      <option>Community</option>
                    </select>
                  </div>
                </div>

                {/* Impact */}
                <div>
                  <label className="text-sm font-medium text-foreground">Expected Impact</label>
                  <textarea
                    placeholder="How many people will benefit? What specific outcomes do you expect?"
                    value={formData.impact}
                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-border rounded-md text-foreground"
                    rows={3}
                    required
                  />
                </div>

                {/* Timeline */}
                <div>
                  <label className="text-sm font-medium text-foreground">Timeline</label>
                  <Input
                    placeholder="e.g., 3 months"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="mt-2"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium text-foreground">Featured Image</label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!walletAddress}
                >
                  Preview Post
                </Button>
              </form>
            </Card>
          )}

          {step === "preview" && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Preview Your Post</h2>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-6 mb-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Title</p>
                  <p className="text-2xl font-bold text-foreground">{formData.title}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Category</p>
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {formData.category}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-foreground whitespace-pre-wrap">{formData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Funding Goal</p>
                    <p className="text-xl font-bold text-primary">₹{Number(formData.goal).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Timeline</p>
                    <p className="text-lg font-semibold text-foreground">{formData.timeline}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Expected Impact</p>
                  <p className="text-foreground whitespace-pre-wrap">{formData.impact}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
                  Edit
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={isProcessing}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Post"
                  )}
                </Button>
              </div>
            </Card>
          )}

          {step === "success" && (
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-accent" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">Post Published Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Your post is now live and donors can start contributing to your cause.
              </p>

              <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground mb-2">Post Details</p>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">{formData.title}</p>
                  <p className="text-sm text-muted-foreground">Goal: ₹{Number(formData.goal).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">NGO: {ngoProfile?.name}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => router.push("/ngo/dashboard")} className="flex-1">
                  Go to Dashboard
                </Button>
                <Button onClick={handleReset} className="flex-1 bg-primary hover:bg-primary/90">
                  Create Another Post
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
