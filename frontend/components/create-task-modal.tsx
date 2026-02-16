"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Loader2, Upload, Image as ImageIcon, X } from "lucide-react"
import { uploadToIPFS, createPost } from "@/lib/api-service"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { ngoProfile } = useSelector((state: RootState) => state.ngoAuth)
  const [step, setStep] = useState<"form" | "success">("form")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "",
    category: "Education",
    location: "",
    image: null as File | null,
    dangerLevel: "Low" as "Low" | "Medium" | "High" | "Extreme",
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, image: file })

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, image: null })
    setImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!ngoProfile) {
      setError("Please login as an NGO to create tasks")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      let imageCid = "/placeholder.jpg"

      // Upload image to IPFS if provided
      if (formData.image) {
        setIsUploadingImage(true)
        try {
          const uploadResponse = await uploadToIPFS(formData.image)
          if (uploadResponse.success) {
            imageCid = uploadResponse.data.cid || uploadResponse.data.hash
          }
        } catch (uploadError) {
          } finally {
          setIsUploadingImage(false)
        }
      }

      // Get NGO wallet address from profile
      const ngoWalletAddr = ngoProfile?.publicKey

      if (!ngoWalletAddr) {
        throw new Error("Your NGO's public key is missing. Please update your profile.")
      }

      const postData = {
        Title: formData.title,
        Type: formData.category,
        Description: formData.description,
        Location: formData.location,
        ImgCid: imageCid,
        NeedAmount: formData.goal,
        WalletAddr: ngoWalletAddr,
        NgoRef: ngoProfile.id,
        DangerLevel: formData.dangerLevel,
        Status: "Active" as "Active",
      }

      const response = await createPost(postData)

      if (response.success) {
        setStep("success")
      } else {
        throw new Error("Failed to create post")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create task"
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setStep("form")
    setFormData({ title: "", description: "", goal: "", category: "Education", location: "", image: null, dangerLevel: "Low" })
    setImagePreview(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-md p-8">
        <DialogHeader className="mb-6 border-b border-zinc-800 pb-4">
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            {step === "form" && "Create New Task"}
            {step === "success" && "Task Created"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-md p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">Task Title</label>
              <Input
                placeholder="Enter task title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-zinc-900 border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus-visible:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">Description</label>
              <Textarea
                placeholder="Describe the task..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-900 border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus-visible:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">Location</label>
              <Input
                placeholder="Enter location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-zinc-900 border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus-visible:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">Required Amount (₹)</label>
              <Input
                type="number"
                placeholder="Enter funding goal..."
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="bg-zinc-900 border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus-visible:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
              >
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Environment">Environment</option>
                <option value="Disaster Relief">Disaster Relief</option>
                <option value="Community">Community Development</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">Priority Level</label>
              <div className="flex gap-2">
                {["Low", "Medium", "High", "Extreme"].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, dangerLevel: level as any })}
                    className={`flex-1 rounded-md font-semibold text-xs transition-all ${formData.dangerLevel === level
                      ? level === "Extreme" ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-amber-500/20 text-amber-400 border-amber-500/50"
                      : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">Image</label>
              {imagePreview ? (
                <div className="mt-2 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md border border-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-2 border-2 border-dashed border-zinc-800 rounded-md p-6 text-center cursor-pointer hover:bg-zinc-900/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <ImageIcon className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-zinc-400">
                      Click to upload featured image
                    </p>
                    <p className="text-xs text-zinc-600">PNG, JPG, GIF up to 10MB</p>
                  </label>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isProcessing || isUploadingImage || !formData.title || !formData.goal || !formData.description}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md"
            >
              {isUploadingImage ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Uploading Image...
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Task...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Task Created Successfully</p>
              <p className="font-semibold text-white">{formData.title}</p>
            </div>
            <p className="text-sm text-zinc-400">Your task is now live and donors can start contributing!</p>
            <Button onClick={handleClose} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
