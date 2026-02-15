# Field Name Mismatch Fix - NGO Signup

## Problem

NGO signup was failing because the frontend form was sending different field names than what the Redux action expected.

**Error:** "Something went wrong!"

---

## Root Cause

### Field Name Mismatch

**Frontend Form Sends:**
```typescript
{
  ngoName: "Help Foundation",        // ✅
  regNumber: "REG123",               // ✅
  description: "Helping people",
  email: "ngo@example.com",
  phoneNo: "1234567890",
  password: "password123"
}
```

**Redux Action Expected:**
```typescript
{
  name: ngoData.name,                    // ❌ Wrong field!
  registrationNumber: ngoData.registrationNumber,  // ❌ Wrong field!
  description: ngoData.description,
  email: ngoData.email,
  phoneNo: ngoData.phoneNo,
  password: ngoData.password
}
```

**Result:** Backend received `undefined` for `ngoName` and `regNumber`

---

## The Fix

### File: `/frontend/lib/redux/slices/ngo-auth-slice.ts`

**Before (Lines 80-81):**
```typescript
const response = await apiService.signup({
  ngoName: ngoData.name,                    // ❌ ngoData.name is undefined
  regNumber: ngoData.registrationNumber,    // ❌ ngoData.registrationNumber is undefined
  description: ngoData.description,
  email: ngoData.email,
  phoneNo: ngoData.phoneNo,
  password: ngoData.password,
})
```

**After:**
```typescript
const response = await apiService.signup({
  ngoName: ngoData.ngoName,        // ✅ Correct field name
  regNumber: ngoData.regNumber,    // ✅ Correct field name
  description: ngoData.description,
  email: ngoData.email,
  phoneNo: ngoData.phoneNo,
  password: ngoData.password,
})
```

---

## Data Flow

### Complete Flow (Fixed)

```
1. User fills signup form
   ↓
2. Form state:
   {
     ngoName: "Help Foundation",
     regNumber: "REG123",
     description: "Helping people",
     email: "ngo@example.com",
     phoneNo: "1234567890",
     password: "password123",
     confirmPassword: "password123"
   }
   ↓
3. On submit, remove confirmPassword:
   const { confirmPassword, ...signupData } = formData
   ↓
4. Dispatch to Redux:
   dispatch(signupNGO(signupData))
   ↓
5. Redux action maps fields correctly:
   {
     ngoName: ngoData.ngoName,      // ✅ "Help Foundation"
     regNumber: ngoData.regNumber,  // ✅ "REG123"
     description: ngoData.description,
     email: ngoData.email,
     phoneNo: ngoData.phoneNo,
     password: ngoData.password
   }
   ↓
6. API call to backend:
   POST /api/user/signup
   ↓
7. Backend receives correct data:
   {
     ngoName: "Help Foundation",    // ✅ Not undefined
     regNumber: "REG123",           // ✅ Not undefined
     ...
   }
   ↓
8. Backend validates and saves
   ↓
9. Success! ✅
```

---

## Field Mapping Reference

| Form Field | Redux Action | Backend Expects | Status |
|------------|--------------|-----------------|--------|
| `ngoName` | `ngoData.ngoName` | `ngoName` | ✅ Fixed |
| `regNumber` | `ngoData.regNumber` | `regNumber` | ✅ Fixed |
| `description` | `ngoData.description` | `description` | ✅ Already correct |
| `email` | `ngoData.email` | `email` | ✅ Already correct |
| `phoneNo` | `ngoData.phoneNo` | `phoneNo` | ✅ Already correct |
| `password` | `ngoData.password` | `password` | ✅ Already correct |

---

## Why This Happened

The Redux action was written expecting a different data structure (probably from an older version of the form):

**Old Form Structure (Expected):**
```typescript
{
  name: "",              // Old field name
  registrationNumber: "", // Old field name
  ...
}
```

**Current Form Structure (Actual):**
```typescript
{
  ngoName: "",      // Current field name
  regNumber: "",    // Current field name
  ...
}
```

The form was updated but the Redux action wasn't updated to match.

---

## Files Modified

1. **`/frontend/lib/redux/slices/ngo-auth-slice.ts`**
   - Line 76: Changed type to `any` for flexibility
   - Line 80: Changed `ngoData.name` → `ngoData.ngoName`
   - Line 81: Changed `ngoData.registrationNumber` → `ngoData.regNumber`

---

## Testing

### Test Signup with Correct Data

**Form Input:**
```
NGO Name: Test Foundation
Registration Number: TEST123
Description: Test description
Email: test@example.com
Phone: 1234567890
Password: password123
Confirm Password: password123
```

**Expected Result:**
- ✅ Form validates
- ✅ Redux action receives correct fields
- ✅ Backend receives all required fields
- ✅ NGO account created successfully
- ✅ Redirected to NGO Dashboard

### Backend Should Receive:

```json
{
  "ngoName": "Test Foundation",
  "regNumber": "TEST123",
  "description": "Test description",
  "email": "test@example.com",
  "phoneNo": "1234567890",
  "password": "password123"
}
```

**Not:**
```json
{
  "ngoName": undefined,     // ❌ Before fix
  "regNumber": undefined,   // ❌ Before fix
  ...
}
```

---

## Common Field Name Issues

### Issue 1: Undefined Fields

**Symptom:** Backend receives `undefined` for some fields

**Cause:** Field name mismatch between form and Redux action

**Solution:** Ensure field names match exactly:
- Form: `ngoName`
- Redux: `ngoData.ngoName`
- Backend: `ngoName`

### Issue 2: Missing Required Fields Error

**Symptom:** Backend returns "Missing required fields: ngoName, regNumber"

**Cause:** Fields are `undefined` due to name mismatch

**Solution:** Check field mapping in Redux action

### Issue 3: Validation Passes but Signup Fails

**Symptom:** Frontend validation passes, but backend rejects

**Cause:** Frontend sends wrong field names

**Solution:** Verify field names match backend expectations

---

## Best Practices

### 1. Consistent Field Names

Use the same field names across:
- Frontend form
- Redux actions
- API calls
- Backend controllers

### 2. Type Safety

Use TypeScript interfaces to catch mismatches:

```typescript
interface SignupData {
  ngoName: string;
  regNumber: string;
  description: string;
  email: string;
  phoneNo: string;
  password: string;
}

// This will show type error if fields don't match
const data: SignupData = {
  name: "...",  // ❌ Type error: 'name' doesn't exist
  ngoName: "..." // ✅ Correct
}
```

### 3. Logging

Add logging to see what data is being sent:

```typescript
console.log("Form data:", formData);
console.log("Sending to API:", signupData);
```

---

## Summary

### What Was Wrong

❌ **Field names didn't match:**
- Form sent: `ngoName`, `regNumber`
- Redux expected: `name`, `registrationNumber`
- Backend received: `undefined`, `undefined`

### What's Fixed

✅ **Field names now match:**
- Form sends: `ngoName`, `regNumber`
- Redux uses: `ngoData.ngoName`, `ngoData.regNumber`
- Backend receives: `"Help Foundation"`, `"REG123"`

### Result

**NGO signup now works correctly!** All fields are properly mapped from form → Redux → API → Backend. 🎉
