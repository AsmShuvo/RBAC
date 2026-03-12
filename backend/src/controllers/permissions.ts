import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { invalidateUserPermissionsCache } from '../services/permissionCache.js';

export async function listPermissions(req: Request, res: Response): Promise<void> {
  try {
    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        resourceType: true,
      },
      orderBy: { category: 'asc' },
    });

    res.json(permissions);
  } catch (error) {
    console.error('List permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserPermissions(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Combine role permissions with user overrides
    const rolePermissions = user.role.permissions.reduce((acc, rp) => {
      acc[rp.permission.id] = {
        permissionId: rp.permission.id,
        name: rp.permission.name,
        granted: true,
        source: 'role',
      };
      return acc;
    }, {} as Record<string, any>);

    const userPermissions = user.permissions.reduce((acc, up) => {
      acc[up.permission.id] = {
        permissionId: up.permission.id,
        name: up.permission.name,
        granted: up.granted,
        source: 'user_override',
      };
      return acc;
    }, {} as Record<string, any>);

    // Merge: user overrides take precedence
    const merged = { ...rolePermissions, ...userPermissions };
    const permissions = Object.values(merged)
      .filter(p => p.granted)
      .map(p => p.name);

    res.json({
      userId,
      userName: user.firstName + ' ' + user.lastName,
      role: user.role.name,
      permissions,
      details: Object.values(merged),
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function grantPermission(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId, permissionId } = req.params;
    const { reason } = req.body;

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      res.status(404).json({ error: 'Permission not found' });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Upsert permission (create or update)
    const userPermission = await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
      update: {
        granted: true,
        grantedBy: req.user.userId,
        reason: reason || undefined,
      },
      create: {
        userId,
        permissionId,
        granted: true,
        grantedBy: req.user.userId,
        reason: reason || undefined,
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'GRANT_PERMISSION',
        resourceType: 'USER_PERMISSION',
        resourceId: userId,
        changes: {
          permissionId,
          permissionName: permission.name,
          granted: true,
        },
        reason: reason || undefined,
      },
    });

    invalidateUserPermissionsCache(userId);
    res.json({
      message: 'Permission granted',
      userId,
      permissionId,
      permissionName: permission.name,
    });
  } catch (error) {
    console.error('Grant permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function revokePermission(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId, permissionId } = req.params;
    const { reason } = req.body;

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      res.status(404).json({ error: 'Permission not found' });
      return;
    }

    // Delete user permission (or mark as denied)
    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.userId,
        action: 'REVOKE_PERMISSION',
        resourceType: 'USER_PERMISSION',
        resourceId: userId,
        changes: {
          permissionId,
          permissionName: permission.name,
          granted: false,
        },
        reason: reason || undefined,
      },
    });

    invalidateUserPermissionsCache(userId);
    res.json({
      message: 'Permission revoked',
      userId,
      permissionId,
      permissionName: permission.name,
    });
  } catch (error) {
    console.error('Revoke permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function bulkUpdateUserPermissions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId } = req.params;
    const { permissions, reason } = req.body; 

    if (!Array.isArray(permissions)) {
      res.status(400).json({ error: 'Permissions must be an array' });
      return;
    }

    // Step 1: Grant Ceiling Enforcement
    const permIds = permissions.map((p: any) => p.permissionId);
    
    const targetPermissions = await prisma.permission.findMany({
      where: { id: { in: permIds } }
    });

    if (targetPermissions.length !== permIds.length) {
      res.status(400).json({ error: 'One or more permission IDs are invalid' });
      return;
    }

    // Check if the granter has each permission they are trying to grant
    for (const tp of targetPermissions) {
      if (!req.user.permissions.includes(tp.name)) {
        res.status(403).json({ 
          error: `Grant ceiling enforcement failed: You do not have the permission '${tp.name}' that you are attempting to grant or revoke.`
        });
        return;
      }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Step 2: Apply the permissions using a transaction
    await prisma.$transaction(async (tx) => {
      for (const p of permissions) {
        await tx.userPermission.upsert({
          where: {
            userId_permissionId: {
              userId,
              permissionId: p.permissionId,
            },
          },
          update: {
            granted: p.granted,
            grantedBy: req.user!.userId,
            reason: reason || undefined,
          },
          create: {
            userId,
            permissionId: p.permissionId,
            granted: p.granted,
            grantedBy: req.user!.userId,
            reason: reason || undefined,
          },
        });
      }

      // Log to audit once for the bulk operation
      await tx.auditLog.create({
        data: {
          actorId: req.user!.userId,
          action: 'BULK_UPDATE_PERMISSIONS',
          resourceType: 'USER_PERMISSION',
          resourceId: userId,
          changes: {
            permissionsUpdated: permissions,
          },
          reason: reason || undefined,
        },
      });
    });

    invalidateUserPermissionsCache(userId);
    res.json({
      message: 'Permissions updated successfully',
      userId,
    });
  } catch (error) {
    console.error('Bulk update permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
