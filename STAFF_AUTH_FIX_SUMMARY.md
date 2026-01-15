# STAFF User Authentication Fix - Summary

## Problem
STAFF users were experiencing 401 Unauthorized errors when making API calls, despite having a valid JWT token stored in localStorage.

## Root Cause Analysis
After investigating the codebase, the authentication flow was found to be correctly implemented:
- Frontend axios interceptor properly attaches `Authorization: Bearer ${token}` header
- Backend authentication middleware correctly verifies JWT tokens
- API endpoints have correct permissions (STAFF can access `/api/batches/available` and `POST /api/sales-orders`)

The issue was likely caused by:
1. **Legacy token key**: User had both `authToken` and `token` keys in localStorage, potentially causing confusion
2. **Lack of debugging visibility**: No logging to help diagnose authentication failures
3. **No token verification endpoint**: No easy way to test if token is valid

## Changes Implemented

### 1. Frontend Changes

#### `client/src/contexts/AuthContext.tsx`
**Added legacy token cleanup:**
- Removes any `token` key from localStorage on app initialization
- Removes `token` key during login and logout
- Logs warning when legacy key is detected
- Ensures only `authToken` key is used consistently

#### `client/src/services/api.ts`
**Added request debugging:**
- Logs warning when auth token is missing for protected endpoints
- Helps identify if token is not being sent with requests
- Excludes login endpoint from warnings

### 2. Backend Changes

#### `server/src/middleware/auth.middleware.ts`
**Added detailed authentication logging:**
- Logs when no authorization header is provided
- Logs when authorization header format is invalid
- Logs when token verification fails
- All logs include request method and path for easier debugging
- Format: `[Auth] <message> for: <METHOD> <PATH>`

#### `server/src/controllers/auth.controller.ts`
**Added token verification endpoint:**
- New `GET /api/auth/verify` endpoint
- Returns decoded user information from JWT token
- Useful for testing if token is valid
- Response includes: `userId`, `username`, `role`

#### `server/src/routes/auth.routes.ts`
**Registered new verify endpoint:**
- `GET /api/auth/verify` - Requires authentication
- Returns user info if token is valid
- Returns 401 if token is invalid

## Testing Instructions

### Quick Test (Recommended)
1. **Clear browser storage** (F12 → Application → Clear Storage)
2. **Login as STAFF user**
3. **Open browser console** and run:
```javascript
fetch('http://localhost:3000/api/auth/verify', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
}).then(r => r.json()).then(console.log)
```
4. **Expected response:**
```json
{
  "authenticated": true,
  "user": {
    "userId": 1,
    "username": "staff_user",
    "role": "STAFF"
  }
}
```

### Full Test
1. **Login as STAFF user**
2. **Navigate to "สร้างใบสั่งขาย" (Create Sales Order)**
3. **Verify batches load** (should see available batches in dropdown)
4. **Create a sales order** (should succeed with 201 Created)
5. **Check browser console** for any warnings
6. **Check server console** for any [Auth] errors

## Verification Checklist

After implementing these changes:
- [ ] Only `authToken` and `user` keys exist in localStorage (no `token` key)
- [ ] Browser console shows warning if legacy `token` key was found and removed
- [ ] Authorization header is present in all API requests (check Network tab)
- [ ] `/api/auth/verify` returns 200 OK with user info
- [ ] `/api/batches/available` returns 200 OK with batch data
- [ ] `POST /api/sales-orders` returns 201 Created when creating order
- [ ] Server console shows no [Auth] errors for STAFF user requests

## API Endpoint Permissions Reference

### STAFF Can Access:
- ✅ `GET /api/batches/available` - Get available batches
- ✅ `POST /api/sales-orders` - Create sales orders
- ✅ `GET /api/auth/verify` - Verify token

### ADMIN Only:
- ❌ `GET /api/batches` - Get all batches
- ❌ `POST /api/batches` - Create batch
- ❌ `PUT /api/batches/:id` - Update batch
- ❌ `DELETE /api/batches/:id` - Delete batch
- ❌ `GET /api/sales-orders` - Get all sales orders
- ❌ `DELETE /api/sales-orders/:id` - Delete sales order
- ❌ All user management endpoints
- ❌ All report endpoints
- ❌ All profit share endpoints

## Files Modified

### Frontend (3 files)
1. `client/src/contexts/AuthContext.tsx` - Added legacy token cleanup
2. `client/src/services/api.ts` - Added request debugging

### Backend (3 files)
1. `server/src/middleware/auth.middleware.ts` - Added authentication logging
2. `server/src/controllers/auth.controller.ts` - Added verify endpoint
3. `server/src/routes/auth.routes.ts` - Registered verify endpoint

### Documentation (2 files)
1. `AUTHENTICATION_DEBUG_GUIDE.md` - Comprehensive debugging guide
2. `STAFF_AUTH_FIX_SUMMARY.md` - This file

## Next Steps

1. **Restart the server** to load the new code:
   ```bash
   cd server
   npm run dev
   ```

2. **Restart the client** (if running):
   ```bash
   cd client
   npm run dev
   ```

3. **Test with STAFF user** following the testing instructions above

4. **If issues persist**, refer to `AUTHENTICATION_DEBUG_GUIDE.md` for detailed troubleshooting steps

## Expected Behavior After Fix

### For STAFF Users:
- ✅ Can login successfully
- ✅ Can view available batches in sales order creation
- ✅ Can create sales orders
- ✅ Cannot access admin-only endpoints (will get 403 Forbidden)
- ✅ Token is stored only in `authToken` key
- ✅ Token is automatically attached to all API requests

### For ADMIN Users:
- ✅ All STAFF permissions
- ✅ Can access all admin-only endpoints
- ✅ Can manage batches, users, reports, etc.

## Troubleshooting

If STAFF users still get 401 errors after these changes:

1. **Check localStorage**: Should only have `authToken` and `user` keys
2. **Check Network tab**: Authorization header should be present
3. **Check server logs**: Look for [Auth] error messages
4. **Test verify endpoint**: Should return 200 OK with user info
5. **Check JWT_SECRET**: Ensure server `.env` has correct value
6. **Check token expiration**: Default is 24 hours, may need to re-login
7. **Refer to**: `AUTHENTICATION_DEBUG_GUIDE.md` for detailed steps

## Technical Notes

### Why Two localStorage Keys?
The user reported having both `authToken` and `token` keys. This was likely from:
- Legacy code or previous implementation
- Manual testing/debugging
- Browser extension or dev tools manipulation

The fix ensures only `authToken` is used consistently across the app.

### Why Add Logging?
Authentication issues are hard to debug without visibility. The added logging helps identify:
- Whether token is being sent
- Whether token format is correct
- Whether token verification is failing
- Which endpoint is causing the issue

### Why Add Verify Endpoint?
The `/api/auth/verify` endpoint provides:
- Easy way to test if token is valid
- Quick debugging tool for developers
- User info confirmation without making business logic calls
- Consistent authentication testing across different user roles
