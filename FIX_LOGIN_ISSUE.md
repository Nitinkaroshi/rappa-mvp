# Fix: 401 Unauthorized Errors

**Issue**: You're seeing 401 (Unauthorized) errors because you're not logged into the application.

---

## Quick Fix (2 Steps)

### Step 1: Open the Application

Go to: **http://localhost:5173**

### Step 2: Login or Sign Up

#### If you have an existing account:
1. Enter your **email** and **password**
2. Click **Login**

#### If you don't have an account:
1. Click **"Sign Up"** or **"Create Account"** link
2. Enter:
   - **Email**: your email (e.g., test@example.com)
   - **Password**: minimum 8 characters
3. Click **Create Account**
4. You'll be logged in automatically

---

## What Happened?

The errors you're seeing:
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

This means:
- ❌ The frontend is trying to access protected API endpoints
- ❌ But there's no authentication token (you're not logged in)
- ✅ Backend is working fine
- ✅ Frontend is working fine
- ⚠️ You just need to login!

---

## Test Login via Command Line (Optional)

If you want to test the login system:

### Create a test user:
```bash
curl -X POST http://localhost:8001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Login:
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

You should get a response with an `access_token`.

---

## After Login

Once you're logged in, all those 401 errors will disappear and you'll be able to:

✅ View Dashboard
✅ Upload Documents
✅ View Job Results
✅ Edit Fields
✅ Export Data
✅ Create Batches
✅ Manage Templates

---

## Quick Demo Test Account

For demo purposes, you can create a test account:

**Email**: demo@rappa.ai
**Password**: Demo@123456

Or use any email/password you prefer!

---

## Why This Happens

When you:
1. Refresh the page
2. Clear browser cache
3. Close and reopen the browser
4. Session expires

The authentication token is lost and you need to login again.

---

## Next Steps

1. **Login** at http://localhost:5173
2. **Upload a document** to test the system
3. **All features** will work correctly once authenticated

That's it! 🚀
