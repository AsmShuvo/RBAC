# RBAC Platform - Quick Start Checklist

## ✅ Pre-Flight Checks

### 1. Server Status
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] No error messages in either terminal

### 2. Database Status
- [ ] PostgreSQL connection successful
- [ ] Database schema migrated
- [ ] Seed data loaded (3 demo users visible)

### 3. Environment Variables
- [ ] Backend `.env` has DATABASE_URL
- [ ] Backend `.env` has JWT secrets
- [ ] Frontend `.env.local` has API URL

---

## 🚀 Step-by-Step Startup

### Step 1: Verify Backend
```bash
cd d:\Downloads\rbac\backend

# Check if server is running
netstat -ano | findstr :5000

# If not running, start it:
npx tsx watch src/index.ts
```

**Expected Output:**
```
Database connected
Server running on port 5000
```

### Step 2: Verify Frontend
```bash
cd d:\Downloads\rbac\frontend

# Check if server is running
netstat -ano | findstr :3000

# If not running, start it:
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.0.0
  Local:        http://localhost:3000
```

### Step 3: Test Connectivity
Open browser and visit: http://localhost:3000

**Expected Result:**
- Home page loads
- "Login" button visible
- No network errors in console

---

## 🔐 Testing Authentication

### Step 1: Go to Login Page
```
http://localhost:3000/login
```

### Step 2: Admin Login Test
```
Email:    admin@rbac.local
Password: admin123
Click:    Sign In
```

**Expected Result:**
- Redirected to dashboard
- Sidebar shows all menu items
- "Welcome, Admin User" visible
- No 401/403 errors

### Step 3: Check Sidebar Items (Admin)
- [ ] Dashboard
- [ ] Users
- [ ] Permissions
- [ ] Leads
- [ ] Tasks
- [ ] Reports
- [ ] Audit Log
- [ ] Settings
- [ ] Customer Portal

---

## 📊 Testing Features

### Dashboard Page
```
http://localhost:3000/dashboard
```
- [ ] Stats cards load (Users, Permissions, Active Users, Events)
- [ ] Recent activity table visible
- [ ] No console errors
- [ ] Responsive on mobile

### Users Page
```
http://localhost:3000/users
```
- [ ] List of users displayed
- [ ] "Create User" button visible
- [ ] Suspend/Ban buttons present
- [ ] Paginations works (if 10+ users)

### Permissions Page
```
http://localhost:3000/permissions
```
- [ ] User list on left
- [ ] Permission grid on right
- [ ] Checkboxes toggleable
- [ ] Grant/Revoke requests work

### Audit Log Page
```
http://localhost:3000/audit
```
- [ ] Audit events display
- [ ] Filters work (action, resource type)
- [ ] Pagination functional
- [ ] Timestamps correct

### Settings Page
```
http://localhost:3000/settings
```
- [ ] Form fields visible
- [ ] Settings can be updated
- [ ] Success message appears
- [ ] No errors on save

---

## 🧪 Testing Permissions

### Test 1: Permission Inheritance
**Login as Manager (manager@rbac.local/manager123)**
- [ ] Sidebar shows: Dashboard, Users, Leads, Tasks, Reports
- [ ] Sidebar hides: Permissions, Audit, Settings, Customer Portal
- [ ] Trying to visit /permissions shows 403
- [ ] Trying to visit /audit shows 403

### Test 2: Permission Granting
**Login as Admin**
1. Go to Permissions page
2. Select Manager user
3. Grant "view_audit_log" permission
4. Logout

**Login as Manager (refresh page)**
- [ ] "Audit Log" now visible in sidebar
- [ ] Can access /audit page
- [ ] Can see audit logs

### Test 3: Grant Ceiling
**Login as Agent (agent@rbac.local/agent123)**
1. Go to Permissions page
2. Try to grant "view_users" to another user
- [ ] Action fails with "Cannot grant permissions above your level"

---

## 🔄 Testing API Endpoints

### Test Login API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rbac.local","password":"admin123"}' \
  -c cookies.txt
```
- [ ] Returns 200 status
- [ ] Contains accessToken
- [ ] Contains user data
- [ ] Refresh token in cookie

### Test Protected Endpoint
```bash
# Set TOKEN to accessToken from login above
SET TOKEN=<your-token>

curl http://localhost:5000/api/users \
  -H "Authorization: Bearer %TOKEN%"
```
- [ ] Returns 200 status
- [ ] Returns user list
- [ ] No 401 error

### Test Invalid Token
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer invalid-token"
```
- [ ] Returns 401 Unauthorized

### Test Audit Logs API
```bash
curl "http://localhost:5000/api/audit" \
  -H "Authorization: Bearer %TOKEN%"
```
- [ ] Returns 200 status
- [ ] Returns audit logs array
- [ ] Logs have timestamps and actors

---

## 🐛 Debugging Checklist

### All Demo Users Missing?
```bash
cd backend
npm run seed
# Should output: ✅ Database seeded successfully!
```

