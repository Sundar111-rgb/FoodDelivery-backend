
import express from 'express';
import {
  register,
  login,
} from '../controllers/authController.js';

const router = express.Router();

// Register a new customer
router.post('/register', register);

// Log in an existing user
router.post('/login', login);

export default router;
