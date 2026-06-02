import { PrismaClient } from '@prisma/client';
import { seedUsers } from './users';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Seed users, roles, and permissions
    await seedUsers();
    
    // Add more seeders here as we create them
    // await seedICD10();
    // await seedLabTests();
    // await seedMedicines();
    // await seedSuppliers();
    // await seedPatients();
    
    console.log('✅ All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();