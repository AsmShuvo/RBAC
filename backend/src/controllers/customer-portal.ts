import { Request, Response } from 'express';
import { prisma } from '../db.js';

export async function listCustomerTickets(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {
      customerId: req.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List customer tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCustomerTicket(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        customerId: req.user.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get customer ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createCustomerTicket(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { title, description, priority } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    // Generate unique ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        title,
        description,
        priority: priority || 'NORMAL',
        status: 'OPEN',
        customerId: req.user.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'CREATE_SUPPORT_TICKET',
        resourceType: 'SUPPORT_TICKET',
        resourceId: ticket.id,
        changes: {
          ticketNumber,
          title,
          priority: ticket.priority,
        },
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create customer ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCustomerTicket(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { title, description } = req.body;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        customerId: req.user.id,
      },
    });

    if (!ticket) {
      res.status(403).json({ error: 'Not authorized to update this ticket' });
      return;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        title: title || ticket.title,
        description: description || ticket.description,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update customer ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listCustomerOrders(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {
      customerId: req.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          productName: true,
          quantity: true,
          total: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List customer orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCustomerOrder(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId: req.user.id,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Get customer order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
