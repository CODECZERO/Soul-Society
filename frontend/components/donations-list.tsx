"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { donationsApi } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

interface Donation {
  _id: string
  TransactionId: string
  postID: string
  Amount: number
  DonorAddress: string
  createdAt: string
}

interface DonationsListProps {
  postId: string
}

export function DonationsList({ postId }: DonationsListProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true)
        const response = await donationsApi.getByPost(postId)
        if (response.success) {
          setDonations(response.data || [])
        } else {
          setError(response.message || "Failed to fetch donations")
        }
      } catch (err) {
        setError("Failed to fetch donations")
        console.error("Error fetching donations:", err)
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchDonations()
    }
  }, [postId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading donations...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (donations.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No donations yet</p>
      </div>
    )
  }

  const totalAmount = donations.reduce((sum, donation) => sum + donation.Amount, 0)

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold text-foreground mb-2">Donation Summary</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Donations:</span>
          <span className="text-2xl font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-muted-foreground">Number of Donors:</span>
          <Badge variant="secondary">{donations.length}</Badge>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-md font-semibold text-foreground">Recent Donations</h4>
        {donations.map((donation) => (
          <Card key={donation._id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground">₹{donation.Amount.toLocaleString()}</span>
                  <Badge variant="outline" className="text-xs">
                    {new Date(donation.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {donation.DonorAddress.slice(0, 8)}...{donation.DonorAddress.slice(-8)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  TX: {donation.TransactionId.slice(0, 12)}...
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
