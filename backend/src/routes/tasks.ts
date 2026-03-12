import { Router } from "express";
import { authMiddleware, permissionMiddleware } from "../middleware/auth.js";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/tasks.js";

const router = Router();

// Protect all routes with authentication
router.use(authMiddleware);

// GET /api/tasks - Get all tasks
router.get("/", getTasks);

// POST /api/tasks - Create a new task
router.post("/", permissionMiddleware("create_task"), createTask);

// PUT /api/tasks/:id - Update a task
router.put("/:id", permissionMiddleware("edit_task"), updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", permissionMiddleware("delete_task"), deleteTask);

export default router;
