import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/crypto.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create roles with hierarchy
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "System administrator with full control",
      level: 3,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "Manager" },
    update: {},
    create: {
      name: "Manager",
      description: "Team manager - can manage own team",
      level: 2,
    },
  });

  const agentRole = await prisma.role.upsert({
    where: { name: "Agent" },
    update: {},
    create: {
      name: "Agent",
      description: "Team member - can access assigned features",
      level: 1,
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: "Customer" },
    update: {},
    create: {
      name: "Customer",
      description: "Customer with self-service access",
      level: 0,
    },
  });

  console.log("✓ Roles created");

  // Create permissions organized by category
  const permissions = [
    // Dashboard
    { name: "view_dashboard", category: "dashboard", resourceType: "page" },

    // User Management
    { name: "view_users", category: "users", resourceType: "page" },
    { name: "create_user", category: "users", resourceType: "action" },
    { name: "edit_user", category: "users", resourceType: "action" },
    { name: "delete_user", category: "users", resourceType: "action" },
    { name: "suspend_user", category: "users", resourceType: "action" },
    { name: "ban_user", category: "users", resourceType: "action" },

    // Permission Management
    { name: "view_permissions", category: "permissions", resourceType: "page" },
    {
      name: "manage_permissions",
      category: "permissions",
      resourceType: "action",
    },
    {
      name: "manage_role_permissions",
      category: "permissions",
      resourceType: "action",
    },

    // Leads Module
    { name: "view_leads", category: "leads", resourceType: "page" },
    { name: "create_lead", category: "leads", resourceType: "action" },
    { name: "edit_lead", category: "leads", resourceType: "action" },
    { name: "delete_lead", category: "leads", resourceType: "action" },

    // Tasks Module
    { name: "view_tasks", category: "tasks", resourceType: "page" },
    { name: "create_task", category: "tasks", resourceType: "action" },
    { name: "edit_task", category: "tasks", resourceType: "action" },
    { name: "delete_task", category: "tasks", resourceType: "action" },
    { name: "assign_task", category: "tasks", resourceType: "action" },

    // Reports
    { name: "view_reports", category: "reports", resourceType: "page" },
    {
      name: "export_reports",
      category: "reports",
      resourceType: "action",
    },

    // Audit
    { name: "view_audit_log", category: "audit", resourceType: "page" },

    // Settings
    { name: "view_settings", category: "settings", resourceType: "page" },
    { name: "edit_settings", category: "settings", resourceType: "action" },

    // Customer Portal
    {
      name: "view_customer_portal",
      category: "customer",
      resourceType: "page",
    },
    { name: "view_own_tickets", category: "customer", resourceType: "action" },
    {
      name: "create_support_ticket",
      category: "customer",
      resourceType: "action",
    },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((perm) =>
      prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      })
    )
  );

  console.log(`✓ ${createdPermissions.length} permissions created`);

  // Assign permissions to roles
  // Admin: Full access to everything
  const adminPermissions = createdPermissions.map((p) => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }));

  // Manager: User management, leads, tasks, reports, but not audit or role management
  const managerPermissions = createdPermissions
    .filter((p) => !["view_audit_log", "manage_role_permissions"].includes(p.name))
    .map((p) => ({
      roleId: managerRole.id,
      permissionId: p.id,
    }));

  // Agent: Can view leads, tasks, reports, but not user management
  const agentPermissions = createdPermissions
    .filter(
      (p) =>
        [
          "view_dashboard",
          "view_leads",
          "create_lead",
          "edit_lead",
          "view_tasks",
          "create_task",
          "edit_task",
          "assign_task",
          "view_reports",
        ].includes(p.name)
    )
    .map((p) => ({
      roleId: agentRole.id,
      permissionId: p.id,
    }));

  // Customer: Self-service portal only
  const customerPermissions = createdPermissions
    .filter((p) => p.category === "customer")
    .map((p) => ({
      roleId: customerRole.id,
      permissionId: p.id,
    }));

  await prisma.rolePermission.deleteMany({});
  await prisma.rolePermission.createMany({
    data: [
      ...adminPermissions,
      ...managerPermissions,
      ...agentPermissions,
      ...customerPermissions,
    ],
  });

  console.log("✓ Role permissions assigned");

  // Create demo admin user (password: admin123)
  const adminPassword = await hashPassword("admin123");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@rbac.local" },
    update: {},
    create: {
      email: "admin@rbac.local",
      username: "admin",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: { connect: { id: adminRole.id } },
      status: "ACTIVE",
    },
  });

  console.log("✓ Admin user created (admin@rbac.local / admin123)");

  // Create demo manager user (password: manager123)
  const managerPassword = await hashPassword("manager123");
  const managerUser = await prisma.user.upsert({
    where: { email: "manager@rbac.local" },
    update: {},
    create: {
      email: "manager@rbac.local",
      username: "manager",
      password: managerPassword,
      firstName: "John",
      lastName: "Manager",
      role: { connect: { id: managerRole.id } },
      status: "ACTIVE",
    },
  });

  console.log("✓ Manager user created (manager@rbac.local / manager123)");

  // Create demo agent user (password: agent123)
  const agentPassword = await hashPassword("agent123");
  const agentUser = await prisma.user.upsert({
    where: { email: "agent@rbac.local" },
    update: {},
    create: {
      email: "agent@rbac.local",
      username: "agent",
      password: agentPassword,
      firstName: "Jane",
      lastName: "Agent",
      role: { connect: { id: agentRole.id } },
      manager: { connect: { id: managerUser.id } },
      status: "ACTIVE",
    },
  });

  console.log("✓ Agent user created (agent@rbac.local / agent123)");

  console.log("\n✅ Database seeded successfully!");
  console.log("\nDemo Accounts:");
  console.log("  Admin:   admin@rbac.local / admin123");
  console.log("  Manager: manager@rbac.local / manager123");
  console.log("  Agent:   agent@rbac.local / agent123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
