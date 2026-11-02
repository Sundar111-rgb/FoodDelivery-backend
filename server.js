
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

import prisma from './src/config/prisma.js';

import healthRoutes from './src/routes/healthRoutes.js';
import restaurantRoutes from './src/routes/restaurantRoutes.js';
import menuRoutes from './src/routes/menuRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import restaurantOrderRoutes from './src/routes/restaurantOrderRoutes.js';
import deliveryRoutes from './src/routes/deliveryRoutes.js';
import deliverySocket from './src/sockets/deliverySocket.js';
import customerOrderRoutes from './src/routes/customerOrderRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Food Delivery API is running',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/restaurants', menuRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/restaurant-orders', restaurantOrderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/orders', customerOrderRoutes);
app.use('/api/admin', adminRoutes);

// Create HTTP server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Food Delivery API running on port ${PORT}`);
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
deliverySocket(io);

// Socket connection


console.log('Socket.IO initialized');

const shutdown = async () => {
  console.log('Shutting down Food Delivery API...');

  io.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
