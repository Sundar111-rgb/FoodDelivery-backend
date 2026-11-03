
import { PrismaClient, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

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


export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const allowedRoles = [
      'CUSTOMER',
      'RESTAURANT_OWNER',
      'DELIVERY_PARTNER',
      'ADMIN',
    ];

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      password.length < 8 ||
      !allowedRoles.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid name, email, password (minimum 8 characters), and role are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error('Create admin user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
};

export const getAdminRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            menuItems: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalRestaurants = restaurants.length;

    const activeRestaurants = restaurants.filter(
      (restaurant) => restaurant.isOpen
    ).length;

    const inactiveRestaurants = totalRestaurants - activeRestaurants;

    res.status(200).json({
      success: true,
      stats: {
        totalRestaurants,
        activeRestaurants,
        inactiveRestaurants,
      },
      restaurants,
    });
  } catch (error) {
    console.error('Get Admin Restaurants Error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants.',
    });
  }
};

// UPDATE RESTAURANT STATUS
export const updateRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen } = req.body;

    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isOpen must be true or false.',
      });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { isOpen },
    });

    return res.status(200).json({
      success: true,
      message: `Restaurant ${isOpen ? 'opened' : 'closed'} successfully.`,
      restaurant,
    });
  } catch (error) {
    console.error('Update Restaurant Status Error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update restaurant status.',
    });
  }
};

// CREATE RESTAURANT (ADMIN)
export const createAdminRestaurant = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      imageUrl,
      ownerId,
    } = req.body;

    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant name and address are required.',
      });
    }

    let owner = null;

    if (ownerId) {
      owner = await prisma.user.findUnique({
        where: { id: ownerId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!owner || owner.role !== 'RESTAURANT_OWNER') {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid restaurant owner.',
        });
      }
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address.trim(),
        imageUrl: imageUrl?.trim() || null,
        ownerId: ownerId || null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            menuItems: true,
            orders: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Restaurant created successfully.',
      restaurant,
    });
  } catch (error) {
    console.error('Create Admin Restaurant Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create restaurant.',
    });
  }
};


export const updateAdminRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      address,
      imageUrl,
      ownerId,
    } = req.body;

    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant name and address are required.',
      });
    }

    let owner = null;

    if (ownerId) {
      owner = await prisma.user.findUnique({
        where: { id: ownerId },
        select: {
          id: true,
          role: true,
        },
      });

      if (!owner || owner.role !== 'RESTAURANT_OWNER') {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid restaurant owner.',
        });
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address.trim(),
        imageUrl: imageUrl?.trim() || null,
        ownerId: ownerId || null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            menuItems: true,
            orders: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully.',
      restaurant,
    });
  } catch (error) {
    console.error('Update Admin Restaurant Error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update restaurant.',
    });
  }
};


export const getAdminOrders = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      readyForPickupOrders,
      pickedUpOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      orders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'PREPARING' } }),
      prisma.order.count({ where: { status: 'READY_FOR_PICKUP' } }),
      prisma.order.count({ where: { status: 'PICKED_UP' } }),
      prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),

      prisma.order.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          deliveryPartner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        preparingOrders,
        readyForPickupOrders,
        pickedUpOrders,
        outForDeliveryOrders,
        deliveredOrders,
        cancelledOrders,
      },
      orders,
    });
  } catch (error) {
    console.error('Get Admin Orders Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders.',
    });
  }
};

// GET ALL DELIVERY PARTNERS
export const getAdminDeliveryPartners = async (req, res) => {
  try {
    const [
      totalPartners,
      partners,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: 'DELIVERY_PARTNER',
        },
      }),

      prisma.user.findMany({
        where: {
          role: 'DELIVERY_PARTNER',
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          latitude: true,
          longitude: true,
          locationUpdatedAt: true,
          _count: {
            select: {
              deliveryOrders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalPartners,
      },
      partners,
    });
  } catch (error) {
    console.error('Get Admin Delivery Partners Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery partners.',
    });
  }
};




