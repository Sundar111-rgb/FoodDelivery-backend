
import express from 'express';

import {
  getAdminDashboard,
  getAdminUsers,
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

export default router;
