# NGO Signup Error Fix

## Problem

NGO signup was failing with "Something went wrong!" error in the frontend.

**Frontend Error:**
```
Something went wrong!
at request (lib/api-service.ts:164:15)
```

---

## Root Cause

The `saveDataAndToken` function in `/server/src/dbQueries/user.Queries.ts` was **returning** errors instead of **throwing** them.

**Before (Line 55):**
```typescript
} catch (error) {
  return error;  // ❌ Returns error object instead of throwing
}
```

This caused the signup controller to treat the error as successful data, leading to confusing behavior.

---

## The Fix

### 1. Throw Errors Instead of Returning Them

**File:** `/server/src/dbQueries/user.Queries.ts`

**Before:**
```typescript
const saveDataAndToken = async (userData: userSingupData) => {
  try {
    const Data = await ngoModel.create({...});
    // ... generate tokens
    return {
      success: true,
      accessToken,
      refreshToken,
      userData: {...}
    };
  } catch (error) {
    return error;  // ❌ Wrong!
  }
};
```

**After:**
```typescript
const saveDataAndToken = async (userData: userSingupData) => {
  try {
    console.log("💾 Saving NGO data:", {
      email: userData.email,
      ngoName: userData.ngoName,
      regNumber: userData.regNumber,
    });
    
    const Data = await ngoModel.create({...});
    
    console.log("✅ NGO data saved successfully:", Data._id);
    
    const { accessToken, refreshToken } = await Data.generateTokens();
    return {
      success: true,
      accessToken,
      refreshToken,
      userData: {...}
    };
  } catch (error: any) {
    console.error("❌ Error in saveDataAndToken:", error.message);
    throw error;  // ✅ Throw error properly
  }
};
```

---

## What Changed

### 1. Error Handling Fixed
```typescript
// Before
} catch (error) {
  return error;  // Returns error as data
}

// After
} catch (error: any) {
  console.error("❌ Error in saveDataAndToken:", error.message);
  throw error;  // Throws error properly
}
```

### 2. Added Logging
```typescript
// Before save
console.log("💾 Saving NGO data:", {
  email: userData.email,
  ngoName: userData.ngoName,
  regNumber: userData.regNumber,
});

// After save
console.log("✅ NGO data saved successfully:", Data._id);

// On error
console.error("❌ Error in saveDataAndToken:", error.message);
```

---

## Signup Flow

### Complete NGO Signup Process

```
1. Frontend sends signup data
   POST /api/user/signup
   {
     ngoName: "Help Foundation",
     regNumber: "REG123",
     description: "Helping people",
     email: "ngo@example.com",
     phoneNo: "1234567890",
     password: "password123"
   }
   ↓
2. Backend normalizes field names
   - Handles variations (ngoName, ngo_name, organizationName)
   - Validates required fields
   ↓
3. Check if user already exists
   - Query by email
   - Throw error if exists
   ↓
4. Create Stellar blockchain account
   - Generate public/private key pair
   - Fund account on testnet
   ↓
5. Save NGO data to MongoDB
   {
     Email: "ngo@example.com",
     NgoName: "Help Foundation",
     RegNumber: "REG123",
     Description: "Helping people",
     PublicKey: "GABC...",
     PrivateKey: "SABC...",
     PhoneNo: "1234567890",
     Password: "hashed_password"
   }
   ↓
6. Generate JWT tokens
   - Access token (15 min)
   - Refresh token (7 days)
   ↓
7. Return success response
   {
     success: true,
     accessToken: "...",
     refreshToken: "...",
     userData: {
       Id: "...",
       Email: "...",
       NgoName: "...",
       PublicKey: "..."
     }
   }
```

---

## Expected Behavior Now

### Success Case

**Backend Logs:**
```
💾 Saving NGO data: { email: 'ngo@example.com', ngoName: 'Help Foundation', regNumber: 'REG123' }
✅ Stellar account created: GABC123...
✅ NGO data saved successfully: 507f1f77bcf86cd799439011
```

**Frontend Response:**
```json
{
  "statusCode": 200,
  "data": {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userData": {
      "Id": "507f1f77bcf86cd799439011",
      "Email": "ngo@example.com",
      "NgoName": "Help Foundation",
      "PublicKey": "GABC123..."
    }
  },
  "message": "User registered successfully with blockchain account",
  "success": true
}
```

### Error Cases

**1. User Already Exists:**
```json
{
  "statusCode": 401,
  "message": "User already exists",
  "success": false
}
```

**2. Missing Required Fields:**
```json
{
  "statusCode": 400,
  "message": "Missing required fields: ngoName, regNumber",
  "success": false
}
```

**3. Stellar Account Creation Failed:**
```json
{
  "statusCode": 500,
  "message": "Failed to create blockchain account",
  "success": false
}
```

**4. Database Save Failed:**
```json
{
  "statusCode": 500,
  "message": "Signup failed: [specific error message]",
  "success": false
}
```

---

## Testing

### Test Successful Signup

```bash
curl -X POST http://localhost:8000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "ngoName": "Test NGO",
    "regNumber": "TEST123",
    "description": "Test description",
    "email": "test@example.com",
    "phoneNo": "1234567890",
    "password": "password123"
  }'
```

**Expected:**
- Status: 200
- Response contains accessToken, refreshToken, userData
- Backend logs show success messages

### Test Duplicate Email

```bash
# Try to signup with same email again
curl -X POST http://localhost:8000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "ngoName": "Another NGO",
    "regNumber": "TEST456",
    "description": "Another description",
    "email": "test@example.com",
    "phoneNo": "9876543210",
    "password": "password456"
  }'
```

**Expected:**
- Status: 401
- Message: "User already exists"

---

## Files Modified

1. **`/server/src/dbQueries/user.Queries.ts`**
   - Line 64-66: Changed `return error` to `throw error`
   - Added logging for debugging
   - Better error messages

---

## Common Signup Issues

### Issue 1: "User already exists"

**Cause:** Email is already registered

**Solution:** Use different email or login instead

### Issue 2: "Missing required fields"

**Cause:** Frontend not sending all required fields

**Required Fields:**
- ngoName
- regNumber
- description
- email
- phoneNo
- password

### Issue 3: "Failed to create blockchain account"

**Cause:** Stellar account creation failed

**Solution:**
- Check internet connection
- Verify Stellar testnet is accessible
- Check Friendbot is working

### Issue 4: "Signup failed: E11000 duplicate key error"

**Cause:** Duplicate email, regNumber, or ngoName

**Solution:**
- Use unique email
- Use unique registration number
- Use unique NGO name

---

## Summary

### What Was Wrong

❌ **Error handling:** Returning errors instead of throwing them
❌ **No logging:** Hard to debug issues
❌ **Silent failures:** Errors treated as success

### What's Fixed

✅ **Proper error handling:** Errors are thrown correctly
✅ **Logging added:** Can see what's happening
✅ **Clear error messages:** Know exactly what went wrong
✅ **Proper status codes:** Frontend can handle errors correctly

**NGO signup should now work properly!** 🎉
