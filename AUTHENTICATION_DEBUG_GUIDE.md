# Authentication Debugging Guide for STAFF Users

## Issue Summary
STAFF users are experiencing 401 Unauthorized errors when making API calls, even though they have a valid JWT token stored in localStorage.

## Changes Made

### 1. Frontend Changes

#### `client/src/contexts/AuthContext.tsx`
- Added cleanup of legacy `token` localStorage key (we only use `authToken`)
- Cleanup happens on:
  - App initialization
  - Login
  - Logout
- Added console warning when legacy key is detected

#### `client/src/services/api.ts`
- Added warning log when auth token is missing for protected endpoints
- Helps identify if token is not being sent with requests

### 2. Backend Changes

#### `server/src/middleware/auth.middleware.ts`
- Added detailed logging for authentication failures:
  - Logs when no authorization header is provided
  - Logs when authorization header format is invalid
  - Logs when token verification fails
- Logs include request method and path for easier debugging

## How to Test the Fix

### Step 0: Test Token Verification (New!)
1. Login as STAFF user
2. Open browser DevTools Console
3. Run this command:
```javascript
fetch('http://localhost:3000/api/auth/verify', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
}).then(r => r.json()).then(console.log)
```
4. Expected response:
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
5. If you get 401 error, the token is invalid or not being sent correctly

### Step 1: Clear Browser Storage
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear all localStorage items
4. Refresh the page

### Step 2: Login as STAFF User
1. Login with STAFF credentials
2. Check browser console for any warnings about legacy keys
3. Verify only `authToken` and `user` keys exist in localStorage (not `token`)

### Step 3: Test Protected Endpoints
1. Navigate to "สร้างใบสั่งขาย" (Create Sales Order) page
2. Open browser DevTools Network tab
3. Check the request to `/api/batches/available`:
   - Should have `Authorization: Bearer <token>` header
   - Should return 200 OK with batch data
4. Try creating a sales order
5. Check the request to `/api/sales-orders`:
   - Should have `Authorization: Bearer <token>` header
   - Should return 201 Created

### Step 4: Check Server Logs
If 401 errors persist, check the server console for authentication logs:
- `[Auth] No authorization header provided` - Token not being sent
- `[Auth] Invalid authorization header format` - Token format issue
- `[Auth] Token verification failed` - Token is invalid or expired

## Common Issues and Solutions

### Issue 1: Token Not Being Sent
**Symptom**: Server logs show "No authorization header provided"
**Solution**: 
- Verify `authToken` exists in localStorage
- Check if axios interceptor is working (should see Authorization header in Network tab)
- Try logging out and logging back in

### Issue 2: Invalid Token Format
**Symptom**: Server logs show "Invalid authorization header format"
**Solution**:
- Token should be sent as `Bearer <token>`
- Check if token value is corrupted in localStorage
- Try logging out and logging back in

### Issue 3: Token Verification Failed
**Symptom**: Server logs show "Token verification failed" with error message
**Possible causes**:
- Token expired (default: 24 hours)
- JWT_SECRET mismatch between token generation and verification
- Token was generated with different secret key

**Solution**:
- Check server `.env` file for `JWT_SECRET` value
- Verify `JWT_EXPIRES_IN` setting (default: 24h)
- Try logging out and logging back in to get fresh token
- If issue persists, restart the server to ensure `.env` changes are loaded

### Issue 4: CORS Issues
**Symptom**: Network tab shows CORS errors
**Solution**:
- Verify `CORS_ORIGIN` in server `.env` matches client URL
- Default: `http://localhost:5173`
- Restart server after changing `.env`

## Verification Checklist

- [ ] Only `authToken` and `user` keys in localStorage (no `token` key)
- [ ] Authorization header present in API requests (check Network tab)
- [ ] Authorization header format: `Bearer <long-jwt-string>`
- [ ] Server logs show successful authentication (no [Auth] errors)
- [ ] STAFF user can access `/api/batches/available` (200 OK)
- [ ] STAFF user can create sales orders (201 Created)

## API Endpoint Permissions

### Endpoints STAFF Can Access:
- `GET /api/batches/available` - Get available batches for sales orders
- `POST /api/sales-orders` - Create new sales orders

### Endpoints Only ADMIN Can Access:
- `GET /api/batches` - Get all batches
- `GET /api/batches/:id` - Get batch by ID
- `POST /api/batches` - Create batch
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch
- `GET /api/sales-orders` - Get all sales orders
- `GET /api/sales-orders/:id` - Get sales order by ID
- `DELETE /api/sales-orders/:id` - Delete sales order
- All user management endpoints
- All report endpoints
- All profit share endpoints

## Next Steps if Issue Persists

1. **Check JWT Token Content**:
   - Copy token from localStorage
   - Decode at https://jwt.io
   - Verify payload contains: `userId`, `username`, `role: "STAFF"`
   - Check `exp` (expiration) timestamp

2. **Verify Server Environment**:
   - Restart server: `cd server && npm run dev`
   - Check server console for startup errors
   - Verify database connection

3. **Test with ADMIN User**:
   - Login as ADMIN
   - Try same operations
   - If ADMIN works but STAFF doesn't, there may be a role-specific issue

4. **Check Network Timing**:
   - Token might be set after API call is made
   - Try adding a small delay or refreshing page after login

## Contact Information
If the issue persists after following this guide, please provide:
1. Browser console logs (including any warnings/errors)
2. Server console logs (especially [Auth] messages)
3. Network tab screenshot showing failed request headers
4. Decoded JWT token payload (from jwt.io)
