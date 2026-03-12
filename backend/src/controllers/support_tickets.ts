import { Request, Response } from "express";
import { prisma } from "../db.js";

export const getTickets = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Get user with role info
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { role: true },
    });

    if (!dbUser) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Admin/Manager/Agent see all/team tickets, Customer sees only own
    let tickets;
    if (dbUser.role.level >= 2) {
      // Admin/Manager - all tickets
      tickets = await prisma.supportTicket.findMany({
        include: {
          customer: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
          assignedAgent: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (dbUser.role.level === 1) {
      // Agent - can see tickets assigned to them
      tickets = await prisma.supportTicket.findMany({
        where: {
          OR: [{ assignedAgentId: user.userId }],
        },
        include: {
          customer: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
          assignedAgent: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Customer - only their own tickets
      tickets = await prisma.supportTicket.findMany({
        where: { customerId: user.userId },
        include: {
          customer: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
          assignedAgent: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json(tickets);
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ error: "Failed to get tickets" });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, priority } = req.body;

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Validation
    if (!title || title.trim().length === 0) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    if (!description || description.trim().length === 0) {
      res.status(400).json({ error: "Description is required" });
      return;
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        priority: priority || "NORMAL",
        status: "OPEN",
        customerId: user.userId,
      },
      include: {
        customer: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
        assignedAgent: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { title, description, status, priority, assignedAgentId } = req.body;

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    // Customer can only update their own ticket
    // Manager/Agent can update any ticket
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { role: true },
    });

    if (!dbUser) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (dbUser.role.level === 0) {
      // Customer - can only update their own ticket
      if (ticket.customerId !== user.userId) {
        res.status(403).json({ error: "Cannot update other's tickets" });
        return;
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && dbUser.role.level >= 1 && { status }),
        ...(priority && dbUser.role.level >= 1 && { priority }),
        ...(assignedAgentId !== undefined && dbUser.role.level >= 1 && { assignedAgentId: assignedAgentId || null }),
      },
      include: {
        customer: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
        assignedAgent: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
};

export const closeTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: { status: "CLOSED" },
      include: {
        customer: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
        assignedAgent: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Close ticket error:", error);
    res.status(500).json({ error: "Failed to close ticket" });
  }
};
