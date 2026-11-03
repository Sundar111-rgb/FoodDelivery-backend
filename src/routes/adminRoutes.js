
import express from 'express';

import {
  getAdminDashboard,
  getAdminUsers,
  createAdminUser,  
  getAdminRestaurants,
  updateRestaurantStatus,
  createAdminRestaurant,
  updateAdminRestaurant,
  getAdminOrders,
  getAdminDeliveryPartners,

} from '../controllers/adminController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';

const router = express.Router();

// Admin Dashboard
router.get(
  '/dashboard',
  authMiddleware,
  authorizeRoles('ADMIN'),
  getAdminDashboard
);

// Get All Users
router.get(
  '/users',
  authMiddleware,
  authorizeRoles('ADMIN'),
  getAdminUsers
);

// Create User
router.post(
  '/users',
  authMiddleware,
  authorizeRoles('ADMIN'),
  createAdminUser
);

router.get(
  '/restaurants',
  authMiddleware,
  authorizeRoles('ADMIN'),
  getAdminRestaurants
);

router.patch(
  '/restaurants/:id/status',
  authMiddleware,
  authorizeRoles('ADMIN'),
  updateRestaurantStatus
);

router.post(
  '/restaurants',
  authMiddleware,
  authorizeRoles('ADMIN'),
  createAdminRestaurant
);

router.put(
  '/restaurants/:id',
  authMiddleware,
  authorizeRoles('ADMIN'),
  updateAdminRestaurant
);

router.get(
  '/orders',
  authMiddleware,
  authorizeRoles('ADMIN'),
  getAdminOrders
);

router.get(
  '/delivery-partners',
  authMiddleware,
  authorizeRoles('ADMIN'),
  getAdminDeliveryPartners
);
export default router;
