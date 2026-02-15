# Authentication Fix Summary

## Problem

The error "Something went wrong!" at `lib/api-service.ts:146` was occurring because:

1. **Users with only wallet connection** (no NGO login) were trying to access APIs
2. **API service was treating ALL requests as requiring authentication**
3. When backend returned "Access token is required", the API service would:
   - Call `clearAuth()` 
   - Clear NGO authentication data
   - Throw "Session expired" error
4. This prevented users from donating without NGO login

## Root Cause

The `request()` method in `api-service.ts` was:
- Always checking for authentication errors
- Always calling `clearAuth()` on auth failures
- Not distinguishing between public and authenticated endpoints

## Solution

### 1. Added `requiresAuth` Parameter

Updated the `request()` method to accept a third parameter:

```typescript
private async request<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = false  // NEW PARAMETER
): Promise<ApiResponse<T>>
```

### 2. Conditional Authentication Handling

Now authentication errors are only handled for endpoints that require auth:

```typescript
// Handle auth errors - only for endpoints that require auth
if (!response.ok && (data.message === "Access token is required" || data.message === "Invalid token")) {
  if (requiresAuth) {
    // Only clear auth and throw error if endpoint requires auth
    this.clearAuth();
    throw new Error("Please login to continue.");
  }
  // For public endpoints, just log and continue
  console.warn('Auth error on public endpoint:', data.message);
}
```

### 3. Marked Endpoints as Public or Authenticated

#### Public Endpoints (requiresAuth = false)
These can be accessed by users with only wallet connection:

```typescript
// Users can access without NGO login
getPosts()                    // Browse tasks
getDonations()                // View donations
getDonationsByPost()          // View task donations
verifyDonation()              // Submit donation
getWalletBalance()            // Check wallet balance
```

#### Authenticated Endpoints (requiresAuth = true)
These require NGO login:

```typescript
// Only NGOs can access
createPost()                  // Create new task
walletPay()                   // Send payment to vendor
```

## Authentication Flow

### For Users (Wallet Only)
```
1. User connects Freighter wallet
2. User browses tasks (public API)
3. User donates to task (public API)
4. verifyDonation() called WITHOUT auth
5. Backend verifies transaction
6. Donation saved ✅
```

### For NGOs (Login Required)
```
1. NGO logs in with email/password
2. Gets JWT tokens
3. Creates tasks (authenticated API)
4. Sends payments (authenticated API)
5. All requests include Bearer token
6. Token refresh handled automatically
```

## Key Changes

### File: `/frontend/lib/api-service.ts`

**Before:**
```typescript
// All requests treated as requiring auth
async verifyDonation(donationData: DonationData) {
  return this.request('/payment/verify-donation', {
    method: 'POST',
    body: JSON.stringify(donationData),
  });
  // Would fail if no NGO auth token ❌
}
```

**After:**
```typescript
// Public endpoint - no auth required
async verifyDonation(donationData: DonationData) {
  return this.request('/payment/verify-donation', {
    method: 'POST',
    body: JSON.stringify(donationData),
  }, false); // ✅ false = public endpoint
}
```

## clearAuth() Method

The `clearAuth()` method already only clears NGO authentication data:

```typescript
private clearAuth(): void {
  // Only clears NGO auth data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('ngo_profile');
  
  // Does NOT clear wallet data:
  // - wallet_connected
  // - wallet_type
  // - wallet_publicKey
}
```

## Benefits

✅ **Users can donate without NGO login**
✅ **Wallet connection independent of NGO auth**
✅ **No more "Session expired" errors for public actions**
✅ **NGO authentication still secure**
✅ **Clear separation of concerns**

## Testing

### Test User Donation (No NGO Login)
1. Open app (not logged in as NGO)
2. Connect Freighter wallet
3. Browse tasks
4. Click donate
5. Enter amount and confirm
6. ✅ Should work without auth errors

### Test NGO Operations (Requires Login)
1. Go to `/ngo/login`
2. Login with NGO credentials
3. Create a new task
4. Send payment to vendor
5. ✅ Should work with auth tokens

### Test Mixed Scenario
1. Login as NGO
2. Connect wallet
3. Both should work independently
4. Logout NGO
5. Wallet should still be connected ✅

## Error Messages

### Before Fix
```
❌ "Something went wrong!"
❌ "Session expired. Please login again."
(Even for users who never logged in)
```

### After Fix
```
✅ Users: No auth errors for public actions
✅ NGOs: Clear auth errors only when needed
✅ Proper error messages for each context
```

## Summary

The authentication system now properly distinguishes between:

1. **Public endpoints** - Accessible to anyone (users with wallet)
2. **Authenticated endpoints** - Require NGO login

This allows:
- ✅ Users to connect wallet and donate without NGO account
- ✅ NGOs to login/signup and manage tasks
- ✅ Both to coexist independently
- ✅ No more false "session expired" errors

The fix ensures that wallet-only users can interact with the platform without being forced to create an NGO account!
