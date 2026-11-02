
import express from 'express';

import {
  getRestaurantOrders,
  updateRestaurantOrderStatus,
} from '../controllers/restaurantOrderController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';

const router = express.Router();

// View orders belonging to the owner's restaurant.
router.get(
  '/',
  authMiddleware,
  authorizeRoles('RESTAURANT_OWNER'),
  getRestaurantOrders
);

// Update the status of an order belonging to the owner's restaurant.
router.patch(
  '/:orderId/status',
  authMiddleware,
  authorizeRoles('RESTAURANT_OWNER'),
  updateRestaurantOrderStatus
);

export default router;
