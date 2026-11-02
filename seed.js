
import 'dotenv/config';
import prisma from './src/config/prisma.js';

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: {
      id: '11111111-1111-4111-8111-111111111111',
    },
    update: {},
    create: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Spice Garden',
      description: 'Indian cuisine, biryani and fresh meals',
      address: 'Patna, Bihar, India',
      imageUrl: null,
      isOpen: true,
    },
  });

  console.log('Restaurant created or already exists:', restaurant.name);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
