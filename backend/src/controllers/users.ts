import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { invalidateUserPermissionsCache } from '../services/permissionCache.js';
import { hashPassword } from '../utils/crypto.js';

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const role = req.query.role as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};
    
    if (role) {
      where.role = { name: role };
    }
    
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

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          status: true,
          role: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        permissions: {
          include: { permission: true },
        },
        team: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const permissions = user.permissions
      .filter(up => up.granted)
      .map(up => up.permission.name);

    res.json({
      ...user,
      permissions,
      password: undefined,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
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

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
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
      },
      include: {
        role: true,
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'CREATE_USER',
        resourceType: 'USER',
        resourceId: newUser.id,
        changes: {
          created: {
            email: newUser.email,
            role: newUser.role.name,
          },
        },
      },
    });

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role.name,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { firstName, lastName, roleId } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(roleId && { roleId }),
      },
      include: { role: true },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'UPDATE_USER',
        resourceType: 'USER',
        resourceId: id,
        changes: {
          firstName,
          lastName,
          roleId,
        },
      },
    });

    if (roleId) {
      invalidateUserPermissionsCache(id);
    }

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role.name,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function suspendUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { revokedAt: new Date() },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'SUSPEND_USER',
        resourceType: 'USER',
        resourceId: id,
        reason: reason || undefined,
      },
    });

    res.json({ message: 'User suspended', userId: id });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function banUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'BANNED' },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { revokedAt: new Date() },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'BAN_USER',
        resourceType: 'USER',
        resourceId: id,
        reason: reason || undefined,
      },
    });

    res.json({ message: 'User banned', userId: id });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function restoreUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'RESTORE_USER',
        resourceType: 'USER',
        resourceId: id,
        reason: reason || undefined,
      },
    });

    res.json({ message: 'User restored', userId: id });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' }, // Using suspend as soft delete according to requirements
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { revokedAt: new Date() },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'DELETE_USER',
        resourceType: 'USER',
        resourceId: id,
        reason: reason || undefined,
      },
    });

    res.json({ message: 'User soft deleted', userId: id });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
