# Quick Fix Reference - STAFF Authentication Issue

## 🚀 Quick Start (Do This First!)

### 1. Restart Server
```bash
cd server
npm run dev
```

### 2. Clear Browser & Test
1. Open app in browser (http://localhost:5173)
2. Press F12 → Application → Clear Storage → Clear site data
3. Login as STAFF user
4. Open Console (F12) and run:
```javascript
fetch('http://localhost:3000/api/auth/verify', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
}).then(r => r.json()).then(console.log)
```

### 3. Expected Result
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

✅ **If you see this** → Authentication is working! Try creating a sales order.

❌ **If you get 401 error** → See troubleshooting below.

---

## 🔍 Quick Troubleshooting

### Problem: Still Getting 401 Errors

#### Check 1: localStorage Keys
Open Console (F12) and run:
```javascript
console.log('authToken:', localStorage.getItem('authToken'));
console.log('token:', localStorage.getItem('token'));
console.log('user:', localStorage.getItem('user'));
```

**Expected:**
- `authToken`: Long JWT string (starts with "eyJ...")
- `token`: null (should not exist)
- `user`: JSON string with user info

**If `token` key exists:** Logout and login again (it will be cleaned up automatically)

#### Check 2: Authorization Header
1. Open Network tab (F12)
2. Try to load batches or create sales order
3. Click on the request
4. Check Headers tab
5. Look for: `Authorization: Bearer eyJ...`

**If missing:** Token is not being sent. Try:
- Logout and login again
- Clear browser cache
- Check if `authToken` exists in localStorage

#### Check 3: Server Logs
Look at server console for messages like:
- `[Auth] No authorization header provided` → Token not being sent
- `[Auth] Invalid authorization header format` → Token format issue
- `[Auth] Token verification failed` → Token is invalid

**If you see these:** Check JWT_SECRET in `server/.env` and restart server

---

## 📋 What Was Fixed

### Frontend
- ✅ Cleanup legacy `token` localStorage key
- ✅ Added warning logs for missing tokens
- ✅ Consistent use of `authToken` key

### Backend
- ✅ Added detailed authentication logging
- ✅ New `/api/auth/verify` endpoint for testing
- ✅ Better error messages

---

## 🎯 STAFF User Permissions

### ✅ Can Access:
- Create sales orders
- View available batches
- Verify token

### ❌ Cannot Access (ADMIN only):
- View all batches
- Create/edit/delete batches
- View all sales orders
- Delete sales orders
- User management
- Reports
- Profit sharing

---

## 🆘 Still Not Working?

### Try This:
1. **Logout completely**
2. **Close browser**
3. **Restart server**
4. **Open browser in incognito/private mode**
5. **Login as STAFF**
6. **Test again**

### Check These:
- [ ] Server is running on port 3000
- [ ] Client is running on port 5173
- [ ] No CORS errors in console
- [ ] JWT_SECRET is set in `server/.env`
- [ ] Database is running and accessible

### Get More Help:
See `AUTHENTICATION_DEBUG_GUIDE.md` for detailed troubleshooting steps.

---

## 📝 Quick Commands

### Test Token Validity
```javascript
fetch('http://localhost:3000/api/auth/verify', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
}).then(r => r.json()).then(console.log)
```

### Check localStorage
```javascript
console.log('Keys:', Object.keys(localStorage));
console.log('authToken:', localStorage.getItem('authToken'));
```

### Clear localStorage
```javascript
localStorage.clear();
```

### Decode JWT Token (in browser)
```javascript
const token = localStorage.getItem('authToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

---

## ✨ Success Indicators

You'll know it's working when:
- ✅ No console warnings about missing tokens
- ✅ `/api/auth/verify` returns 200 OK
- ✅ Batches load in sales order creation page
- ✅ Can create sales orders successfully
- ✅ No [Auth] errors in server logs
- ✅ Only `authToken` and `user` keys in localStorage

---

**Need more details?** Check:
- `STAFF_AUTH_FIX_SUMMARY.md` - Complete fix documentation
- `AUTHENTICATION_DEBUG_GUIDE.md` - Detailed troubleshooting guide
