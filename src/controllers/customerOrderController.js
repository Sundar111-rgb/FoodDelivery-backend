
import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

// CREATE CUSTOMER ORDER
export const createCustomerOrder = async (req, res) => {
  try {
    const customerId = req.user.userId;

    const { restaurantId, deliveryAddress, items } = req.body;

    // Validate required fields
    if (!restaurantId || !deliveryAddress || !items) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant, delivery address and items are required',
      });
    }

    if (
      typeof deliveryAddress !== 'string' ||
      !deliveryAddress.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid delivery address',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty',
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Too many items in one order',
      });
    }

    // Validate item IDs and quantities
    for (const item of items) {
      if (
        !item.menuItemId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid menu item or quantity',
        });
      }
    }

    // Check restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (!restaurant.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is currently closed',
      });
    }

    // Combine duplicate menu items
    const quantityMap = new Map();

    for (const item of items) {
      const currentQuantity =
        quantityMap.get(item.menuItemId) || 0;

      quantityMap.set(
        item.menuItemId,
        currentQuantity + item.quantity,
      );
    }

    const menuItemIds = [...quantityMap.keys()];

    // Fetch actual menu items from database
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds,
        },
        restaurantId,
        isAvailable: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        success: false,
        message:
          'Some food items are unavailable or do not belong to this restaurant',
      });
    }

    // Calculate total using database prices
    let totalAmount = new Prisma.Decimal(0);

    const orderItems = menuItems.map(menuItem => {
      const quantity = quantityMap.get(menuItem.id);

      const itemTotal = menuItem.price.mul(quantity);

      totalAmount = totalAmount.plus(itemTotal);

      return {
        menuItemId: menuItem.id,
        quantity,
        price: menuItem.price,
      };
    });

    // Create order and order items
    const order = await prisma.order.create({
      data: {
        customerId,
        restaurantId,
        deliveryAddress: deliveryAddress.trim(),
        totalAmount,
        status: 'PENDING',

        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    console.error('Create customer order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
    });
  }
};


// GET CUSTOMER ORDER HISTORY
export const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.userId;

    const orders = await prisma.order.findMany({
      where: {
        customerId,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get customer orders error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders',
    });
  }
};
