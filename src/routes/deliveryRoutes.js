
import express from 'express';

import {
  getAvailableOrders,
  acceptDelivery,
  pickupDelivery,
  startDelivery,
  completeDelivery,
} from '../controllers/deliveryController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';

const router = express.Router();

router.get(
  '/available-orders',
  authMiddleware,
  authorizeRoles('DELIVERY_PARTNER'),
  getAvailableOrders
);

router.patch(
  '/orders/:orderId/accept',
  authMiddleware,
  authorizeRoles('DELIVERY_PARTNER'),
  acceptDelivery
);

router.patch(
  "/orders/:orderId/pickup",
  authMiddleware,
  pickupDelivery
);

router.patch(
  "/orders/:orderId/start",
  authMiddleware,
  startDelivery
);

router.patch(
  "/orders/:orderId/complete",
  authMiddleware,
  completeDelivery
);

export default router;
