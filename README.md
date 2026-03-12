# RBAC System — Full-Stack Dynamic Permissions

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **Backend** | Express.js + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT + Refresh Tokens |
| **Styling** | Tailwind CSS |

## Setup

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

### Frontend Setup

```bash
cd frontend

npm install

cp .env.example .env.local
# Update NEXT_PUBLIC_API_URL to http://localhost:5000

npm run dev
```

Access the app at `http://localhost:3000`

### Database Migrations

```bash
cd backend

# Create new migration after schema changes
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Demo Credentials

- **Admin**: `admin@rbac.local` / `admin123`
- **Manager**: `manager@rbac.local` / `manager123`
- **Agent**: `agent@rbac.local` / `agent123`

## Core Entities

### User
`id`, `email`, `username`, `password`, `firstName`, `lastName`, `role`, `managerId`, `status` (ACTIVE, SUSPENDED, BANNED), `userPermissions`, `createdAt`, `updatedAt`

### Role
`id`, `name`, `description`, `level` (0-3), `permissions`, `users`, `createdAt`, `updatedAt`

### Permission
`id`, `name`, `category`, `description`, `resourceType` (page, action), `createdAt`, `updatedAt`

### RolePermission
`roleId`, `permissionId` (composite key), `createdAt`

### UserPermission
`userId`, `permissionId` (composite key), `granted` (boolean), `grantedBy`, `reason`, `createdAt`

### AuditLog
`id`, `timestamp`, `actorId`, `action`, `resourceType`, `resourceId`, `changes` (JSON), `reason`

## API Endpoints

### Authentication
- `POST /auth/login` — Login with email/password
- `POST /auth/logout` — Logout
- `POST /auth/refresh` — Refresh access token
- `GET /auth/me` — Get current user with fresh permissions

### Users
- `GET /users` — List all users
- `POST /users` — Create new user
- `GET /users/:userId` — Get user details
- `PUT /users/:userId` — Update user
- `PUT /users/:userId/suspend` — Suspend user
- `PUT /users/:userId/ban` — Ban user
- `DELETE /users/:userId` — Delete user

### Permissions
- `GET /permissions` — List all permissions
- `GET /permissions/roles/list` — List roles with permissions
- `POST /permissions/roles/:roleId/:permissionId` — Grant permission to role
- `DELETE /permissions/roles/:roleId/:permissionId` — Revoke permission from role
- `GET /permissions/users/:userId` — Get user's permissions
- `POST /permissions/users/:userId/:permissionId` — Grant permission to user
- `DELETE /permissions/users/:userId/:permissionId` — Revoke permission from user

### Team Management
- `GET /team` — List team members
- `POST /team` — Create team member
- `PATCH /team/:id` — Update team member
- `PUT /team/:id/suspend` — Suspend team member
- `PUT /team/:id/ban` — Ban team member
- `POST /team/:id/features` — Control team member's features

### Audit
- `GET /audit` — List audit logs with filtering

### Business Operations
- `GET /leads`, `POST /leads`, `PUT /leads/:id`, `DELETE /leads/:id`
- `GET /tasks`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`
- `GET /support-tickets`, `POST /support-tickets`
- `GET /customer-portal/tickets`, `POST /customer-portal/tickets`
- `GET /customer-portal/orders`

## Permission Categories

| Category | Permissions |
|---|---|
| **Dashboard** | view_dashboard |
| **Users** | view_users, create_user, edit_user, delete_user, suspend_user, ban_user |
| **Permissions** | view_permissions, manage_permissions, manage_role_permissions |
| **Team** | manage_team, create_team_member, edit_team_member, manage_team_features, suspend_team_member, ban_team_member |
| **Leads** | view_leads, create_lead, edit_lead, delete_lead |
| **Tasks** | view_tasks, create_task, edit_task, delete_task, assign_task |
| **Reports** | view_reports, export_reports |
| **Audit** | view_audit_log |
| **Customer** | view_customer_portal, view_own_tickets, create_support_ticket, view_support_tickets, view_orders |
| **Settings** | view_settings, edit_settings |

## Project Structure

```
rbac/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, permission checks
│   │   ├── services/          # Permission cache
│   │   ├── utils/             # Crypto, JWT helpers
│   │   ├── db.ts              # Prisma client
│   │   ├── config.ts          # Configuration
│   │   └── index.ts           # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── seed.ts            # Seed script
│   │   └── migrations/        # Database migrations
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── components/        # Reusable components
│   │   ├── context/           # Auth context, state
│   │   ├── lib/               # API client, utilities
│   │   ├── (pages)/           # Next.js pages
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── middleware.ts          # Route protection
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
└── README.md
```
