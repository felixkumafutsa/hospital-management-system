import { PrismaClient, BedStatus } from '@prisma/client';

const prisma = new PrismaClient();

const initialWards = [
  {
    name: 'General Medical Ward',
    department: 'Internal Medicine',
    totalBeds: 10,
    description: 'General inpatient care for adults',
  },
  {
    name: 'Surgical Ward',
    department: 'Surgery',
    totalBeds: 8,
    description: 'Post-operative and surgical inpatient care',
  },
  {
    name: 'Pediatric Ward',
    department: 'Pediatrics',
    totalBeds: 8,
    description: 'Inpatient care for infants and children',
  },
  {
    name: 'Maternity Ward',
    department: 'Obstetrics & Gynecology',
    totalBeds: 8,
    description: 'Labor, delivery, and postpartum inpatient care',
  },
  {
    name: 'Intensive Care Unit (ICU)',
    department: 'Critical Care',
    totalBeds: 4,
    description: 'High-dependency and critical care unit',
  },
];

export async function seedWardsAndBeds() {
  console.log('🛏️  Seeding wards and hospital beds...');

  for (const wardData of initialWards) {
    const ward = await prisma.ward.upsert({
      where: { name: wardData.name },
      update: {},
      create: wardData,
    });

    // Create beds for each ward
    for (let i = 1; i <= wardData.totalBeds; i++) {
      const bedNumber = `Bed ${i.toString().padStart(2, '0')}`;
      await prisma.bed.upsert({
        where: {
          wardId_bedNumber: {
            wardId: ward.id,
            bedNumber,
          },
        },
        update: {},
        create: {
          wardId: ward.id,
          bedNumber,
          status: BedStatus.AVAILABLE,
          isOccupied: false,
        },
      });
    }
  }

  console.log('✅ Wards and beds seeded successfully!');
}
