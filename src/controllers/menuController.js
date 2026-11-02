
import prisma from '../config/prisma.js';

export async function getRestaurantMenu(req, res) {
  try {
    const { restaurantId } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
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
        message: 'Restaurant not found',
      });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId,
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        isAvailable: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      restaurant,
      count: menuItems.length,
      data: menuItems,
    });
  } catch (error) {
    console.error('Get restaurant menu error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch restaurant menu',
    });
  }
}


export async function createMenuItem(req, res) {
  try {
    const { restaurantId } = req.params;
    const { name, description, price, imageUrl } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      price === undefined ||
      price === null ||
      price === '' ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid name and positive price are required',
      });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Restaurant owners can manage only their own restaurants.
    // Admins can manage any restaurant.
    if (
      req.user.role === 'RESTAURANT_OWNER' &&
      restaurant.ownerId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can manage menus only for your own restaurant',
      });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        description:
          typeof description === 'string' ? description.trim() : null,
        price: Number(price),
        imageUrl:
          typeof imageUrl === 'string' && imageUrl.trim()
            ? imageUrl.trim()
            : null,
        restaurantId,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      menuItem,
    });
  } catch (error) {
    console.error('Create menu item error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to create menu item',
    });
  }
}


export async function updateMenuItem(req, res) {
  try {
    const { restaurantId, menuItemId } = req.params;
    const { name, description, price, imageUrl, isAvailable } = req.body;

    // Find the menu item and verify its restaurant.
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurantId,
      },
      include: {
        restaurant: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found in this restaurant',
      });
    }

    // Restaurant owners can edit only their own restaurant's items.
    // Admins can edit items for any restaurant.
    if (
      req.user.role === 'RESTAURANT_OWNER' &&
      existingItem.restaurant.ownerId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can edit menu items only for your own restaurant',
      });
    }

    // Build the update object using only fields provided by the client.
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

    if (price !== undefined) {
      if (
        price === null ||
        price === '' ||
        !Number.isFinite(Number(price)) ||
        Number(price) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a positive number',
        });
      }

      data.price = Number(price);
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

    if (isAvailable !== undefined) {
      if (typeof isAvailable !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isAvailable must be true or false',
        });
      }

      data.isAvailable = isAvailable;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update',
      });
    }

    const updatedItem = await prisma.menuItem.update({
      where: {
        id: existingItem.id,
      },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem: updatedItem,
    });
  } catch (error) {
    console.error('Update menu item error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to update menu item',
    });
  }
}


export async function deleteMenuItem(req, res) {
  try {
    const { restaurantId, menuItemId } = req.params;

    // Find the menu item within the specified restaurant.
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurantId,
      },
      include: {
        restaurant: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found in this restaurant',
      });
    }

    // Owners can delete items only from their own restaurants.
    // Admins can delete items from any restaurant.
    if (
      req.user.role === 'RESTAURANT_OWNER' &&
      existingItem.restaurant.ownerId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can delete menu items only for your own restaurant',
      });
    }

    await prisma.menuItem.delete({
      where: {
        id: existingItem.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      deletedMenuItem: {
        id: existingItem.id,
        name: existingItem.name,
        restaurantId,
      },
    });
  } catch (error) {
    console.error('Delete menu item error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to delete menu item',
    });
  }
}



