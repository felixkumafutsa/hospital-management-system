import { PrismaClient, LabCategory } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedLabTests() {
  console.log('🌱 Seeding lab tests...');

  // Clear existing lab tests
  await prisma.labTest.deleteMany({});

  const labTests = [
    // Hematology
    {
      name: 'Complete Blood Count (CBC)',
      code: 'LAB-CBC-001',
      category: LabCategory.HEMATOLOGY,
      unit: null,
      normalRange: 'WBC: 4-10, RBC: 4.5-5.5, Hb: 12-16',
      price: 15000.00,
      isActive: true
    },
    {
      name: 'Blood Glucose',
      code: 'LAB-BG-002',
      category: LabCategory.BIOCHEMISTRY,
      unit: 'mmol/L',
      normalRange: 'Fasting: 3.9-5.6, Random: <7.8',
      price: 5000.00,
      isActive: true
    },
    // Biochemistry
    {
      name: 'Liver Function Test',
      code: 'LAB-LFT-003',
      category: LabCategory.BIOCHEMISTRY,
      unit: null,
      normalRange: 'ALT: 7-56, AST: 10-40, ALP: 45-115',
      price: 25000.00,
      isActive: true
    },
    {
      name: 'Kidney Function Test',
      code: 'LAB-KFT-004',
      category: LabCategory.BIOCHEMISTRY,
      unit: null,
      normalRange: 'Creatinine: 60-110, Urea: 2.5-6.4',
      price: 20000.00,
      isActive: true
    },
    // HIV Test
    {
      name: 'HIV Rapid Test',
      code: 'LAB-HIV-005',
      category: LabCategory.HIV_TEST,
      unit: null,
      normalRange: 'Negative',
      price: 10000.00,
      isActive: true
    },
    // Malaria Test
    {
      name: 'Malaria Rapid Diagnostic Test',
      code: 'LAB-MAL-006',
      category: LabCategory.MICROBIOLOGY,
      unit: null,
      normalRange: 'Negative',
      price: 8000.00,
      isActive: true
    },
    // Urinalysis
    {
      name: 'Urinalysis',
      code: 'LAB-UA-007',
      category: LabCategory.URINALYSIS,
      unit: null,
      normalRange: 'Normal',
      price: 12000.00,
      isActive: true
    },
    // Pregnancy Test
    {
      name: 'Urine Pregnancy Test',
      code: 'LAB-PREG-008',
      category: LabCategory.PREGNANCY_TEST,
      unit: null,
      normalRange: 'Negative',
      price: 5000.00,
      isActive: true
    },
    // X-Ray
    {
      name: 'Chest X-Ray',
      code: 'LAB-CXR-009',
      category: LabCategory.IMAGING,
      unit: null,
      normalRange: 'Normal',
      price: 35000.00,
      isActive: true
    },
    // Ultrasound
    {
      name: 'Abdominal Ultrasound',
      code: 'LAB-US-010',
      category: LabCategory.IMAGING,
      unit: null,
      normalRange: 'Normal',
      price: 50000.00,
      isActive: true
    }
  ];

  for (const test of labTests) {
    await prisma.labTest.create({ data: test });
  }

  console.log(`✅ Created ${labTests.length} lab tests`);
}