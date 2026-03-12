import { Router } from 'express';
import {
  listCustomerTickets,
  getCustomerTicket,
  createCustomerTicket,
  updateCustomerTicket,
  listCustomerOrders,
  getCustomerOrder,
} from '../controllers/customer-portal.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// Support Tickets endpoints
router.get('/tickets', permissionMiddleware('view_support_tickets'), listCustomerTickets);
router.get('/tickets/:id', permissionMiddleware('view_support_tickets'), getCustomerTicket);
router.post('/tickets', permissionMiddleware('create_support_ticket'), createCustomerTicket);
router.patch('/tickets/:id', permissionMiddleware('view_own_tickets'), updateCustomerTicket);

// Orders endpoints
router.get('/orders', permissionMiddleware('view_orders'), listCustomerOrders);
router.get('/orders/:id', permissionMiddleware('view_orders'), getCustomerOrder);

export default router;
