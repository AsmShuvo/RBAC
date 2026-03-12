import { Router } from "express";
import { authMiddleware, permissionMiddleware } from "../middleware/auth.js";
import { getTickets, createTicket, updateTicket, closeTicket } from "../controllers/support_tickets.js";

const router = Router();

router.use(authMiddleware);

// GET /api/support-tickets - Get all tickets
router.get("/", getTickets);

// POST /api/support-tickets - Create a new ticket
router.post("/", permissionMiddleware("create_support_ticket"), createTicket);

// PUT /api/support-tickets/:id - Update a ticket
router.put("/:id", updateTicket);

// POST /api/support-tickets/:id/close - Close a ticket
router.post("/:id/close", closeTicket);

export default router;
