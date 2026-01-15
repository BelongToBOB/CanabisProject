# Token Storage Fix - Quick Summary

## Problem
❌ Both ADMIN and STAFF cannot create sales orders
❌ localStorage has BOTH `authToken` and `token` keys
❌ Requests sent WITHOUT Authorization header
❌ Backend returns 401 → automatic logout

## Root Cause
Axios interceptor was reading from wrong/inconsistent localStorage key, so the Authorization header was not being attached to requests.

## Solution
✅ Standardized to ONE key: `authToken`
✅ Updated axios interceptor to always attach token
✅ Added backward compatibility fallback
✅ Fixed 401 response handler (no API call on logout)
✅ Added comprehensive logging

## Changes Made

### File 1: `client/src/services/api.ts`

**Request Interceptor:**
- Reads from `authToken` first, fallback to `token`
- Always attaches `Authorization: Bearer ${token}` header
- Logs when token is attached
- Logs warning when token is missing

**Response Interceptor:**
- On 401: Clears ALL storage (authToken, token, user)
- Does NOT call `/auth/logout` endpoint
- Redirects to login page

### File 2: `client/src/contexts/AuthContext.tsx`

**Login:**
- Removes legacy `token` key before storing
- Stores token ONLY in `authToken` key
- Logs login success with user info

**Logout:**
- Clears all keys (authToken, token, user)
- Does NOT call `/auth/logout` endpoint
- Logs logout action

**Initialization:**
- Checks for legacy `token` key and migrates to `authToken`
- Logs auth state restoration
- Cleans up legacy keys

## How to Test

### Quick Test (30 seconds)
1. Open browser console (F12)
2. Run: `localStorage.clear(); location.reload();`
3. Login as ADMIN or STAFF
4. Check console for: `[Auth] Token stored in authToken key`
5. Go to "สร้างใบสั่งขาย" (Create Sales Order)
6. Check console for: `[API] Attaching token to request: /batches/available`
7. Verify batches load in dropdown
8. Create a sales order
9. Check console for: `[API] Attaching token to request: /sales-orders`
10. Verify order is created successfully

### Verify Token Storage
```javascript
// In console:
console.log('authToken:', !!localStorage.getItem('authToken'));
console.log('token:', !!localStorage.getItem('token'));
// Expected: authToken: true, token: false
```

### Verify Authorization Header
1. Open Network tab (F12)
2. Make any API request
3. Check request headers
4. Should see: `Authorization: Bearer eyJ...`

## Expected Results

### ✅ Success Indicators
- Only `authToken` key in localStorage (no `token` key)
- Console shows `[API] Attaching token to request` for all protected endpoints
- Network tab shows `Authorization: Bearer ...` in request headers
- GET `/api/batches/available` returns 200 OK with batch data
- POST `/api/sales-orders` returns 201 Created
- Both ADMIN and STAFF can create sales orders
- No unexpected 401 errors or automatic logouts

### ❌ If Still Failing
1. Check console for `[API] No auth token found` warning
2. Verify `authToken` exists in localStorage
3. Check Network tab for Authorization header
4. Restart server: `cd server && npm run dev`
5. Clear browser storage and login again

## Console Logs to Look For

### Success:
```
[Auth] Attempting login for: username
[Auth] Login successful, storing token for user: username role: ADMIN
[Auth] Token stored in authToken key
[API] Attaching token to request: /batches/available
[API] Attaching token to request: /sales-orders
```

### Failure:
```
[API] No auth token found for request: /batches/available
[API] 401 Unauthorized - clearing auth state
```

## Files Modified
1. ✅ `client/src/services/api.ts` - Fixed axios interceptors
2. ✅ `client/src/contexts/AuthContext.tsx` - Standardized token storage

## Documentation Created
1. ✅ `TOKEN_FIX_VERIFICATION.md` - Detailed testing guide
2. ✅ `TOKEN_FIX_SUMMARY.md` - This file

## Next Steps
1. Restart client: `cd client && npm run dev`
2. Clear browser storage: `localStorage.clear()`
3. Login and test creating sales orders
4. Verify both ADMIN and STAFF can create orders

---

**The fix is complete and ready to test!** 🚀

Both ADMIN and STAFF users should now be able to create sales orders successfully.
