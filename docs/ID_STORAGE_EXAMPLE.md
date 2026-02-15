# 📊 ID Storage: Complete Example

## Real Example Flow

### Step 1: Backend Returns Data
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "Title": "Emergency Relief Fund",
  "Type": "Emergency",
  "Description": "Help needed for disaster relief",
  "Location": "Mumbai, India",
  "ImgCid": "QmXyZ123...",
  "NeedAmount": "50000",
  "WalletAddr": "GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJUCHUZI7VCZE7FDCVXWH6HUP",
  "NgoRef": "507f1f77bcf86cd799439012"
}
```

### Step 2: Frontend Stores It
```typescript
// TaskCard receives:
task = {
  id: "507f1f77bcf86cd799439011",    // ✅ MongoDB _id (string)
  _id: "507f1f77bcf86cd799439011",   // ✅ Original for API calls
  title: "Emergency Relief Fund",
  description: "...",
  goal: 50000,
  raised: 35000,
  // ... other fields
}
```

### Step 3: User Clicks Task
```html
<!-- User sees task card -->
<Card>
  <h3>Emergency Relief Fund</h3>
  <Button>Donate</Button>
  <!-- Clicking links to: -->
  <Link href="/task/507f1f77bcf86cd799439011">
```

### Step 4: URL Navigation
```
Browser URL: 
http://localhost:3000/task/507f1f77bcf86cd799439011
                                   ↑
                            MongoDB _id stays
```

### Step 5: Task Detail Page Fetches
```typescript
// Page receives: params.id = "507f1f77bcf86cd799439011"

// Fetches all posts from backend
const postsResponse = await apiService.getPosts()

// Finds matching post:
const foundTask = postsResponse.data.find(
  (p: Post) => p._id === params.id
)

// Comparison:
// p._id: "507f1f77bcf86cd799439011"
// params.id: "507f1f77bcf86cd799439011"
// Match! ✅
```

### Step 6: Fetches Related Data
```typescript
// Uses the MongoDB _id to fetch donations
await apiService.getDonationsByPostId(foundTask._id)
// Calls: GET /api/donations/post/507f1f77bcf86cd799439011

// Uses MongoDB _id to fetch expenses
await apiService.getExpensesByPostId(foundTask._id)
// Calls: GET /api/expenses/prev-txn/507f1f77bcf86cd799439011
```

## 🔄 Complete Backend Call Chain

```
User clicks task
    ↓
Frontend: task.id = "507f1f77bcf86cd799439011"
    ↓
Navigate: /task/507f1f77bcf86cd799439011
    ↓
Page loads: params.id = "507f1f77bcf86cd799439011"
    ↓
GET /api/posts → Find by _id
    ↓
Found: { _id: "507f1f77...", ... }
    ↓
GET /api/donations/post/507f1f77bcf86cd799439011
    ↓
Backend: Query donations WHERE postIDs = "507f1f77..."
    ↓
Returns: Donation[]
    ↓
GET /api/expenses/prev-txn/507f1f77bcf86cd799439011
    ↓
Backend: Query expenses WHERE postID = "507f1f77..."
    ↓
Returns: Expense[]
    ↓
Display everything to user
```

## 🎯 Key Points

### 1. ID Type Consistency
```typescript
❌ WRONG: parseInt(post._id)
✅ RIGHT: post._id (keep as string)

❌ WRONG: id: NaN
✅ RIGHT: id: "507f1f77bcf86cd799439011"
```

### 2. URL Generation
```typescript
❌ WRONG: href={`/task/${parseInt(post._id)}`}
✅ RIGHT: href={`/task/${post._id}`}

❌ URL: /task/NaN
✅ URL: /task/507f1f77bcf86cd799439011
```

### 3. Backend API Calls
```typescript
❌ WRONG: getDonationsByPostId(parseInt(params.id))
✅ RIGHT: getDonationsByPostId(foundTask._id)

❌ Call: GET /donations/post/NaN
✅ Call: GET /donations/post/507f1f77bcf86cd799439011
```

## 📦 Storage Locations

### In Frontend Redux:
```typescript
// Wallet state stores user's connected wallet
{
  publicKey: "GBUQWP3BOUZX34...",
  isConnected: true,
  walletType: "freighter"
}
```

### In Database:
```typescript
// Post collection
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  NgoRef: ObjectId("507f1f77bcf86cd799439012"),
  // ... other fields
}

// Donation collection
{
  _id: ObjectId("507f1f77bcf86cd799439020"),
  postIDs: "507f1f77bcf86cd799439011", // References post
  Amount: 1000,
  // ...
}
```

### In Backend API:
```typescript
// Query donations by post
router.get("/post/:postId", ...)
// postId = "507f1f77bcf86cd799439011"
// Creates: new Types.ObjectId(postId)
```

## ✅ Summary

**ID Flow:**
```
Backend MongoDB _id: "507f1f77bcf86cd799439011"
    ↓
Frontend task.id: "507f1f77bcf86cd799439011"
    ↓
URL: /task/507f1f77bcf86cd799439011
    ↓
Page params.id: "507f1f77bcf86cd799439011"
    ↓
Match with backend: p._id === "507f1f77bcf86cd799439011"
    ↓
Fetch related data using same _id
    ↓
Display everything
```

Everything now flows correctly from frontend to backend! 🎉

