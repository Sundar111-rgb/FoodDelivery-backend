
import express from 'express';

import {
  getRestaurants,
  getMyRestaurant,
  updateMyRestaurant,
  getRestaurantDashboard,
} from '../controllers/restaurantController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';
import { updateRestaurantStatus } from '../controllers/adminController.js';

const router = express.Router();

// Public: List open restaurants.
router.get('/', getRestaurants);

// Protected: Restaurant owner dashboard.
router.get(
  '/my-restaurant/dashboard',
  authMiddleware,
  authorizeRoles('RESTAURANT_OWNER'),
  getRestaurantDashboard
);

// Protected: View the owner's restaurant.
router.get(
  '/my-restaurant',
  authMiddleware,
  authorizeRoles('RESTAURANT_OWNER'),
  getMyRestaurant
);

// Protected: Update the owner's restaurant.
router.patch(
  '/my-restaurant',
  authMiddleware,
  authorizeRoles('RESTAURANT_OWNER'),
  updateMyRestaurant
);

router.patch(
  '/restaurants/:id/status',
  authMiddleware,
  authorizeRoles('ADMIN'),
  updateRestaurantStatus
);

export default router;
