
import express from 'express';
import prisma from '../config/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: 'Food Delivery API and PostgreSQL are connected',
      database: 'connected',
    });
  } catch (error) {
    console.error('Database health check failed:', error.message);

    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      database: 'disconnected',
    });
  }
});

export default router;
