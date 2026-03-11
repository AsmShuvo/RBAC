# RBAC Platform - API Reference

## Server URLs
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Prisma Studio**: Run `cd backend && npm run prisma:studio`

---

## Authentication Endpoints

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@rbac.local",
  "password": "admin123"
}

Response Status: 200
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "admin@rbac.local",
    "name": "Admin User",
    "role": "Admin",
    "permissions": [
      "view_dashboard",
      "view_users",
      "create_user",
      ...
    ]
  }
}

--- OR ---

Response Status: 401
{ "error": "Invalid credentials" }
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure123",
  "name": "New User"
}

Response Status: 201
{
  "accessToken": "...",
  "user": { ... }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Cookie: refreshToken=...

Response Status: 200
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Cookie: refreshToken=...

Response Status: 200
{ "message": "Logged out successfully" }
```

---

## Users Endpoints

### List All Users
```http
GET /api/users
Authorization: Bearer <token>

Response Status: 200
[
  {
    "id": "user-id",
    "email": "admin@rbac.local",
    "name": "Admin User",
    "role": "Admin",
    "suspended": false,
    "banned": false,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  ...
]
```

### Get Single User
```http
GET /api/users/user-id
Authorization: Bearer <token>

Response Status: 200
{
  "id": "user-id",
  "email": "admin@rbac.local",
  "name": "Admin User",
  "role": "Admin",
  "roleId": "role-id",
  "managerId": null,
  "permissions": [
    { "id": "perm-1", "name": "view_dashboard", "category": "Dashboard" },
    ...
  ],
  "suspended": false,
  "banned": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "Secure123!",
  "name": "New User",
  "roleId": "role-id",
  "managerId": null
}

Response Status: 201
{
  "id": "new-user-id",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "Manager",
  ...
}
```

### Update User
```http
PATCH /api/users/user-id
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "updated@example.com",
  "name": "Updated Name",
  "roleId": "new-role-id"
}

Response Status: 200
{ "message": "User updated successfully" }
```

### Suspend User
```http
POST /api/users/user-id/suspend
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Temporary suspension for investigation"
}

Response Status: 200
{ "message": "User suspended successfully" }
```

### Ban User
```http
POST /api/users/user-id/ban
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Violation of terms"
}

Response Status: 200
{ "message": "User banned successfully" }
```

---

## Permissions Endpoints

### List All Permissions
```http
GET /api/permissions
Authorization: Bearer <token>

Response Status: 200
[
  {
    "id": "perm-1",
    "name": "view_dashboard",
    "description": "Can view the dashboard",
    "category": "Dashboard"
  },
  {
    "id": "perm-2",
    "name": "view_users",
    "description": "Can view users",
    "category": "Users"
  },
  ...
]
```

### Get User Permissions
```http
GET /api/permissions/users/user-id
Authorization: Bearer <token>

Response Status: 200
{
  "user": {
    "id": "user-id",
    "email": "admin@rbac.local"
  },
  "grantedBy": {
    "role": ["view_dashboard", "view_users", "view_permissions"],
    "override": ["manage_users"]
  },
  "all": ["view_dashboard", "view_users", "view_permissions", "manage_users"]
}
```

### Grant Permission
```http
POST /api/permissions/users/user-id/perm-id
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "User needs access for new role"
}

Response Status: 201
{
  "message": "Permission granted successfully",
  "permission": {
    "id": "perm-id",
    "name": "view_users"
  }
}

--- OR ---

Response Status: 403
{ "error": "Cannot grant permissions above your level" }
```

### Revoke Permission
```http
DELETE /api/permissions/users/user-id/perm-id
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "User no longer needs this access"
}

Response Status: 200
{
  "message": "Permission revoked successfully"
}
```

---

## Audit Log Endpoints

### List Audit Logs
```http
GET /api/audit?page=1&limit=50&action=create_user
Authorization: Bearer <token>

Response Status: 200
{
  "logs": [
    {
      "id": "log-id",
      "actor": {
        "id": "user-id",
        "email": "admin@rbac.local"
      },
      "action": "create_user",
      "resourceType": "User",
      "resourceId": "new-user-id",
      "changes": {
        "email": "newuser@example.com",
        "name": "New User"
      },
      "reason": "New team member",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    ...
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

### Get Single Audit Log
```http
GET /api/audit/log-id
Authorization: Bearer <token>

Response Status: 200
{
  "id": "log-id",
  "actor": {
    "id": "user-id",
    "email": "admin@rbac.local",
    "name": "Admin User"
  },
  "action": "grant_permission",
  "resourceType": "User",
  "resourceId": "target-user-id",
  "changes": {
    "permissionAdded": "manage_users"
  },
  "reason": "Promotion to manager",
  "timestamp": "2024-01-01T12:00:00Z",
  "ipAddress": "192.168.1.1"
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input parameters"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Testing with cURL

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rbac.local",
    "password": "admin123"
  }' \
  -c cookies.txt
```

### Test Protected Endpoint
```bash
# Set TOKEN to the accessToken from login response
export TOKEN="your-access-token-here"

curl http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### Test Refresh Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -b cookies.txt
```

### Grant Permission
```bash
curl -X POST http://localhost:5000/api/permissions/users/USER_ID/PERM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "User promoted to manager"
  }'
```

### Get Audit Logs
```bash
curl "http://localhost:5000/api/audit?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Demo Accounts

```
┌──────────────────┬──────────────────┬──────────────────┐
│ Role             │ Email            │ Password         │
├──────────────────┼──────────────────┼──────────────────┤
│ Admin            │ admin@rbac.local │ admin123         │
│ Manager          │ manager@rbac...  │ manager123       │
│ Agent            │ agent@rbac.local │ agent123         │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## Permission Categories & Atoms

### Dashboard
- `view_dashboard` - View main dashboard

### Users (6)
- `view_users` - List and view users
- `create_user` - Create new users
- `edit_user` - Edit user details
- `delete_user` - Delete users
- `suspend_user` - Suspend users
- `ban_user` - Ban users

### Permissions (3)
- `view_permissions` - View permissions
- `manage_permissions` - Grant/revoke permissions
- `manage_role_permissions` - Configure role defaults

### Leads (3)
- `view_leads` - View leads
- `create_lead` - Create leads
- `edit_lead` - Edit leads
- `delete_lead` - Delete leads

### Tasks (4)
- `view_tasks` - View tasks
- `create_task` - Create tasks
- `edit_task` - Edit tasks
- `delete_task` - Delete tasks
- `assign_task` - Assign tasks to others

### Reports (2)
- `view_reports` - View reports
- `export_reports` - Export report data

### Audit (1)
- `view_audit_log` - View audit logs

### Settings (2)
- `view_settings` - View settings
- `edit_settings` - Edit settings

### Customer (3)
- `view_customer_portal` - Access customer portal
- `view_own_tickets` - View own support tickets
- `create_support_ticket` - Create support tickets

---

## Role Hierarchy & Permissions

### Admin (Level 4)
- All 30+ permissions
- Can manage all users and permissions
- Full audit access

### Manager (Level 3)
- User, Leads, Tasks, Reports viewing
- Limited user creation/editing
- Cannot manage admin permissions

### Agent (Level 2)
- Leads, Tasks, Reports viewing
- Can only view/create own items
- Limited access

### Customer (Level 1)
- View own portal
- Create support tickets
- View own tickets

---

## Rate Limiting (Future)
```
- Login attempts: 5 per 15 minutes
- API requests: 100 per minute per user
- Refresh token: 1 per 5 seconds
```

---

**Last Updated**: 2026-03-11
**Tested With**: cURL, Postman, Thunderclient
