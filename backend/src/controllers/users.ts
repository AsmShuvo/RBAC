import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { hashPassword } from '../utils/crypto.js';

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const users = await prisma.user.findMany({
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
    });

    res.json(users);
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