### Login Shows 401 Error
```bash
# Check if backend is running
curl http://localhost:5000/api/auth/login
# Should return error about missing email/password, not connection error

# Check database connection
cd backend && npm run prisma:studio
```

### Sidebar Items Not Showing
```bash
# Check browser console for errors
# Developer Tools → Console → Look for red errors

# Check localStorage:
# In console, run: console.table(Object.entries(localStorage))
```

### API Calls Fail with 401
```bash
# Token expired, need new token
# Click logout and login again

# Or refresh token manually
curl -X POST http://localhost:5000/api/auth/refresh \
  -b cookies.txt
```

### Permission Changes Don't Take Effect
```bash
# Token caches permissions, need new token
# Click logout and login again to get fresh token
```

### Database Connection Error
```bash
# Check DATABASE_URL in backend/.env
# Verify Neon credentials are correct
# Test connection:
cd backend && npx prisma db push

# If still failing:
# 1. Check internet connection
# 2. Verify .env file exists
# 3. Copy .env from README
```

---

## 📱 Mobile Testing

### Test Responsive Design
1. Go to http://localhost:3000/dashboard
2. Open DevTools (F12)
3. Click device toggle (mobile icon)
4. Select:
   - [ ] iPhone SE (small)
   - [ ] iPad (medium)
   - [ ] Desktop (large)

**Expected Results:**
- [ ] Sidebar collapses on mobile
- [ ] Hamburger menu appears
- [ ] All content readable
- [ ] No horizontal scroll

---

## 🔐 Security Testing

### Test CORS
**Open console and run:**
```javascript
// Should work (same origin)
fetch('http://localhost:5000/api/users', {
  headers: { 'Authorization': 'Bearer ' + localStorage.accessToken }
}).then(r => r.json()).then(console.log)
```
- [ ] Request succeeds

### Test JWT Expiration
1. Login and get token
2. Wait 15 minutes
3. Try API call
- [ ] Should return 401
- [ ] Front-end should redirect to login

### Test HTTP-Only Cookies
**Open DevTools → Application → Cookies**
- [ ] `refreshToken` cookie visible
- [ ] `refreshToken` has "HttpOnly" flag
- [ ] `refreshToken` has "Secure" flag (if HTTPS)

---

## 🎯 Full End-to-End Flow Testing

### Complete User Journey Test
1. **Home Page**
   - [ ] Visit http://localhost:3000
   - [ ] See welcome message
   - [ ] Login button visible

2. **Register New User**
   - [ ] Click "Create Account"
   - [ ] Fill form with new email
   - [ ] Set password
   - [ ] Submit

3. **Login**
   - [ ] Use new account
   - [ ] Redirected to dashboard
   - [ ] Can see dashboard content

4. **Create User (as Admin)**
   - [ ] Login as admin@rbac.local
   - [ ] Go to Users page
   - [ ] Click "Create User"
   - [ ] Fill form with new user details
   - [ ] Submit
   - [ ] New user appears in list

5. **Grant Permission (as Admin)**
   - [ ] Go to Permissions page
   - [ ] Select newly created user
   - [ ] Grant permissions
   - [ ] See audit log entry

6. **View Audit Log**
   - [ ] Click Audit Log
   - [ ] See all actions performed
   - [ ] Filter by action type
   - [ ] Click on entry to see details

7. **Logout**
   - [ ] Session ends
   - [ ] Redirected to home page
   - [ ] Cannot access dashboard without login

---

## ✨ Performance Testing

### Page Load Times
- [ ] Dashboard: < 1 second
- [ ] Users: < 1 second
- [ ] Permissions: < 1 second
- [ ] Audit: < 2 seconds (depends on data)

### Network Requests
**Open DevTools → Network tab**
- [ ] No failed requests (all green)
- [ ] No 4xx/5xx errors
- [ ] All requests have Authorization header
- [ ] Response times < 500ms

### Database Queries
**Open Prisma Studio:**
```bash
cd backend && npm run prisma:studio
```
- [ ] Can browse all tables
- [ ] Seed data visible
- [ ] Can add/edit/delete records

---

## 📋 Final Sign-Off

### All Tests Passed?
- [ ] Backend running
- [ ] Frontend running
- [ ] Database connected
- [ ] Login works
- [ ] Dashboard displays
- [ ] Permissions functional
- [ ] Audit logs showing
- [ ] API responding
- [ ] No console errors
- [ ] Mobile responsive

## ✅ System Ready for Production Testing!

---

**Troubleshooting Help:**
- Backend logs: Check terminal running `npm run dev`
- Frontend logs: Check DevTools Console (F12)
- Database: `cd backend && npm run prisma:studio`
- API: Use cURL or Postman (see API_REFERENCE.md)

**Demo Credentials:**
```
Admin:    admin@rbac.local / admin123
Manager:  manager@rbac.local / manager123
Agent:    agent@rbac.local / agent123
```

**Last Updated**: 2026-03-11
