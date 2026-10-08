
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Find the new RECEPTION_CASHIER role
  const receptionCashierRole = await prisma.role.findUnique({
    where: { name: 'RECEPTION_CASHIER' },
  });

  if (!receptionCashierRole) {
    console.error('RECEPTION_CASHIER role not found. Please create it first.');
    return;
  }

  // 2. Find all users with the old RECEPTIONIST or CASHIER roles
  const usersToMigrate = await prisma.user.findMany({
    where: {
      OR: [
        { role: { name: 'RECEPTIONIST' } },
        { role: { name: 'CASHIER' } },
      ],
    },
  });

  // 3. Update each user's roleId
  for (const user of usersToMigrate) {
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: receptionCashierRole.id },
    });
    console.log(`Migrated user ${user.email} to RECEPTION_CASHIER role.`);
  }

  console.log('Role migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });