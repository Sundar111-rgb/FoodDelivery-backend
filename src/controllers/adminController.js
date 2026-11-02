
import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalRestaurants,
      totalOrders,
      totalDeliveryPartners,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),

      prisma.restaurant.count(),

      prisma.order.count(),

      prisma.user.count({
        where: { role: 'DELIVERY_PARTNER' },
      }),

      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: {
            not: OrderStatus.CANCELLED,
          },
        },
      }),

      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
          restaurant: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalRestaurants,
        totalOrders,
        totalDeliveryPartners,
        totalRevenue: Number(
          revenueResult._sum.totalAmount || 0
        ),
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data',
    });
  }
};


export const getAdminUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const [
      totalUsers,
      totalCustomers,
      totalRestaurantOwners,
      totalDeliveryPartners,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      prisma.user.count({
        where: { role: 'RESTAURANT_OWNER' },
      }),
      prisma.user.count({
        where: { role: 'DELIVERY_PARTNER' },
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCustomers,
        totalRestaurantOwners,
        totalDeliveryPartners,
      },
      users,
    });
  } catch (error) {
    console.error('Admin users error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

