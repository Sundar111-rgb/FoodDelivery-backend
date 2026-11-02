
import prisma from '../config/prisma.js';

export async function getRestaurants(req, res) {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        isOpen: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        imageUrl: true,
        isOpen: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    console.error('Get restaurants error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch restaurants',
    });
  }
}


export async function getMyRestaurant(req, res) {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where:
        req.user.role === 'ADMIN'
          ? { ownerId: req.user.userId }
          : { ownerId: req.user.userId },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'No restaurant is assigned to your account',
      });
    }

    return res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.error('Get my restaurant error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve restaurant details',
    });
  }
}

export async function updateMyRestaurant(req, res) {
  try {
    const { name, description, address, imageUrl, isOpen } = req.body;

    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: req.user.userId },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'No restaurant is assigned to your account',
      });
    }

    const data = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name must be a non-empty string',
        });
      }

      data.name = name.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Description must be a string or null',
        });
      }

      data.description =
        typeof description === 'string' && description.trim()
          ? description.trim()
          : null;
    }

    if (address !== undefined) {
      if (typeof address !== 'string' || !address.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Address must be a non-empty string',
        });
      }

      data.address = address.trim();
    }

    if (imageUrl !== undefined) {
      if (imageUrl !== null && typeof imageUrl !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Image URL must be a string or null',
        });
      }

      data.imageUrl =
        typeof imageUrl === 'string' && imageUrl.trim()
          ? imageUrl.trim()
          : null;
    }

    if (isOpen !== undefined) {
      if (typeof isOpen !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isOpen must be true or false',
        });
      }

      data.isOpen = isOpen;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update',
      });
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    console.error('Update restaurant error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to update restaurant',
    });
  }
}


export async function getRestaurantDashboard(req, res) {
  try {
    // Find the restaurant belonging to the logged-in owner.
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        isOpen: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'No restaurant is assigned to your account',
      });
    }

    // Calculate the start of today using the server's local timezone.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalMenuItems,
      availableMenuItems,
      totalOrders,
      pendingOrders,
      todaysOrders,
      todaysSales,
    ] = await Promise.all([
      prisma.menuItem.count({
        where: {
          restaurantId: restaurant.id,
        },
      }),

      prisma.menuItem.count({
        where: {
          restaurantId: restaurant.id,
          isAvailable: true,
        },
      }),

      prisma.order.count({
        where: {
          restaurantId: restaurant.id,
        },
      }),

      prisma.order.count({
        where: {
          restaurantId: restaurant.id,
          status: 'PENDING',
        },
      }),

      prisma.order.count({
        where: {
          restaurantId: restaurant.id,
          createdAt: {
            gte: startOfToday,
          },
        },
      }),

      prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          createdAt: {
            gte: startOfToday,
          },
          status: {
            not: 'CANCELLED',
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        restaurant,
        stats: {
          totalMenuItems,
          availableMenuItems,
          totalOrders,
          pendingOrders,
          todaysOrders,
          todaysSales: Number(
            todaysSales._sum.totalAmount ?? 0
          ),
        },
      },
    });
  } catch (error) {
    console.error('Restaurant dashboard error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve restaurant dashboard',
    });
  }
}

