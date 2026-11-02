
import prisma from '../config/prisma.js';

export async function getRestaurantOrders(req, res) {
  try {
    // Find the restaurant assigned to the logged-in owner.
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: req.user.userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'No restaurant is assigned to your account',
      });
    }

    // Optional status filter, for example ?status=PENDING
    const allowedStatuses = [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ];

    const { status } = req.query;

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
        allowedStatuses,
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        ...(status ? { status } : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      restaurant,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get restaurant orders error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve restaurant orders',
    });
  }
}



export async function updateRestaurantOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_PICKUP'],
    };

    if (
      typeof status !== 'string' ||
      !['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
    }

    // Find the restaurant assigned to the logged-in owner.
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: req.user.userId,
      },
      select: {
        id: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'No restaurant is assigned to your account',
      });
    }

    // Only find orders belonging to this owner's restaurant.
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found in your restaurant',
      });
    }

    const permittedStatuses = allowedTransitions[order.status] ?? [];

    if (!permittedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${order.status} to ${status}`,
        allowedStatuses: permittedStatuses,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update restaurant order status error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to update order status',
    });
  }
}
