
import prisma from '../config/prisma.js';

export const getAvailableOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'READY_FOR_PICKUP',
        deliveryPartnerId: null,
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        deliveryAddress: true,
        createdAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get available delivery orders error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve available delivery orders',
    });
  }
};


export const acceptDelivery = async (req, res) => {
  const { orderId } = req.params;
const deliveryPartnerId = req.user.userId;
  console.log("ORDER ID:", orderId);
console.log("DELIVERY PARTNER ID:", deliveryPartnerId);
console.log("AUTHENTICATED USER:", req.user);

  try {
    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: 'READY_FOR_PICKUP',
        deliveryPartnerId: null,
      },
      data: {
        deliveryPartnerId,
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message:
          'Order is unavailable, already assigned, or not ready for pickup',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        deliveryAddress: true,
        deliveryPartnerId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery accepted successfully',
      order,
    });
  } catch (error) {
    console.error('Accept delivery error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to accept delivery',
    });
  }
};

export const pickupDelivery = async (req, res) => {
  const { orderId } = req.params;
  const deliveryPartnerId = req.user.userId;

  try {
    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        deliveryPartnerId,
        status: "READY_FOR_PICKUP",
      },
      data: {
        status: "PICKED_UP",
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Order cannot be picked up",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    return res.status(200).json({
      success: true,
      message: "Order picked up successfully",
      order,
    });
  }  catch (error) {
  console.error("PICKUP DELIVERY ERROR:", error);

  return res.status(500).json({
    success: false,
    message: "Failed to pick up order",
    error: error.message,
  });
}
};

export const startDelivery = async (req, res) => {
  const { orderId } = req.params;
  const deliveryPartnerId = req.user.userId;

  try {
    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        deliveryPartnerId,
        status: "PICKED_UP",
      },
      data: {
        status: "OUT_FOR_DELIVERY",
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Order cannot be marked as out for delivery",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    return res.status(200).json({
      success: true,
      message: "Order is now out for delivery",
      order,
    });
  } catch (error) {
    console.error("Start delivery error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start delivery",
    });
  }
};

export const completeDelivery = async (req, res) => {
  const { orderId } = req.params;
  const deliveryPartnerId = req.user.userId;

  try {
    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        deliveryPartnerId,
        status: "OUT_FOR_DELIVERY",
      },
      data: {
        status: "DELIVERED",
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Order cannot be marked as delivered",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    return res.status(200).json({
      success: true,
      message: "Order delivered successfully",
      order,
    });

  } catch (error) {
    console.error("Complete delivery error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete delivery",
    });
  }
};

