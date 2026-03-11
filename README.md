# Multi-Role RBAC Web Platform

A dynamic permission-driven web platform where access is granted atom-by-atom, enabling Admins and Managers to customize user capabilities in real-time without code changes.

## 🎯 Project Overview

Instead of hard-coding role access, this system provides:
- **Dynamic Permission Routing**: Every page requires a permission atom; users see only what they're allowed
- **Granular Access Control**: Admins and Managers configure permissions via UI
- **Full Audit Trail**: Every action is logged with actor, timestamp, and changes
- **Role Hierarchy**: Grant ceiling enforcement – you can't grant more than you have
- **No Code Changes**: Restructure access entirely through the UI

### User Roles

| Role | Capabilities |
|------|---|
| **Admin** | Complete system control – manage all users, assign managers, configure permissions |
| **Manager** | Create/manage team (agents + customers), control feature access, suspend/ban users |
| **Agent** | Work within assigned modules and features |
| **Customer** | Self-service portal with restricted access |

## 📁 Project Structure

```
rbac/
├── backend/              # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts      # Server entry point
│   │   ├── config.ts     # Configuration
│   │   ├── db.ts         # Prisma connection
│   │   ├── middleware/   # Auth, permission middleware
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API routes
│   │   └── utils/        # JWT, crypto utilities
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/             # Next.js + TypeScript UI
    ├── app/
    │   ├── layout.tsx    # Root layout
    │   ├── page.tsx      # Home page
    │   ├── login/        # Authentication pages
    │   ├── register/
    │   └── dashboard/    # Main app
    ├── package.json
    ├── tsconfig.json
    └── tailwind.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database

### 1. Backend Setup

```bash
cd backend

# Copy .env
cp .env.example .env

# Update DATABASE_URL in .env with your Neon PostgreSQL connection

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Copy .env
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📊 Database Schema

### Core Tables

- **User**: User accounts with role and hierarchical relationships
- **Role**: System roles (Admin, Manager, Agent, Customer) with hierarchy levels
- **Permission**: Fine-grained access atoms (page access, actions, modules)
- **RolePermission**: Default permissions for each role
- **UserPermission**: User-level permission overrides (grant/deny)
- **AuditLog**: Append-only record of all admin/manager actions
- **RefreshToken**: Session management and logout tracking
- **ApiKey**: Future API integrations

### Permission Architecture

Permissions are **atomic units** – users have exactly the permissions they need, no more. The grant ceiling ensures:

```
Admin can grant anything
  ↓
Manager can grant only what Admin gave them
  ↓
Agent works only within granted permissions
```

## 🔐 Authentication Flow

1. **Login**: Email + password → JWT access token (15 min) + refresh token (7 days, httpOnly)
2. **Access Token**: Stored in memory, included in Authorization header
3. **Refresh Token**: httpOnly cookie, used to get new access tokens
4. **Logout**: Refresh token revoked in database, session blacklist enforced

## 🛡️ Key Features

### ✅ In Scope
- Auth system (login, logout, JWT refresh, session management)
- User CRUD (create, edit, suspend, ban)
- Permission management UI with grant ceiling enforcement
- Dynamic routing (Next.js middleware for permission checks)
- Dynamic sidebar (nav items built from resolved permissions)
- Core modules (Dashboard, Users, Leads, Tasks, Reports, Audit)
- Audit trail (append-only log of all actions)
- Role hierarchy enforcement

### ⏳ Coming Soon
- Figma UI implementation
- Permission UI visual editor
- Customer portal
- Advanced reporting
- 2FA/MFA support
- API key management

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Users (Protected)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `POST /api/users/:id/suspend` - Suspend user
- `POST /api/users/:id/ban` - Ban user

### Permissions (Protected)
- `GET /api/permissions` - List permissions
- `GET /api/users/:id/permissions` - Get user's permissions
- `POST /api/users/:id/permissions/:permId` - Grant permission
- `DELETE /api/users/:id/permissions/:permId` - Revoke permission

### Audit
- `GET /api/audit` - Get audit logs

## 🔧 Development Commands

### Backend
```bash
npm run dev              # Start dev server with auto-reload
npm run build           # Build TypeScript
npm run start           # Run production build
npm run prisma:migrate  # Create/apply migrations
npm run prisma:studio   # Open Prisma Studio GUI
npm run lint            # Run ESLint
```

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Run production build
npm run lint     # Run ESLint
```

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| **Backend** | Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL (Neon) |
| **Auth** | JWT + Refresh Tokens, httpOnly cookies |
| **Security** | bcrypt password hashing, CORS, rate limiting (TODO) |

## 🐛 Troubleshooting

### Database Connection Failed
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running and accessible
- Run `npx prisma migrate deploy` to sync schema

### Auth Errors
- Ensure `.env` has valid `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Check cookies are enabled and secure in production

### CORS Issues
- Verify `FRONTEND_URL` in backend `.env`
- Check frontend `NEXT_PUBLIC_API_URL` matches backend URL

## 📄 License

MIT

## 👥 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open Pull Request

---

**Questions?** Check the documentation or open an issue.
