import { Request, Response } from 'express';
import { prisma } from '../db.js';

export async function listRoles(req: Request, res: Response): Promise<void> {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
      },
      orderBy: { level: 'desc' },
    });

    res.json(roles);
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    res.json(role);
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
