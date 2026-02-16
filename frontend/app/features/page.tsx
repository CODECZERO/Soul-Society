"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Wallet,
  TrendingUp,
  FileText,
  Network,
  CheckCircle2,
  DollarSign,
  Upload,
  Eye,
  Users,
  Building2
} from "lucide-react"
import { getPosts, getDonations } from "@/lib/api-service"
import Link from "next/link"

export default function FeaturesPage() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalDonations: 0,
    totalAmountRaised: 0,
    verifiedNGOs: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true)

        // Get posts count
        const postsResponse = await getPosts()
        const posts = postsResponse.success ? postsResponse.data : []

        // Get donations count
        const donationsResponse = await getDonations()
        const donations = donationsResponse.success ? donationsResponse.data : []

        // Calculate total amount raised
        const totalRaised = donations.reduce((sum: number, d: any) => sum + (d.Amount || 0), 0)

        setStats({
          totalPosts: posts.length,
          totalDonations: donations.length,
          totalAmountRaised: totalRaised,
          verifiedNGOs: Math.floor(posts.length / 3), // Mock calculation
        })
      } catch (err) {
        } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const features = [
    {
      icon: Shield,
      title: "Blockchain Transparency",
      description: "All donations and expenses are recorded on the Stellar blockchain for complete transparency and auditability."
    },
    {
      icon: Wallet,
      title: "Secure Wallet Integration",
      description: "Connect your Stellar wallet (Freighter/Albedo) to make secure donations with instant verification."
    },
    {
      icon: TrendingUp,
      title: "Real-Time Tracking",
      description: "Track your donations in real-time and see exactly how funds are being used by NGOs."
    },
    {
      icon: FileText,
      title: "Expense Management",
      description: "NGOs can upload expense proofs and receipts, automatically verified on the blockchain."
    },
    {
      icon: Network,
      title: "IPFS Storage",
      description: "All documents and images are stored on IPFS, ensuring decentralized and permanent storage."
    },
    {
      icon: Users,
      title: "NGO Verification",
      description: "Only verified NGOs can create tasks and manage funds, ensuring trust and accountability."
    },
  ]

  const apiFeatures = [
    {
      category: "User Management",
      endpoints: [
        "POST /api/user/signup - Register new NGO",
        "POST /api/user/login - Authenticate NGO",
        "GET /api/user-management/find - Find user details",
        "GET /api/user-management/private-key/:userId - Get wallet keys",
      ]
    },
    {
      category: "Posts Management",
      endpoints: [
        "GET /api/posts - Get all active tasks",
        "POST /api/posts - Create new task (NGO only)",
      ]
    },
    {
      category: "Donations",
      endpoints: [
        "GET /api/donations - Get all donations",
        "GET /api/donations/:transactionId - Get specific donation",
        "GET /api/donations/post/:postId - Get donations for a task",
        "POST /api/payment/verify-donation - Verify donation transaction",
      ]
    },
    {
      category: "Expenses",
      endpoints: [
        "GET /api/expenses/prev-txn/:postId - Get expense history",
        "POST /api/expenses/create - Record new expense",
      ]
    },
    {
      category: "Stellar Blockchain",
      endpoints: [
        "GET /api/stellar/balance/:publicKey - Get wallet balance",
        "POST /api/stellar/send-payment - Send payment between wallets",
        "GET /api/stellar/verify/:transactionId - Verify transaction",
        "POST /api/stellar/create-account - Create new Stellar account",
        "POST /api/stellar/smart-contract - Save data to smart contract",
      ]
    },
    {
      category: "IPFS Storage",
      endpoints: [
        "POST /api/ipfs/upload - Upload file to IPFS",
      ]
    },
    {
      category: "Payments",
      endpoints: [
        "POST /api/payment/wallet-pay - Process wallet payment",
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-2 h-10 bg-orange-600" />
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
              Divisions & Tactical Intel
            </h1>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none text-center group hover:border-orange-500/50 transition-all">
              <Building2 className="h-10 w-10 text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-4xl font-black text-white italic tracking-tighter mb-1">{stats.totalPosts}</p>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Active Missions</p>
            </Card>
            <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none text-center group hover:border-orange-500/50 transition-all">
              <DollarSign className="h-10 w-10 text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-4xl font-black text-white italic tracking-tighter mb-1">₹{stats.totalAmountRaised.toLocaleString()}</p>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Total Donated</p>
            </Card>
            <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none text-center group hover:border-orange-500/50 transition-all">
              <Users className="h-10 w-10 text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-4xl font-black text-white italic tracking-tighter mb-1">{stats.totalDonations}</p>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Spiritual Infusions</p>
            </Card>
            <Card className="p-8 bg-zinc-950 border-zinc-900 rounded-none text-center group hover:border-orange-500/50 transition-all">
              <CheckCircle2 className="h-10 w-10 text-orange-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-4xl font-black text-white italic tracking-tighter mb-1">{stats.verifiedNGOs}</p>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Verified Captains</p>
            </Card>
          </div>

          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="apis">API Endpoints</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
            </TabsList>

            <TabsContent value="features">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <Card key={index} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="apis">
              <div className="space-y-6">
                {apiFeatures.map((section, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="font-semibold text-foreground mb-4 text-lg">{section.category}</h3>
                    <ul className="space-y-2">
                      {section.endpoints.map((endpoint, i) => (
                        <li key={i} className="text-sm text-muted-foreground font-mono bg-slate-50 px-3 py-2 rounded">
                          {endpoint}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>

              <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Explore All Features</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Check out the complete API documentation in the server folder
                    </p>
                    <div className="flex gap-2">
                      <Link href="/explore">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Browse Tasks
                        </Button>
                      </Link>
                      <Link href="/ngo-dashboard">
                        <Button size="sm" variant="outline" className="bg-white">
                          NGO Dashboard
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="documentation">
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">Technical Architecture</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-foreground mb-2">Frontend (Next.js + TypeScript)</h3>
                    <p className="text-sm text-muted-foreground">
                      Modern React framework with Server-Side Rendering, TypeScript for type safety,
                      Tailwind CSS for styling, and Redux for state management.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-foreground mb-2">Backend (Node.js + Express)</h3>
                    <p className="text-sm text-muted-foreground">
                      RESTful API with MongoDB database, JWT authentication, middleware for security,
                      and comprehensive error handling.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-foreground mb-2">Blockchain Integration (Stellar)</h3>
                    <p className="text-sm text-muted-foreground">
                      Stellar SDK for payments, Freighter wallet integration, transaction verification,
                      and smart contract support via Soroban.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold text-foreground mb-2">Decentralized Storage (IPFS)</h3>
                    <p className="text-sm text-muted-foreground">
                      Pinata gateway integration for permanent file storage, automatic CID generation,
                      and decentralized content addressing.
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <h3 className="font-semibold text-foreground mb-3">Key Files to Explore</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      <code className="bg-slate-100 px-2 py-1 rounded">server/src/routes/</code> - All API routes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      <code className="bg-slate-100 px-2 py-1 rounded">server/src/controler/</code> - Business logic
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      <code className="bg-slate-100 px-2 py-1 rounded">frontend/lib/api-service.ts</code> - API integration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      <code className="bg-slate-100 px-2 py-1 rounded">server/API_DOCUMENTATION.md</code> - Complete docs
                    </li>
                  </ul>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

