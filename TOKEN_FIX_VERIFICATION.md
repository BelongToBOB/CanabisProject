# Token Storage Fix - Verification Guide

## Problem Fixed
Both ADMIN and STAFF users were unable to create sales orders because:
- localStorage contained BOTH `authToken` and `token` keys
- Axios interceptor was reading from the wrong key
- Requests were sent WITHOUT `Authorization: Bearer <token>` header
- Backend returned 401 → app triggered logout flow

## Solution Implemented

### 1. Standardized Token Storage
- **ONE key only**: `authToken` (standardized across the app)
- Login stores token ONLY in `authToken` key
- Legacy `token` key is automatically cleaned up

### 2. Updated Axios Interceptor
- Always reads from `authToken` first
- Fallback to `token` for backward compatibility during migration
- Logs when token is attached to requests
- Logs warnings when token is missing

### 3. Fixed Response Interceptor
- On 401: Clears ALL auth storage (authToken, token, user)
- Does NOT call `/auth/logout` endpoint (no token available)
- Redirects to login page

### 4. Enhanced Logging
- All auth operations now log to console
- Easy to debug token flow
- Can verify token is being sent with requests

## Files Changed

### `client/src/services/api.ts`
**Request Interceptor:**
```typescript
const token = localStorage.getItem('authToken') || localStorage.getItem('token');
if (token && config.headers) {
  config.headers.Authorization = `Bearer ${token}`;
  console.log('[API] Attaching token to request:', config.url);
}
```

**Response Interceptor:**
```typescript
if (error.response?.status === 401) {
  // Clear all auth storage
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Redirect to login (no API call)
  window.location.href = '/login';
}
```

### `client/src/contexts/AuthContext.tsx`
**Login:**
```typescript
// Clean up legacy key
localStorage.removeItem('token');
// Store ONLY in authToken
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(userData));
```

**Logout:**
```typescript
// Clear all keys
localStorage.removeItem('authToken');
localStorage.removeItem('token');
localStorage.removeItem('user');
// No API call to /auth/logout
```

**Initialization:**
```typescript
// Migrate from legacy key if needed
const token = localStorage.getItem('authToken') || localStorage.getItem('token');
if (token && !localStorage.getItem('authToken')) {
  localStorage.setItem('authToken', token);
  localStorage.removeItem('token');
}
```

## Testing Instructions

### Step 1: Clear Everything
```javascript
// Open browser console (F12) and run:
localStorage.clear();
location.reload();
```

### Step 2: Login as ADMIN
1. Go to login page
2. Login with ADMIN credentials
3. **Check console logs** - should see:
   ```
   [Auth] Attempting login for: admin_username
   [Auth] Login successful, storing token for user: admin_username role: ADMIN
   [Auth] Token stored in authToken key
   ```

### Step 3: Verify Token Storage
```javascript
// In console, run:
console.log('authToken:', localStorage.getItem('authToken'));
console.log('token:', localStorage.getItem('token'));
console.log('user:', JSON.parse(localStorage.getItem('user')));
```

**Expected:**
- `authToken`: Long JWT string (starts with "eyJ...")
- `token`: null (should NOT exist)
- `user`: Object with id, username, role: "ADMIN"

### Step 4: Test Protected Endpoints

#### Test 1: Get Available Batches
1. Navigate to "สร้างใบสั่งขาย" (Create Sales Order)
2. **Check console logs** - should see:
   ```
   [API] Attaching token to request: /batches/available
   ```
3. **Check Network tab** (F12 → Network):
   - Request to `/api/batches/available`
   - Headers should include: `Authorization: Bearer eyJ...`
   - Status: 200 OK
4. **Verify**: Batch dropdown should populate with available batches

#### Test 2: Create Sales Order
1. Fill in sales order form:
   - Select a batch
   - Enter quantity
   - Enter selling price
2. Click "สร้างใบสั่งขาย" (Create Sales Order)
3. **Check console logs** - should see:
   ```
   [API] Attaching token to request: /sales-orders
   ```
4. **Check Network tab**:
   - Request to `/api/sales-orders`
   - Method: POST
   - Headers should include: `Authorization: Bearer eyJ...`
   - Status: 201 Created
5. **Verify**: Should redirect to sales order detail page

### Step 5: Test as STAFF User
1. Logout
2. Login with STAFF credentials
3. **Check console logs** - should see:
   ```
   [Auth] Attempting login for: staff_username
   [Auth] Login successful, storing token for user: staff_username role: STAFF
   [Auth] Token stored in authToken key
   ```
4. Repeat Test 1 and Test 2 above
5. **Verify**: STAFF can also create sales orders

### Step 6: Test Token Verification Endpoint
```javascript
// In console, run:
fetch('http://localhost:3000/api/auth/verify', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Token verification result:', data);
});
```

**Expected response:**
```json
{
  "authenticated": true,
  "user": {
    "userId": 1,
    "username": "your_username",
    "role": "ADMIN" // or "STAFF"
  }
}
```

## Success Checklist

After following the steps above, verify:

- [ ] Only `authToken` key exists in localStorage (no `token` key)
- [ ] Console shows `[API] Attaching token to request` for protected endpoints
- [ ] Network tab shows `Authorization: Bearer ...` header in requests
- [ ] GET `/api/batches/available` returns 200 OK
- [ ] POST `/api/sales-orders` returns 201 Created
- [ ] Both ADMIN and STAFF can create sales orders
- [ ] No unexpected 401 errors
- [ ] No automatic logout when accessing protected endpoints

## Troubleshooting

### Issue: Still getting 401 errors

**Check 1: Token in localStorage**
```javascript
const token = localStorage.getItem('authToken');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
console.log('Token starts with eyJ:', token?.startsWith('eyJ'));
```

**Check 2: Token in Request Headers**
1. Open Network tab (F12)
2. Make a request (e.g., load batches)
3. Click on the request
4. Go to Headers tab
5. Look for `Authorization: Bearer eyJ...`

**If missing:**
- Check console for `[API] No auth token found` warning
- Verify `authToken` exists in localStorage
- Try logout and login again

**Check 3: Server Logs**
Look for `[Auth]` messages in server console:
- `[Auth] No authorization header provided` → Token not being sent
- `[Auth] Token verification failed` → Token is invalid

### Issue: Token exists but still 401

**Possible causes:**
1. **JWT_SECRET mismatch**: Server and token were generated with different secrets
2. **Token expired**: Default is 24 hours
3. **Token corrupted**: Try logout and login again

**Solution:**
```bash
# Restart server to reload .env
cd server
npm run dev
```

Then logout and login again to get fresh token.

### Issue: Legacy `token` key keeps appearing

**Check for other code:**
```bash
# Search for any code setting 'token' key
grep -r "localStorage.setItem('token'" client/src/
```

If found, update to use `authToken` instead.

## Console Log Reference

### Normal Flow (Success)
```
[Auth] Initializing auth state from localStorage
[Auth] Restored user from localStorage: username role: ADMIN
[API] Attaching token to request: /batches/available
[API] Attaching token to request: /sales-orders
```

### Login Flow
```
[Auth] Attempting login for: username
[Auth] Login successful, storing token for user: username role: ADMIN
[Auth] Token stored in authToken key
```

### Logout Flow
```
[Auth] Logging out user
```

### Error Flow (401)
```
[API] 401 Unauthorized - clearing auth state
[API] Redirecting to login page
```

### Warning (Missing Token)
```
[API] No auth token found for request: /batches/available
```

## Quick Commands

### Check localStorage
```javascript
Object.keys(localStorage).forEach(key => {
  console.log(key + ':', localStorage.getItem(key));
});
```

### Clear and Reload
```javascript
localStorage.clear();
location.reload();
```

### Decode Token
```javascript
const token = localStorage.getItem('authToken');
if (token) {
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  console.log('Token payload:', payload);
  console.log('User ID:', payload.userId);
  console.log('Username:', payload.username);
  console.log('Role:', payload.role);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

### Test All Protected Endpoints
```javascript
const token = localStorage.getItem('authToken');
const headers = { 'Authorization': 'Bearer ' + token };

// Test verify
fetch('http://localhost:3000/api/auth/verify', { headers })
  .then(r => r.json())
  .then(d => console.log('Verify:', d));

// Test batches
fetch('http://localhost:3000/api/batches/available', { headers })
  .then(r => r.json())
  .then(d => console.log('Batches:', d.length, 'available'));
```

## Expected Behavior After Fix

### For ALL Users (ADMIN and STAFF):
✅ Can login successfully
✅ Token stored ONLY in `authToken` key
✅ Token automatically attached to all API requests
✅ Can view available batches
✅ Can create sales orders
✅ No unexpected 401 errors
✅ No automatic logout when accessing protected endpoints

### For ADMIN Only:
✅ All above +
✅ Can access admin-only endpoints (batch management, reports, etc.)

### For STAFF Only:
✅ All above
❌ Cannot access admin-only endpoints (will get 403 Forbidden, not 401)

## Next Steps

1. **Restart client** (if running):
   ```bash
   cd client
   npm run dev
   ```

2. **Follow testing instructions** above

3. **Verify success checklist** is complete

4. **If issues persist**, check troubleshooting section

## Summary

The fix ensures:
- **Consistent token storage**: Only `authToken` key is used
- **Reliable token transmission**: Token is always attached to requests
- **Proper error handling**: 401 errors clear storage and redirect (no API call)
- **Backward compatibility**: Migrates from legacy `token` key automatically
- **Enhanced debugging**: Console logs show token flow

Both ADMIN and STAFF users should now be able to create sales orders successfully! 🎉
