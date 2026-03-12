import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { invalidateUserPermissionsCache } from '../services/permissionCache.js';
import { hashPassword } from '../utils/crypto.js';

export async function listTeamMembers(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {
      managerId: req.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          role: { select: { name: true } },
          permissions: {
            include: { permission: true },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List team members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createTeamMember(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { email, username, password, firstName, lastName, roleId } = req.body;

    if (!email || !username || !password || !roleId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      res.status(409).json({ error: 'Email or username already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        roleId,
        managerId: req.user.id,
        status: 'ACTIVE',
      },
      include: {
        role: true,
        permissions: {
          include: { permission: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'CREATE_USER',
        resourceType: 'USER',
        resourceId: newUser.id,
        changes: {
          email,
          username,
          firstName,
          lastName,
          role: newUser.role.name,
        },
        reason: 'Team member created',
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateTeamMember(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { firstName, lastName } = req.body;

    // Check if team member belongs to this manager
    const member = await prisma.user.findFirst({
      where: {
        id,
        managerId: req.user.id,
      },
    });

    if (!member) {
      res.status(403).json({ error: 'Not authorized to update this member' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName || member.firstName,
        lastName: lastName || member.lastName,
      },
      include: {
        role: true,
        permissions: {
          include: { permission: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'UPDATE_USER',
        resourceType: 'USER',
        resourceId: id,
        changes: {
          firstName: { from: member.firstName, to: firstName },
          lastName: { from: member.lastName, to: lastName },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function suspendTeamMember(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Check if team member belongs to this manager
    const member = await prisma.user.findFirst({
      where: {
        id,
        managerId: req.user.id,
      },
    });

    if (!member) {
      res.status(403).json({ error: 'Not authorized to modify this member' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      include: {
        role: true,
        permissions: {
          include: { permission: true },
        },
      },
    });

    // Invalidate cache
    invalidateUserPermissionsCache(id);

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'SUSPEND_USER',
        resourceType: 'USER',
        resourceId: id,
        reason: reason || 'Team member suspended by manager',
        changes: {
          status: { from: member.status, to: 'SUSPENDED' },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Suspend team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function banTeamMember(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Check if team member belongs to this manager
    const member = await prisma.user.findFirst({
      where: {
        id,
        managerId: req.user.id,
      },
    });

    if (!member) {
      res.status(403).json({ error: 'Not authorized to modify this member' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'BANNED' },
      include: {
        role: true,
        permissions: {
          include: { permission: true },
        },
      },
    });

    // Invalidate cache
    invalidateUserPermissionsCache(id);

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'BAN_USER',
        resourceType: 'USER',
        resourceId: id,
        reason: reason || 'Team member banned by manager',
        changes: {
          status: { from: member.status, to: 'BANNED' },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Ban team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function manageTeamMemberFeatures(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { permissions: permissionsToGrant, reason } = req.body;

    if (!Array.isArray(permissionsToGrant)) {
      res.status(400).json({ error: 'Permissions must be an array' });
      return;
    }

    // Check if team member belongs to this manager
    const member = await prisma.user.findFirst({
      where: {
        id,
        managerId: req.user.id,
      },
    });

    if (!member) {
      res.status(403).json({ error: 'Not authorized to modify this member' });
      return;
    }

    // Get permission IDs
    const permissions = await prisma.permission.findMany({
      where: {
        name: { in: permissionsToGrant },
      },
      select: { id: true, name: true },
    });

    // Clear existing user-level overrides for this member
    await prisma.userPermission.deleteMany({
      where: { userId: id },
    });

    // Grant new permissions
    const permissionRecords = permissions.map((perm) => ({
      userId: id,
      permissionId: perm.id,
      granted: true,
      grantedBy: req.user?.id,
      reason: reason || 'Team member feature access controlled by manager',
    }));

    await prisma.userPermission.createMany({
      data: permissionRecords,
    });

    // Invalidate cache
    invalidateUserPermissionsCache(id);

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'MANAGE_USER_PERMISSIONS',
        resourceType: 'USER_PERMISSIONS',
        resourceId: id,
        reason: reason || 'Team member features controlled by manager',
        changes: {
          grantedPermissions: permissionsToGrant,
        },
      },
    });

    const updated = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        permissions: {
          include: { permission: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Manage team member features error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
