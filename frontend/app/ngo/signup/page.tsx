"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Building2, CheckCircle } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { signupNGO, clearNGOError } from "@/lib/redux/slices/ngo-auth-slice"

export default function NGOSignupPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.ngoAuth)
  const { isConnected: walletConnected } = useSelector((state: RootState) => state.wallet)
  
  const [formData, setFormData] = useState({
    ngoName: "",
    regNumber: "",
    description: "",
    email: "",
    phoneNo: "",
    password: "",
    confirmPassword: "",
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Redirect if already authenticated or if wallet is connected
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/ngo-dashboard")
    } else if (walletConnected) {
      // If user wallet is connected, redirect to home
      router.push("/")
    }
  }, [isAuthenticated, walletConnected, router])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.ngoName.trim()) {
      errors.ngoName = "NGO name is required"
    }

    if (!formData.regNumber.trim()) {
      errors.regNumber = "Registration number is required"
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required"
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email"
    }

    if (!formData.phoneNo.trim()) {
      errors.phoneNo = "Phone number is required"
    } else if (!/^\d{10}$/.test(formData.phoneNo.replace(/\D/g, ""))) {
      errors.phoneNo = "Please enter a valid 10-digit phone number"
    }

    if (!formData.password) {
      errors.password = "Password is required"
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    dispatch(clearNGOError())
    
    const { confirmPassword, ...signupData } = formData
    const result = await dispatch(signupNGO(signupData))
    
    if (result.type.endsWith('fulfilled')) {
      router.push("/ngo-dashboard")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 rounded-full p-3">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">NGO Registration</h1>
          <p className="text-muted-foreground mt-2">
            Create your NGO account to start receiving transparent donations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register Your NGO</CardTitle>
            <CardDescription>
              Fill in your organization details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="ngoName" className="text-sm font-medium text-foreground">
                    NGO Name *
                  </label>
                  <Input
                    id="ngoName"
                    name="ngoName"
                    type="text"
                    placeholder="Enter NGO name"
                    value={formData.ngoName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={validationErrors.ngoName ? "border-red-500" : ""}
                  />
                  {validationErrors.ngoName && (
                    <p className="text-sm text-red-500">{validationErrors.ngoName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="regNumber" className="text-sm font-medium text-foreground">
                    Registration Number *
                  </label>
                  <Input
                    id="regNumber"
                    name="regNumber"
                    type="text"
                    placeholder="Enter registration number"
                    value={formData.regNumber}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={validationErrors.regNumber ? "border-red-500" : ""}
                  />
                  {validationErrors.regNumber && (
                    <p className="text-sm text-red-500">{validationErrors.regNumber}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-foreground">
                  Organization Description *
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your NGO's mission and activities"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  rows={3}
                  className={validationErrors.description ? "border-red-500" : ""}
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-500">{validationErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={validationErrors.email ? "border-red-500" : ""}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNo" className="text-sm font-medium text-foreground">
                    Phone Number *
                  </label>
                  <Input
                    id="phoneNo"
                    name="phoneNo"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phoneNo}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={validationErrors.phoneNo ? "border-red-500" : ""}
                  />
                  {validationErrors.phoneNo && (
                    <p className="text-sm text-red-500">{validationErrors.phoneNo}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password *
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={validationErrors.password ? "border-red-500" : ""}
                  />
                  {validationErrors.password && (
                    <p className="text-sm text-red-500">{validationErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm Password *
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={validationErrors.confirmPassword ? "border-red-500" : ""}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Your account will be created and you'll be logged in automatically</li>
                      <li>• You can start creating donation tasks immediately</li>
                      <li>• All donations will be tracked transparently on the blockchain</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create NGO Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  href="/ngo/login" 
                  className="text-primary hover:underline font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



