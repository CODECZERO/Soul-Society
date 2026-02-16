import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ReduxProvider } from "@/lib/redux-provider"
import { AuthGuard } from "@/components/auth-guard"
import { NGOAuthProvider } from "@/lib/ngo-auth-context"
import { WalletStateManager } from "@/components/wallet-state-manager"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Soul-Society - Transparent NGO Donations",
  description: "Donate small. Track big. Every rupee verified on the blockchain.",
  generator: "v0.app",
}

import { WalletProvider } from "@/lib/wallet-context"

import { Toaster } from "@/components/ui/toaster"
import { RealTimeAlerts } from "@/components/bleach/real-time-alerts"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ReduxProvider>
          <WalletProvider>
            <WalletStateManager />
            <RealTimeAlerts />
            <NGOAuthProvider>
              <AuthGuard>
                {children}
                <Analytics />
              </AuthGuard>
            </NGOAuthProvider>
            <Toaster />
          </WalletProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
