"use client"

import { useEffect, useState } from "react"
import { getPosts, getDonations } from "@/lib/api-service"

export default function APITestPage() {
  const [results, setResults] = useState<any>({
    envVar: process.env.NEXT_PUBLIC_API_URL,
    posts: null,
    donations: null,
    errors: {}
  })

  useEffect(() => {
    const testAPIs = async () => {
      // Test posts endpoint
      try {
        const postsRes = await getPosts()
        if (postsRes.success) {
          setResults((prev: any) => ({ ...prev, posts: postsRes.data }))
        } else {
          throw new Error('Failed to fetch posts')
        }
      } catch (error: any) {
        setResults((prev: any) => ({
          ...prev,
          errors: { ...prev.errors, posts: error.message || 'Unknown error' }
        }))
      }

      // Test donations endpoint
      try {
        const donationsRes = await getDonations()
        if (donationsRes.success) {
          setResults((prev: any) => ({ ...prev, donations: donationsRes.data }))
        } else {
          throw new Error('Failed to fetch donations')
        }
      } catch (error: any) {
        setResults((prev: any) => ({
          ...prev,
          errors: { ...prev.errors, donations: error.message || 'Unknown error' }
        }))
      }
    }

    testAPIs()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Environment Variable</h2>
          <p className="font-mono text-sm">{results.envVar || 'Not set'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Posts API</h2>
          {results.errors.posts ? (
            <p className="text-red-600">Error: {results.errors.posts}</p>
          ) : results.posts ? (
            <pre className="text-xs overflow-auto">{JSON.stringify(results.posts, null, 2)}</pre>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Donations API</h2>
          {results.errors.donations ? (
            <p className="text-red-600">Error: {results.errors.donations}</p>
          ) : results.donations ? (
            <pre className="text-xs overflow-auto">{JSON.stringify(results.donations, null, 2)}</pre>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </div>
  )
}
