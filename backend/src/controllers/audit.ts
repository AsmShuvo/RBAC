import { Request, Response } from 'express';
import { prisma } from '../db.js';

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { limit = 100, offset = 0, action, resourceType } = req.query;

    const where: any = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string) || 100,
      skip: parseInt(offset as string) || 0,
    });

    const total = await prisma.auditLog.count({ where });

    res.json({
      logs,
      total,
      limit: parseInt(limit as string) || 100,
      offset: parseInt(offset as string) || 0,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAuditLog(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!log) {
      res.status(404).json({ error: 'Audit log not found' });
      return;
    }

    res.json(log);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
