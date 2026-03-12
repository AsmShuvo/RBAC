# RBAC System — Full-Stack Dynamic Permissions

A production-ready Role-Based Access Control system where permissions are fully dynamic and configurable at runtime, not hard-coded into the codebase.

## Overview

This is a multi-role web platform where **permissions drive everything** — what a user sees, what pages they can access, and what actions they can take. No page is locked to a specific role. Access is granted atom by atom, from Admin down to Manager, Manager down to Agent, and optionally to Customers.

### The Problem We Solve

| Without This System | With This System |
|---|---|
| Role access is hard-coded | Any user can be granted access to any feature |
| Adding permissions requires a developer | Admins/Managers configure permissions via UI |
| Agents locked out of certain pages | Agents see exactly what their manager allows |
| No audit trail | Full audit trail of every action |
| Managers can't customize team capabilities | Managers control exactly which features each agent uses |

## Who Uses It

| Role | User Type | What They Need |
|---|---|---|
| **Admin** | Business Owner / IT Admin | Complete control. Manage all users, assign managers, configure the entire permission structure, and see full activity overview. |
| **Manager** | Team Lead / Department Head | Create and manage their team (agents + customers). Control exactly which features each agent can use. Suspend or ban users within their scope. |
| **Agent** | Staff / Operator | Work within modules their manager has unlocked. Could be managing leads, handling tasks, running reports — whatever they've been given access to. |
| **Customer** | End Client / User | Access their own self-service portal. View tickets, orders, or interactions. Cannot see internal operations unless explicitly granted. |

## Key Features

### 1. Dynamic Permission Routing
Every page in the app has one required permission atom. If you have it, the page is accessible. If you don't, you're redirected to a 403 screen. Role label is irrelevant.

### 2. Grant Ceiling Enforcement
You cannot give more than you have. An Admin can grant any permission to any role. A Manager can only grant permissions they themselves possess.

### 3. Role Hierarchy
- **Admin (Level 3)** — All permissions
- **Manager (Level 2)** — Everything except audit logs and role management
- **Agent (Level 1)** — Basic operational permissions (leads, tasks, reports)
- **Customer (Level 0)** — Self-service portal only

### 4. Real-Time Permission Updates
Permission changes take effect immediately without requiring users to log out using event-based updates and permission cache invalidation.

### 5. Full Audit Trail
Every admin/manager action is logged with actor, timestamp, and what changed.

### 6. Team Management
Managers can create and manage team members, control which features each agent can access, and suspend or ban users within their scope.

### 7. Dynamic Sidebar Navigation
The navigation menu is built at runtime from the user's resolved permission set.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **Backend** | Express.js + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT + Refresh Tokens |
| **Styling** | Tailwind CSS |

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

npm install

cp .env.example .env
# Update DATABASE_URL and JWT_SECRET in .env

npm run db:push

npm run seed

npm run dev
```

**Demo Credentials:**
- Admin: `admin@rbac.local` / `admin123`
- Manager: `manager@rbac.local` / `manager123`
- Agent: `agent@rbac.local` / `agent123`

### Frontend Setup

```bash
cd frontend

npm install

cp .env.example .env.local
# Update NEXT_PUBLIC_API_URL to backend URL

npm run dev
```

Access the app at `http://localhost:3000`

## Core Entities

### User
Email, username, password, first/last name, role, status (ACTIVE, SUSPENDED, BANNED), custom permissions

### Role
Name, description, level (0-3), permissions collection, users collection

### Permission
Name, category, description, resource type (page/action)

### RolePermission
Links roles to permissions (many-to-many)

### UserPermission
User-specific permission overrides (grant/revoke beyond role)

### AuditLog
Actor, action, resource, changes, timestamp, reason

## API Endpoints

### Authentication
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`

### Users
- `GET /users`
- `POST /users`
- `GET /users/:userId`
- `PUT /users/:userId`
- `DELETE /users/:userId`
- `PUT /users/:userId/suspend`
- `PUT /users/:userId/ban`

### Permissions
- `GET /permissions`
- `GET /permissions/roles/list`
- `POST /permissions/roles/:roleId/:permissionId`
- `DELETE /permissions/roles/:roleId/:permissionId`
- `GET /permissions/users/:userId`
- `POST /permissions/users/:userId/:permissionId`
- `DELETE /permissions/users/:userId/:permissionId`

### Team Management
- `GET /team`
- `POST /team`
- `PATCH /team/:id`
- `PUT /team/:id/suspend`
- `PUT /team/:id/ban`
- `POST /team/:id/features`

### Audit
- `GET /audit`

### Business Operations
- `GET /leads`, `POST /leads`, `PUT /leads/:id`, `DELETE /leads/:id`
- `GET /tasks`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`
- `GET /customer-portal/tickets`, `POST /customer-portal/tickets`
- `GET /customer-portal/orders`

## Permission Categories

**Dashboard:** view_dashboard

**User Management:** view_users, create_user, edit_user, delete_user, suspend_user, ban_user

**Permissions:** view_permissions, manage_permissions, manage_role_permissions

**Team:** manage_team, create_team_member, edit_team_member, manage_team_features, suspend_team_member, ban_team_member

**Leads:** view_leads, create_lead, edit_lead, delete_lead

**Tasks:** view_tasks, create_task, edit_task, delete_task, assign_task

**Reports:** view_reports, export_reports

**Audit:** view_audit_log

**Customer:** view_customer_portal, view_own_tickets, create_support_ticket, view_support_tickets, view_orders

**Settings:** view_settings, edit_settings

## Protected Routes

- `/dashboard` — view_dashboard
- `/users` — view_users
- `/permissions` — view_permissions
- `/team` — manage_team
- `/leads` — view_leads
- `/tasks` — view_tasks
- `/reports` — view_reports
- `/audit` — view_audit_log
- `/support-tickets` — view_support_tickets
- `/customer` — view_customer_portal

## Project Structure

```
rbac/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth and permission checks
│   │   ├── services/        # Permission cache, utilities
│   │   ├── utils/           # Crypto, JWT helpers
│   │   ├── db.ts            # Prisma client
│   │   ├── config.ts        # Configuration
│   │   └── index.ts         # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.ts          # Seed script
│   │   └── migrations/      # Database migrations
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Auth context, state
│   │   ├── lib/             # API client, utilities
│   │   ├── (pages)/         # Next.js pages
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── middleware.ts        # Route protection
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

## Security Measures

- JWT tokens with 15-minute expiration
- Refresh tokens in httpOnly cookies (7 days)
- Password hashing with bcrypt
- Rate limiting on auth endpoints
- Grant ceiling enforcement
- Full audit trail
- Role-based request validation

## Database Migrations

```bash
cd backend

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset (development only)
npx prisma migrate reset
```

## Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/rbac
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
NODE_ENV=production
PORT=5000
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Building for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm start
```

## Troubleshooting

**Admin gets "Insufficient Permissions" error:**
- Ensure database is seeded: `npm run seed`
- Verify admin has `manage_role_permissions` permission

**Permissions not updating in real-time:**
- Check event listeners are attached
- Verify permission cache TTL settings

**Routes not protected:**
- Check middleware.ts configuration
- Verify permission names match frontend/backend
- Ensure token is sent in Authorization header

**Team member can't access features:**
- Verify feature permissions are granted to role
- Confirm manager is granting features correctly
- Check permission cache is invalidated

## License

Proprietary — Digital Pylot
