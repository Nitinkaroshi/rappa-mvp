# Fix: 401 Errors After Successful Login

**Issue**: Getting 401 (Unauthorized) errors even after successfully logging in

---

## Quick Fix - Try These Steps

### Step 1: Clear Browser Cookies & Cache
1. Press `Ctrl + Shift + Delete` (or `Cmd + Shift + Delete` on Mac)
2. Select:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
3. Time range: **All time**
4. Click **Clear data**

### Step 2: Restart Browser
1. Close **ALL** browser windows
2. Reopen browser
3. Go to http://localhost:5173/login

### Step 3: Login Again
1. Email: `demo@rappa.ai`
2. Password: `Demo123456`
3. Click Login

### Step 4: Check Cookies in DevTools
After login, press `F12` and check:

1. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Click **Cookies** → **http://localhost:5173**
3. Look for a cookie named `access_token` or similar
4. If you see it, the login worked!

---

## Alternative Fix: Hard Refresh After Login

If clearing cookies doesn't work:

1. Login at http://localhost:5173/login
2. After successful login, press `Ctrl + Shift + R` (hard refresh)
3. This forces the browser to reload with the new cookies

---

## Check Backend Logs

Let's verify the backend is setting cookies properly:

### Check if login endpoint is returning cookies:

```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@rappa.ai","password":"Demo123456"}' \
  -v
```

Look for `Set-Cookie` in the response headers. You should see something like:
```
< Set-Cookie: access_token=...; Path=/; HttpOnly; SameSite=lax
```

---

## Root Cause Analysis

### Why This Happens:

1. **Cookie Not Being Set**: Backend might not be setting the cookie
2. **Cookie Not Being Sent**: Browser might not be sending the cookie with requests
3. **CORS Issue**: Cookie domain/path mismatch
4. **SameSite Policy**: Browser blocking third-party cookies

### Current Configuration:

✅ **CORS**: Configured with `allow_credentials=True`
✅ **Allowed Origins**: `http://localhost:5173` is in the list
✅ **withCredentials**: Frontend is set to `true`

---

## Debugging Steps

### 1. Check Network Tab

Press `F12` → **Network** tab:

1. Login
2. Click on the login request
3. Go to **Response Headers**
4. Look for `Set-Cookie` header

If you see `Set-Cookie`, the backend is working correctly.

### 2. Check Request Headers for Custom Templates

1. Navigate to Custom Templates page
2. In **Network** tab, click on the `/custom-templates/` request
3. Go to **Request Headers**
4. Look for `Cookie` header

If `Cookie` is missing, the browser isn't sending it!

---

## Permanent Fix Options

### Option 1: Switch to Token-Based Auth (Recommended)

If cookies continue to be problematic, we can switch to storing the token in localStorage:

**Backend Change**: Return token in response
**Frontend Change**: Store token and add to Authorization header

### Option 2: Adjust Cookie Settings

Update backend auth endpoint to use different cookie settings:

```python
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=False,  # Set to True in production with HTTPS
    samesite="lax",  # Changed from "strict"
    max_age=86400,  # 24 hours
    path="/",
    domain="localhost"  # Explicitly set domain
)
```

---

## Immediate Workaround

If nothing else works, try this temporary fix:

### Restart Both Servers:

```bash
# Kill backend
taskkill /F /PID <backend_process_id>

# Kill frontend
taskkill /F /PID <frontend_process_id>

# Restart backend
cd E:\rappa-mvp\rappa-ai-mvp\backend
python -m uvicorn app.main:app --reload --port 8001

# Restart frontend (in new terminal)
cd E:\rappa-mvp\rappa-ai-mvp\frontend
npm run dev
```

Then:
1. Clear browser cache
2. Login again
3. Should work!

---

## Status Check Commands

### Check if you're logged in:

```bash
# This should return 200 if logged in, 401 if not
curl http://localhost:8001/api/v1/auth/me \
  -H "Cookie: access_token=YOUR_TOKEN_HERE" \
  -v
```

---

## Need Help?

If none of these work, let me know and I can:
1. Switch the entire auth system to token-based (localStorage)
2. Debug the specific cookie settings
3. Check for any middleware issues

The app should work - this is just a cookie configuration issue!
