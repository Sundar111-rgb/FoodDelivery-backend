import express from 'express';

import {
  createCustomerOrder,
  getCustomerOrders,
} from '../controllers/customerOrderController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';

const router = express.Router();

// Place a new order
router.post(
  '/',
  authMiddleware,
  authorizeRoles('CUSTOMER'),
  createCustomerOrder,
);

// Get orders for the logged-in customer
router.get(
  '/',
  authMiddleware,
  authorizeRoles('CUSTOMER'),
  getCustomerOrders,
);

export default router;