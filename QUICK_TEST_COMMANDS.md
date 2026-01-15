# Quick Test Commands - Token Fix

## 🚀 Quick Start

### 1. Clear Everything
```javascript
localStorage.clear();
location.reload();
```

### 2. After Login - Check Token Storage
```javascript
console.log('✅ authToken exists:', !!localStorage.getItem('authToken'));
console.log('❌ token exists:', !!localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

**Expected:**
- ✅ authToken exists: true
- ❌ token exists: false

### 3. Test Token is Being Sent
```javascript
// Watch console for this message when making requests:
// [API] Attaching token to request: /batches/available
```

### 4. Test Protected Endpoint
```javascript
fetch('http://localhost:3000/api/auth/verify', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
})
.then(r => r.json())
.then(console.log);
```

**Expected:**
```json
{
  "authenticated": true,
  "user": {
    "userId": 1,
    "username": "your_username",
    "role": "ADMIN"
  }
}
```

### 5. Decode Token
```javascript
const token = localStorage.getItem('authToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('User ID:', payload.userId);
  console.log('Username:', payload.username);
  console.log('Role:', payload.role);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

## 🔍 Debugging Commands

### Check All localStorage Keys
```javascript
Object.keys(localStorage).forEach(key => {
  console.log(key + ':', localStorage.getItem(key)?.substring(0, 50));
});
```

### Monitor API Requests
```javascript
// Open Network tab (F12)
// Filter by: XHR or Fetch
// Look for Authorization header in each request
```

### Test All Protected Endpoints
```javascript
const token = localStorage.getItem('authToken');
const headers = { 'Authorization': 'Bearer ' + token };

// Test verify
fetch('http://localhost:3000/api/auth/verify', { headers })
  .then(r => r.json())
  .then(d => console.log('✅ Verify:', d))
  .catch(e => console.error('❌ Verify failed:', e));

// Test batches
fetch('http://localhost:3000/api/batches/available', { headers })
  .then(r => r.json())
  .then(d => console.log('✅ Batches:', d.length, 'available'))
  .catch(e => console.error('❌ Batches failed:', e));
```

## ✅ Success Checklist

Run these checks after login:

```javascript
// 1. Only authToken exists
console.assert(localStorage.getItem('authToken'), '❌ authToken missing');
console.assert(!localStorage.getItem('token'), '❌ legacy token still exists');

// 2. User data exists
console.assert(localStorage.getItem('user'), '❌ user data missing');

// 3. Token is valid JWT
const token = localStorage.getItem('authToken');
console.assert(token?.startsWith('eyJ'), '❌ token format invalid');

// 4. Token has correct structure
console.assert(token?.split('.').length === 3, '❌ token structure invalid');

console.log('✅ All checks passed!');
```

## 🆘 If Still Failing

### Check 1: Token Exists
```javascript
if (!localStorage.getItem('authToken')) {
  console.error('❌ No token found - try logging in again');
}
```

### Check 2: Token Format
```javascript
const token = localStorage.getItem('authToken');
if (token && !token.startsWith('eyJ')) {
  console.error('❌ Invalid token format - should start with eyJ');
  localStorage.clear();
  location.reload();
}
```

### Check 3: Authorization Header
```javascript
// Make a request and check Network tab
// Should see: Authorization: Bearer eyJ...
// If missing, check console for: [API] No auth token found
```

### Check 4: Server Response
```javascript
// If getting 401, check server console for:
// [Auth] No authorization header provided
// [Auth] Token verification failed
```

## 🎯 Expected Console Logs

### On Page Load:
```
[Auth] Initializing auth state from localStorage
[Auth] Restored user from localStorage: username role: ADMIN
```

### On Login:
```
[Auth] Attempting login for: username
[Auth] Login successful, storing token for user: username role: ADMIN
[Auth] Token stored in authToken key
```

### On API Request:
```
[API] Attaching token to request: /batches/available
```

### On Logout:
```
[Auth] Logging out user
```

## 📋 Manual Test Steps

1. **Clear storage**: `localStorage.clear(); location.reload();`
2. **Login** as ADMIN or STAFF
3. **Check console** for: `[Auth] Token stored in authToken key`
4. **Navigate** to "สร้างใบสั่งขาย" (Create Sales Order)
5. **Check console** for: `[API] Attaching token to request: /batches/available`
6. **Verify** batches load in dropdown
7. **Fill form** and create sales order
8. **Check console** for: `[API] Attaching token to request: /sales-orders`
9. **Verify** order created successfully (201 Created)

## 🎉 Success!

If all checks pass:
- ✅ Only `authToken` in localStorage
- ✅ Token attached to all requests
- ✅ Can create sales orders
- ✅ No 401 errors

**The fix is working!** 🚀
