import { Request, Response } from "express";
import { prisma } from "../db.js";

export const getTasks = async (req: Request, res: Response) => {
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

    // Agents/Managers can see their own tasks and team tasks
    // Admin can see all tasks
    let tasks;
    if (dbUser.role.level === 3) {
      // Admin - all tasks
      tasks = await prisma.task.findMany({
        include: {
          createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (dbUser.role.level === 2) {
      // Manager - own tasks + team tasks
      tasks = await prisma.task.findMany({
        where: {
          OR: [
            { createdById: user.userId },
            { assigneeId: user.userId },
            { createdBy: { managerId: user.userId } }, // Team's tasks
          ],
        },
        include: {
          createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (dbUser.role.level === 1) {
      // Agent - own created + assigned tasks
      tasks = await prisma.task.findMany({
        where: {
          OR: [{ createdById: user.userId }, { assigneeId: user.userId }],
        },
        include: {
          createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Customer - only assigned tasks
      tasks = await prisma.task.findMany({
        where: { assigneeId: user.userId },
        include: {
          createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Failed to get tasks" });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, priority, dueDate, assigneeId } = req.body;

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Validation
    if (!title || title.trim().length === 0) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    // Check if assignee exists
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!assignee) {
        res.status(400).json({ error: "Assignee not found" });
        return;
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority || "MEDIUM",
        // @ts-ignore
        status: "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: user.userId,
        assigneeId: assigneeId || null,
      },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { title, description, priority, status, dueDate, assigneeId } = req.body;

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

    // Verify task exists and belongs to user or team
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Check ownership or team membership
    if (dbUser.role.level < 2) {
      // Only Agents/Managers/Admins can edit. Agents can only edit their own
      if (dbUser.role.level === 1 && task.createdById !== user.userId && task.assigneeId !== user.userId) {
        res.status(403).json({ error: "Cannot edit other's tasks" });
        return;
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

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

    // Verify task exists
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Only creator or admin can delete
    if (dbUser.role.level < 3 && task.createdById !== user.userId) {
      res.status(403).json({ error: "Cannot delete other's tasks" });
      return;
    }

    await prisma.task.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};
