# Wallet and NGO Separation

## Overview

Users with connected wallets should not see NGO login/signup options, and vice versa. This ensures a clear separation between regular users (donors) and NGO accounts.

---

## Implementation

### 1. Home Page - Hide NGO Login Button

**File:** `/frontend/app/page.tsx`

**Before:**
```tsx
{ngoAuthenticated ? (
  <Link href="/ngo-dashboard">
    <Button>Dashboard</Button>
  </Link>
) : (
  <Link href="/ngo/login">
    <Button>NGO Login</Button>
  </Link>
)}
```

**After:**
```tsx
{ngoAuthenticated ? (
  <Link href="/ngo-dashboard">
    <Button>Dashboard</Button>
  </Link>
) : !walletConnected ? (
  <Link href="/ngo/login">
    <Button>NGO Login</Button>
  </Link>
) : null}
```

**Logic:**
- If NGO is authenticated → Show "Dashboard" button
- If wallet is connected → Show nothing (hide NGO login)
- If neither → Show "NGO Login" button

---

### 2. NGO Login Page - Redirect Wallet Users

**File:** `/frontend/app/ngo/login/page.tsx`

**Added:**
```tsx
const { isConnected: walletConnected } = useSelector((state: RootState) => state.wallet)

useEffect(() => {
  if (isAuthenticated) {
    router.push("/ngo-dashboard")
  } else if (walletConnected) {
    // If user wallet is connected, redirect to home
    router.push("/")
  }
}, [isAuthenticated, walletConnected, router])
```

**Logic:**
- If NGO is authenticated → Redirect to NGO dashboard
- If wallet is connected → Redirect to home page
- Otherwise → Show login form

---

### 3. NGO Signup Page - Redirect Wallet Users

**File:** `/frontend/app/ngo/signup/page.tsx`

**Added:**
```tsx
const { isConnected: walletConnected } = useSelector((state: RootState) => state.wallet)

useEffect(() => {
  if (isAuthenticated) {
    router.push("/ngo-dashboard")
  } else if (walletConnected) {
    // If user wallet is connected, redirect to home
    router.push("/")
  }
}, [isAuthenticated, walletConnected, router])
```

**Logic:**
- If NGO is authenticated → Redirect to NGO dashboard
- If wallet is connected → Redirect to home page
- Otherwise → Show signup form

---

## User Flows

### Regular User (Donor) Flow

```
1. User visits homepage
   ↓
2. Clicks "Connect Wallet"
   ↓
3. Connects Freighter wallet
   ↓
4. ✅ NGO Login button disappears
   ↓
5. User can browse and donate to tasks
   ↓
6. If user tries to visit /ngo/login or /ngo/signup
   → Automatically redirected to home page
```

### NGO Flow

```
1. NGO visits homepage
   ↓
2. Clicks "NGO Login" (wallet NOT connected)
   ↓
3. Logs in with email/password
   ↓
4. ✅ Redirected to NGO Dashboard
   ↓
5. NGO can create tasks and send payments
   ↓
6. NGO can also connect wallet if needed
   (for viewing their own wallet balance)
```

### Separation Logic

| State | NGO Login Visible | Can Access NGO Pages | Can Donate |
|-------|-------------------|---------------------|------------|
| No wallet, No NGO | ✅ Yes | ✅ Yes | ❌ No |
| Wallet connected | ❌ No | ❌ No (redirected) | ✅ Yes |
| NGO authenticated | ❌ No (shows Dashboard) | ✅ Yes | ❌ No |
| Both (edge case) | Shows Dashboard | ✅ Yes | ✅ Yes |

---

## Why This Separation?

### 1. **Clear User Roles**
- **Donors** use wallets to send XLM
- **NGOs** use email/password to manage tasks

### 2. **Prevent Confusion**
- Users with wallets don't need NGO accounts
- NGOs don't need to connect wallets to create tasks

### 3. **Security**
- Wallet users can't accidentally access NGO features
- NGO credentials are separate from wallet keys

### 4. **Better UX**
- Clean interface without redundant options
- Users see only what's relevant to them

---

## Edge Cases

### What if NGO wants to connect wallet?

NGOs can still connect wallets after logging in. This is useful for:
- Viewing their own wallet balance
- Testing donations to their own tasks

**Flow:**
```
1. NGO logs in
2. Goes to NGO Dashboard
3. Clicks "Connect Wallet" in header
4. Both NGO profile and wallet shown
```

### What if user disconnects wallet?

```
1. User disconnects wallet
2. NGO Login button reappears on homepage
3. User can now access NGO login/signup pages
```

### What if NGO logs out?

```
1. NGO logs out
2. If wallet is still connected:
   → NGO Login button stays hidden
3. If wallet is disconnected:
   → NGO Login button appears
```

---

## Testing

### Test 1: Wallet User Cannot Access NGO Pages

1. Connect wallet
2. Try to visit `/ngo/login`
3. ✅ Should redirect to home page
4. Try to visit `/ngo/signup`
5. ✅ Should redirect to home page

### Test 2: NGO Login Button Hidden When Wallet Connected

1. Visit homepage (no wallet)
2. ✅ NGO Login button visible
3. Connect wallet
4. ✅ NGO Login button disappears

### Test 3: NGO Can Still Connect Wallet

1. Login as NGO
2. Go to NGO Dashboard
3. Click "Connect Wallet"
4. ✅ Wallet connects successfully
5. ✅ Both NGO profile and wallet shown in header

### Test 4: Disconnect Wallet Shows NGO Options

1. Connect wallet (NGO Login hidden)
2. Disconnect wallet
3. ✅ NGO Login button reappears

---

## Code Changes Summary

### Files Modified

1. **`/frontend/app/page.tsx`**
   - Added wallet state check
   - Hide NGO Login button when wallet connected

2. **`/frontend/app/ngo/login/page.tsx`**
   - Added wallet state check
   - Redirect wallet users to home page

3. **`/frontend/app/ngo/signup/page.tsx`**
   - Added wallet state check
   - Redirect wallet users to home page

### Redux State Used

```typescript
// Wallet state
const { isConnected: walletConnected } = useSelector(
  (state: RootState) => state.wallet
)

// NGO auth state
const { isAuthenticated: ngoAuthenticated } = useSelector(
  (state: RootState) => state.ngoAuth
)
```

---

## Benefits

### For Users
- ✅ Cleaner interface
- ✅ No confusion about which option to use
- ✅ Faster access to relevant features

### For NGOs
- ✅ Clear separation of concerns
- ✅ Can still use wallet if needed
- ✅ Secure authentication system

### For Developers
- ✅ Clear user role separation
- ✅ Easy to maintain
- ✅ Prevents edge case bugs

---

## Future Enhancements

### Possible Improvements

1. **Show a message when redirected**
   ```tsx
   if (walletConnected) {
     toast.info("You're already connected as a donor")
     router.push("/")
   }
   ```

2. **Add a "Switch to NGO" option**
   - Allow users to disconnect wallet and access NGO login
   - Show confirmation dialog

3. **Unified account system**
   - Allow NGOs to link their wallet to their account
   - Single login for both roles

---

## Summary

✅ **Wallet users** don't see NGO login/signup options
✅ **Wallet users** are redirected from NGO auth pages
✅ **NGOs** can still connect wallets if needed
✅ **Clear separation** between donor and NGO roles
✅ **Better UX** with relevant options only

**The separation is complete and working!** 🎉
