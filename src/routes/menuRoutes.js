
import express from 'express';

import {
  getRestaurantMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';

const router = express.Router();

// Public: Get a restaurant's available menu items.
router.get('/:restaurantId/menu', getRestaurantMenu);

// Protected: Create a menu item.
router.post(
  '/:restaurantId/menu',
  authMiddleware,
  authorizeRoles('RESTAURANT_OWNER', 'ADMIN'),
  createMenuItem
);

// Protected: Edit a menu item.
router.patch(
  '/:restaurantId/menu/:menuItemId',
  authMiddleware,
  authorizeRoles('RESTAURANT_OWNER', 'ADMIN'),
  updateMenuItem
);

// Protected: Delete a menu item.
router.delete(
  '/:restaurantId/menu/:menuItemId',
  authMiddleware,
  authorizeRoles('RESTAURANT_OWNER', 'ADMIN'),
  deleteMenuItem
);

export default router;
