import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const cesareanSection = await prisma.procedureCatalog.upsert({
    where: { name: 'Cesarean Section' },
    update: {},
    create: {
      name: 'Cesarean Section',
      description: 'Surgical procedure to deliver a baby through an incision in the abdomen and uterus.',
      isMaternityDelivery: true,
      requiresAnesthesia: true,
      isActive: true,
    },
  });

  console.log({ cesareanSection });
  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });