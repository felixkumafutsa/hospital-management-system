import { PrismaClient } from '@prisma/client';
import { seedUsers } from './users';
import { seedPatients } from './patients';
import { seedLabTests } from './labTests';
import { seedSuppliersAndMedicines } from './medicines';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Seed users, roles, and permissions
    await seedUsers();
    
    // Seed patients
    await seedPatients();
    
    // Seed lab tests
    await seedLabTests();
    
    // Seed suppliers and medicines
    await seedSuppliersAndMedicines();
    
    console.log('✅ All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();