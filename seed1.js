
import 'dotenv/config';
import prisma from './src/config/prisma.js';

async function main() {
  const restaurantId = '11111111-1111-4111-8111-111111111111';

  await prisma.restaurant.upsert({
    where: { id: restaurantId },
    update: {},
    create: {
      id: restaurantId,
      name: 'Spice Garden',
      description: 'Indian cuisine, biryani and fresh meals',
      address: 'Patna, Bihar, India',
      isOpen: true,
    },
  });

  const menuItems = [
    {
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice with chicken and spices',
      price: '249.00',
    },
    {
      name: 'Paneer Butter Masala',
      description: 'Paneer cooked in a creamy tomato gravy',
      price: '199.00',
    },
    {
      name: 'Veg Fried Rice',
      description: 'Fried rice with fresh vegetables',
      price: '149.00',
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: {
        id: item.name === 'Chicken Biryani'
          ? '22222222-2222-4222-8222-222222222221'
          : item.name === 'Paneer Butter Masala'
            ? '22222222-2222-4222-8222-222222222222'
            : '22222222-2222-4222-8222-222222222223',
      },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
      },
      create: {
        id: item.name === 'Chicken Biryani'
          ? '22222222-2222-4222-8222-222222222221'
          : item.name === 'Paneer Butter Masala'
            ? '22222222-2222-4222-8222-222222222222'
            : '22222222-2222-4222-8222-222222222223',
        ...item,
        restaurantId,
      },
    });
  }

  console.log('Spice Garden and 3 menu items are ready.');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
