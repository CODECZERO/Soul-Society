"use client"

import { useEffect, useState } from "react"

export default function APITestPage() {
  const [results, setResults] = useState<any>({
    envVar: process.env.NEXT_PUBLIC_API_URL,
    posts: null,
    donations: null,
    errors: {}
  })

  useEffect(() => {
    const testAPIs = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      
      // Test posts endpoint
      try {
        const postsRes = await fetch(`${baseUrl}/posts`)
        const postsData = await postsRes.json()
        setResults(prev => ({ ...prev, posts: postsData }))
      } catch (error) {
        setResults(prev => ({ 
          ...prev, 
          errors: { ...prev.errors, posts: error.message } 
        }))
      }

      // Test donations endpoint
      try {
        const donationsRes = await fetch(`${baseUrl}/donations`)
        const donationsData = await donationsRes.json()
        setResults(prev => ({ ...prev, donations: donationsData }))
      } catch (error) {
        setResults(prev => ({ 
          ...prev, 
          errors: { ...prev.errors, donations: error.message } 
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
