# Hide Wallet Connection for NGO Dashboard

## Change

NGO Dashboard no longer shows the "Connect Wallet" button. NGOs use email/password authentication, not wallet authentication.

---

## The Fix

**File:** `/frontend/components/header.tsx`

**Before:**
```tsx
{/* User Wallet Section - Only show if not NGO authenticated */}
{!ngoAuthenticated && <WalletData />}

{/* Show wallet for NGO too, but separately */}
{ngoAuthenticated && <WalletData />}  // ❌ Showing wallet for NGO

{/* Full Logout Button */}
{(ngoAuthenticated || walletConnected) && (
  <Button onClick={handleFullLogout}>Clear All</Button>
)}
```

**After:**
```tsx
{/* User Wallet Section - Only show if NOT NGO authenticated */}
{!ngoAuthenticated && <WalletData />}  // ✅ Only for users
```

---

## Header Display Logic

### For Regular Users (Donors)

```tsx
<Header>
  <StellarPriceDisplay />
  <WalletData />  // ✅ Shows "Connect Wallet" or wallet info
</Header>
```

**Display:**
```
[Soul-Society] [Explore] [Features] [Verify]    [₹28.60] [Connect Wallet]
```

### For NGOs

```tsx
<Header>
  <StellarPriceDisplay />
  <NGOProfile />  // ✅ Shows NGO name and logout
  // No WalletData  ✅
</Header>
```

**Display:**
```
[Soul-Society] [Explore] [Features] [NGO Dashboard] [Verify]    [₹28.60] [NGO: Help Foundation] [Logout]
```

---

## Why This Change?

### 1. Different Authentication Methods

**Regular Users:**
- Authenticate with Stellar wallet (Freighter)
- No email/password
- Wallet = Identity

**NGOs:**
- Authenticate with email/password
- Have persistent accounts
- Wallet not needed for identity

### 2. Avoid Confusion

**Before:**
- NGO sees "Connect Wallet" button
- Confusing - they already logged in
- Might think they need to connect wallet

**After:**
- NGO only sees their profile and logout
- Clear and simple
- No confusion

### 3. Separate User Roles

**Donors (Users):**
- Connect wallet → Browse → Donate

**NGOs:**
- Login with email → Create tasks → Manage funds

---

## User Flows

### Regular User Flow

```
1. Visit homepage
   ↓
2. See "Connect Wallet" button
   ↓
3. Click and connect Freighter
   ↓
4. Browse tasks and donate
   ↓
5. Disconnect wallet when done
```

### NGO Flow

```
1. Visit homepage
   ↓
2. Click "NGO Login"
   ↓
3. Login with email/password
   ↓
4. See NGO Dashboard
   ↓
5. NO wallet button shown ✅
   ↓
6. Create tasks, manage funds
   ↓
7. Logout when done
```

---

## Header States

### State 1: Not Logged In

```
[Soul-Society] [Explore] [Features] [Verify]    [₹28.60] [Connect Wallet]
```

### State 2: Wallet Connected

```
[Soul-Society] [Explore] [Features] [Verify]    [₹28.60] [Balance: 100 XLM] [GABC...1234] [Disconnect]
```

### State 3: NGO Logged In

```
[Soul-Society] [Explore] [Features] [NGO Dashboard] [Verify]    [₹28.60] [NGO: Help Foundation] [Logout]
```

**No wallet button!** ✅

---

## Code Logic

### Conditional Rendering

```tsx
{/* Show wallet ONLY if NGO is NOT authenticated */}
{!ngoAuthenticated && <WalletData />}
```

**Truth Table:**

| ngoAuthenticated | Show WalletData |
|------------------|-----------------|
| false | ✅ Yes |
| true | ❌ No |

---

## What Was Removed

### 1. Duplicate WalletData for NGO

```tsx
// ❌ Removed
{ngoAuthenticated && <WalletData />}
```

### 2. Full Logout Button

```tsx
// ❌ Removed (redundant)
{(ngoAuthenticated || walletConnected) && (
  <Button onClick={handleFullLogout}>Clear All</Button>
)}
```

**Why removed:**
- NGO already has Logout button
- Users have Disconnect button
- "Clear All" was confusing

---

## Benefits

### 1. Cleaner UI

✅ NGO dashboard is cleaner
✅ No unnecessary buttons
✅ Clear separation of roles

### 2. Less Confusion

✅ NGOs don't see wallet options
✅ Clear what authentication method is used
✅ Obvious how to logout

### 3. Better UX

✅ Relevant options only
✅ Simpler interface
✅ Faster to understand

---

## Testing

### Test 1: Regular User

1. Visit homepage (not logged in)
2. ✅ Should see "Connect Wallet" button
3. Connect wallet
4. ✅ Should see wallet address and balance
5. ✅ Should see "Disconnect" button

### Test 2: NGO

1. Login as NGO
2. Go to NGO Dashboard
3. ✅ Should see "NGO: [Name]"
4. ✅ Should see "Logout" button
5. ❌ Should NOT see "Connect Wallet"
6. ❌ Should NOT see wallet address

### Test 3: Logout

1. Login as NGO
2. Click "Logout"
3. ✅ Should redirect to home
4. ✅ Should see "Connect Wallet" button again

---

## Files Modified

**`/frontend/components/header.tsx`**
- Removed line 93: `{ngoAuthenticated && <WalletData />}`
- Removed lines 96-107: Full logout button
- Kept line 90: `{!ngoAuthenticated && <WalletData />}`

---

## Summary

### What Changed

❌ **Before:** NGO dashboard showed wallet connection options
✅ **After:** NGO dashboard only shows NGO profile and logout

### Why

- NGOs use email/password, not wallet
- Avoid confusion
- Cleaner UI
- Better separation of user roles

### Result

**NGO dashboard is now cleaner with only relevant options!** 🎉
