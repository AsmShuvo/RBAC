import { Request, Response } from "express";
import { prisma } from "../db.js";

export const getLeads = async (req: Request, res: Response) => {
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

    // Admin sees all leads, Manager/Agent see their own + assigned
    let leads;
    if (dbUser.role.level === 3) {
      // Admin - all leads
      leads = await prisma.lead.findMany({
        include: {
          createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Manager/Agent - own created + assigned leads
      leads = await prisma.lead.findMany({
        where: {
          OR: [{ createdById: user.userId }, { assignedToId: user.userId }],
        },
        include: {
          createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json(leads);
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({ error: "Failed to get leads" });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { company, contact, email, phone, status, value, notes, assignedToId } = req.body;

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Validation
    if (!company || company.trim().length === 0) {
      res.status(400).json({ error: "Company name is required" });
      return;
    }

    if (!contact || contact.trim().length === 0) {
      res.status(400).json({ error: "Contact name is required" });
      return;
    }

    // Check if assignee exists
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!assignee) {
        res.status(400).json({ error: "Assignee not found" });
        return;
      }
    }

    const lead = await prisma.lead.create({
      data: {
        company,
        contact,
        email: email || "",
        phone: phone || null,
        status: status || "New",
        value: value ? parseFloat(value) : null,
        notes: notes || null,
        createdById: user.userId,
        assignedToId: assignedToId || null,
      },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error("Create lead error:", error);
    res.status(500).json({ error: "Failed to create lead" });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { company, contact, email, phone, status, value, notes, assignedToId } = req.body;

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Check ownership
    if (lead.createdById !== user.userId) {
      res.status(403).json({ error: "Cannot edit other's leads" });
      return;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(company && { company }),
        ...(contact && { contact }),
        ...(email && { email }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(status && { status }),
        ...(value !== undefined && { value: value ? parseFloat(value) : null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update lead error:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Only creator can delete
    if (lead.createdById !== user.userId) {
      res.status(403).json({ error: "Cannot delete other's leads" });
      return;
    }

    await prisma.lead.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
};
