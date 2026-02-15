"use client"

import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"

export default function NGOAuthPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="py-12 px-4">
        <div className="mx-auto max-w-md">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">NGO Authentication</h1>
            <p className="text-muted-foreground mb-6">
              Use the auth modal to sign up or log in as an NGO. The modal appears automatically when you visit the
              site.
            </p>
            <p className="text-sm text-muted-foreground">You can also connect your wallet to access donor features.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
