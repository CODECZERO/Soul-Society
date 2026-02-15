// Test script to verify API integration
// Run this in browser console or as a test

async function testAPI() {
  console.log("Testing API integration...")
  
  try {
    // Test posts API
    console.log("1. Testing posts API...")
    const postsResponse = await fetch("http://localhost:8000/api/posts")
    const postsData = await postsResponse.json()
    console.log("Posts response:", postsData)
    
    // Test donations API
    console.log("2. Testing donations API...")
    const donationsResponse = await fetch("http://localhost:8000/api/donations")
    const donationsData = await donationsResponse.json()
    console.log("Donations response:", donationsData)
    
    // Test health check
    console.log("3. Testing health check...")
    const healthResponse = await fetch("http://localhost:8000/api/health")
    const healthData = await healthResponse.json()
    console.log("Health response:", healthData)
    
    console.log("✅ All API tests completed!")
    
  } catch (error) {
    console.error("❌ API test failed:", error)
  }
}

// Uncomment to run test
// testAPI()
