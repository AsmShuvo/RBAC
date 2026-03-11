# RBAC Platform - Setup Guide

## Prerequisites
- Node.js 18+ and npm installed
- PostgreSQL database (Neon provided)
- At least 2GB free disk space

## Quick Start

### 1. Free Up Disk Space
Your system needs at least 2GB free space for npm packages and database.

### 2. Backend Setup

```bash
cd backend

# Install dependencies (already done)
npm install

# Generate Prisma client
npx prisma generate

# Create and apply database migrations
npx prisma migrate dev --name init

# Seed database with demo data
npm run seed
```

**Demo Credentials:**
- Admin: `admin@rbac.local` / `admin123`
- Manager: `manager@rbac.local` / `manager123`
- Agent: `agent@rbac.local` / `agent123`

### 3. Start Backend Server

```bash
cd backend
npm run dev
```

Server runs at: http://localhost:5000

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies (already done)
npm install

# Start dev server
npm run dev
```

App runs at: http://localhost:3000

## Database Setup Details

The database uses Neon PostgreSQL with the connection string:
```
postgresql://neondb_owner:npg_etgu8xMr0BRo@ep-restless-cherry-a4zcxlgr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Schema Overview

The database has been initialized with:

**Tables:**
- `User` - User accounts with roles and manager relationships
- `Role` - Admin (level 3), Manager (level 2), Agent (level 1), Customer (level 0)
- `Permission` - Atomic access units (30+ permissions)
- `RolePermission` - Default permissions by role
- `UserPermission` - User-level permission overrides
- `AuditLog` - Append-only action log
- `RefreshToken` - Session management
- `ApiKey` - Future API integrations

### Seed Data

Running `npm run seed` creates:
- 4 roles with hierarchy
- 30+ permissions across categories (dashboard, users, leads, tasks, reports, etc.)
- 3 demo user accounts for testing
- Proper role-permission assignments

## Environment Configuration

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout (requires auth)

### Users (Protected)
- `GET /api/users` - List users (requires permission)
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PATCH /api/users/:id` - Update user
- `POST /api/users/:id/suspend` - Suspend user
- `POST /api/users/:id/ban` - Ban user

### Permissions (Protected)
- `GET /api/permissions` - List permissions
- `GET /api/users/:id/permissions` - User's permissions
- `POST /api/users/:id/permissions/:permId` - Grant permission
- `DELETE /api/users/:id/permissions/:permId` - Revoke permission

### Audit
- `GET /api/audit` - Get audit logs

## Development Commands

### Backend
```bash
npm run dev              # Start with auto-reload
npm run build           # Build for production
npm start               # Run production build
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open Prisma Studio
npm run seed            # Seed demo data
npm run lint            # Run linter
```

### Frontend
```bash
npm run dev    # Start dev server
npm run build  # Build for production
npm run start  # Run production build
npm run lint   # Run linter
```

## Testing Auth Flow

### 1. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rbac.local","password":"admin123"}' \
  -c cookies.txt
```

### 2. Use Access Token
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Refresh Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -b cookies.txt
```

## Project Structure

```
rbac/
├── README.md
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express server
│   │   ├── config.ts          # Config
│   │   ├── db.ts              # Prisma setup
│   │   ├── middleware/        # Auth, permission middleware
│   │   │   └── auth.ts
│   │   ├── controllers/       # Business logic
│   │   │   └── auth.ts        # Auth controller
│   │   ├── routes/            # Routes
│   │   │   └── auth.ts        # Auth routes
│   │   └── utils/             # Utilities
│   │       ├── jwt.ts         # JWT functions
│   │       └── crypto.ts      # Password hashing
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema
│   │   └── seed.ts            # Seed script
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── app/
    │   ├── layout.tsx         # Root layout
    │   ├── page.tsx           # Home page
    │   ├── login/             # Login page
    │   ├── register/          # Register page
    │   └── dashboard/         # Dashboard
    ├── package.json
    ├── tsconfig.json
    └── tailwind.config.js
```

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` is correct in `.env`
- Verify PostgreSQL is accessible
- Run `npx prisma db push` to sync schema

### Auth Errors
- Clear localStorage: `localStorage.clear()`
- Refresh tokens stored in httpOnly cookies
- Check JWT_SECRET matches between requests

### CORS Issues
- Verify `FRONTEND_URL` in backend `.env`
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Enable credentials in fetch requests

### Port Already in Use
- Backend (5000): `netstat -ano | findstr :5000` (Windows)
- Frontend (3000): `netstat -ano | findstr :3000` (Windows)

## Next Steps

1. ✅ Project structure created
2. ✅ Dependencies installed
3. ⏳ **Free disk space (2GB+)**
4. ⏳ Run `npm run seed` to populate demo data
5. ⏳ Start backend: `npm run dev`
6. ⏳ Start frontend: `npm run dev`
7. ⏳ Implement remaining User/Permission controllers
8. ⏳ Build permission UI components
9. ⏳ Implement audit log viewer

## Architecture Notes

### Permission System
- **Atoms**: Each permission is atomic (e.g., `view_users`, `create_lead`)
- **Grant Ceiling**: A user cannot grant permissions they don't hold
- **Role Hierarchy**: Levels 3→0 (Admin→Customer) enforce grant ceilings
- **Override**: Individual user permissions override role defaults
- **Dynamic**: Permissions resolved at login, included in JWT

### Session Management
- **Access Token**: 15 minutes, in-memory only, in Authorization header
- **Refresh Token**: 7 days, httpOnly cookie secure storage
- **Blacklist**: Revoked refresh tokens marked in DB, can't refresh
- **Logout**: Revokes all refresh tokens for user

### Audit Trail
- **Append-Only**: Events never deleted, immutable
- **Granular**: Every user/permission change logged
- **Traceable**: Actor, action, resource, timestamp, changes captured

---

**Stuck?** Check the README.md in the project root or the component files in frontend/app for examples.
