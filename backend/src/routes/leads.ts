import { Router } from "express";
import { authMiddleware, permissionMiddleware } from "../middleware/auth.js";
import { getLeads, createLead, updateLead, deleteLead } from "../controllers/leads.js";

const router = Router();

// Protect all routes with authentication
router.use(authMiddleware);

// GET /api/leads - Get all leads
router.get("/", getLeads);

// POST /api/leads - Create a new lead
router.post("/", permissionMiddleware("create_lead"), createLead);

// PUT /api/leads/:id - Update a lead
router.put("/:id", permissionMiddleware("edit_lead"), updateLead);

// DELETE /api/leads/:id - Delete a lead
router.delete("/:id", permissionMiddleware("delete_lead"), deleteLead);

export default router;
