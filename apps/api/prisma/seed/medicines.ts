import { PrismaClient, DrugForm } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSuppliersAndMedicines() {
  console.log('🌱 Seeding suppliers and medicines...');

  // Clear existing data - correct order to respect foreign key constraints
  await prisma.medicineBatch.deleteMany({});
  await prisma.medicine.deleteMany({});
  await prisma.supplier.deleteMany({});

  // Create suppliers
  const suppliers = [
    {
      name: 'Medicines and Healthcare Products Regulatory Agency',
      contact: 'Dr. James Mwanza',
      phone: '+265999777888',
      email: 'mhpra@health.gov.mw',
      address: 'Ministry of Health, Lilongwe',
      isActive: true
    },
    {
      name: 'PharmaWorld Malawi Limited',
      contact: 'Grace Banda',
      phone: '+265999888999',
      email: 'info@pharmaworld.mw',
      address: 'Industrial Area, Blantyre',
      isActive: true
    },
    {
      name: 'African Medical Suppliers',
      contact: 'Peter Kumwenda',
      phone: '+265999666777',
      email: 'orders@africanmedicals.mw',
      address: 'Area 47, Lilongwe',
      isActive: true
    }
  ];

  const createdSuppliers = await Promise.all(
    suppliers.map(supplier => prisma.supplier.create({ data: supplier }))
  );

  console.log(`✅ Created ${createdSuppliers.length} suppliers`);

  // Create medicines
  const medicines = [
    {
      name: 'Paracetamol 500mg',
      genericName: 'Paracetamol',
      category: 'Analgesic',
      form: DrugForm.TABLET,
      strength: '500mg',
      unit: 'tablet',
      reorderLevel: 500,
      isActive: true
    },
    {
      name: 'Amoxicillin 250mg',
      genericName: 'Amoxicillin',
      category: 'Antibiotic',
      form: DrugForm.CAPSULE,
      strength: '250mg',
      unit: 'capsule',
      reorderLevel: 300,
      isActive: true
    },
    {
      name: 'Artemether-Lumefantrine 20/120mg',
      genericName: 'Artemether-Lumefantrine',
      category: 'Antimalarial',
      form: DrugForm.TABLET,
      strength: '20/120mg',
      unit: 'tablet',
      reorderLevel: 200,
      isActive: true
    },
    {
      name: 'Cough Syrup',
      genericName: 'Dextromethorphan',
      category: 'Cough Suppressant',
      form: DrugForm.SYRUP,
      strength: '15mg/5ml',
      unit: 'bottle',
      reorderLevel: 100,
      isActive: true
    },
    {
      name: 'Metformin 500mg',
      genericName: 'Metformin',
      category: 'Antidiabetic',
      form: DrugForm.TABLET,
      strength: '500mg',
      unit: 'tablet',
      reorderLevel: 150,
      isActive: true
    },
    {
      name: 'Atenolol 50mg',
      genericName: 'Atenolol',
      category: 'Antihypertensive',
      form: DrugForm.TABLET,
      strength: '50mg',
      unit: 'tablet',
      reorderLevel: 150,
      isActive: true
    },
    {
      name: 'Cetirizine 10mg',
      genericName: 'Cetirizine',
      category: 'Antihistamine',
      form: DrugForm.TABLET,
      strength: '10mg',
      unit: 'tablet',
      reorderLevel: 100,
      isActive: true
    },
    {
      name: 'Omeprazole 20mg',
      genericName: 'Omeprazole',
      category: 'Proton Pump Inhibitor',
      form: DrugForm.CAPSULE,
      strength: '20mg',
      unit: 'capsule',
      reorderLevel: 120,
      isActive: true
    }
  ];

  const createdMedicines = await Promise.all(
    medicines.map(medicine => prisma.medicine.create({ data: medicine }))
  );

  console.log(`✅ Created ${createdMedicines.length} medicines`);

  // Create medicine batches for the first supplier
  const firstSupplier = createdSuppliers[0];
  const batches = [];
  
  for (const medicine of createdMedicines.slice(0, 5)) {
    const initialQuantity = Math.floor(Math.random() * 500) + 100;
    batches.push({
      medicineId: medicine.id,
      supplierId: firstSupplier.id,
      batchNumber: `BATCH-${Math.floor(Math.random() * 90000) + 10000}`,
      quantity: initialQuantity,
      quantityLeft: initialQuantity,
      costPrice: Math.floor(Math.random() * 5000) + 1000,
      sellingPrice: Math.floor(Math.random() * 8000) + 2000,
      manufacturedAt: new Date('2025-01-01'),
      expiresAt: new Date('2027-01-01'),
      receivedAt: new Date('2025-06-01')
    });
  }

  for (const batch of batches) {
    await prisma.medicineBatch.create({ data: batch });
  }

  console.log(`✅ Created ${batches.length} medicine batches`);
}