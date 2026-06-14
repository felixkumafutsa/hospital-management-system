import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ==========================================
  // STEP 1: Create Roles and Permissions (Base tables - no foreign keys)
  // ==========================================
  console.log('\n📋 Creating roles and permissions...');
  
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'ADMINISTRATOR',
        displayName: 'Administrator',
      }
    }),
    prisma.role.create({
      data: {
        name: 'DOCTOR',
        displayName: 'Doctor',
      }
    }),
    prisma.role.create({
      data: {
        name: 'NURSE',
        displayName: 'Nurse',
      }
    }),
    prisma.role.create({
      data: {
        name: 'RECEPTIONIST',
        displayName: 'Receptionist',
      }
    }),
    prisma.role.create({
      data: {
        name: 'LAB_TECH',
        displayName: 'Laboratory Technician',
      }
    }),
    prisma.role.create({
      data: {
        name: 'PHARMACIST',
        displayName: 'Pharmacist',
      }
    }),
    prisma.role.create({
      data: {
        name: 'CASHIER',
        displayName: 'Cashier',
      }
    })
  ]);

  const [adminRole, doctorRole, nurseRole, _receptionistRole, labTechRole, _pharmacistRole, _cashierRole] = roles;
  console.log(`✅ Created ${roles.length} roles`);

  // ==========================================
  // STEP 2: Create Admin User
  // ==========================================
  console.log('\n👤 Creating admin user...');
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      staffId: 'BL-STF-001',
      email: 'admin@betterlifeclinic.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+265999123456',
      roleId: adminRole.id,
    }
  });

  const doctorUser = await prisma.user.create({
    data: {
      staffId: 'BL-STF-002',
      email: 'dr.john@betterlifeclinic.com',
      passwordHash: await bcrypt.hash('Doctor123!', 10),
      firstName: 'John',
      lastName: 'Doe',
      phone: '+265999123457',
      roleId: doctorRole.id,
    }
  });

  const nurseUser = await prisma.user.create({
    data: {
      staffId: 'BL-STF-003',
      email: 'nurse.jane@betterlifeclinic.com',
      passwordHash: await bcrypt.hash('Nurse123!', 10),
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+265999123458',
      roleId: nurseRole.id,
    }
  });

  const labTechUser = await prisma.user.create({
    data: {
      staffId: 'BL-STF-004',
      email: 'lab.peter@betterlifeclinic.com',
      passwordHash: await bcrypt.hash('Lab123!', 10),
      firstName: 'Peter',
      lastName: 'Kamau',
      phone: '+265999123459',
      roleId: labTechRole.id,
    }
  });

  const _pharmacistUser = await prisma.user.create({
    data: {
      staffId: 'BL-STF-005',
      email: 'pharma.mary@betterlifeclinic.com',
      passwordHash: await bcrypt.hash('Pharma123!', 10),
      firstName: 'Mary',
      lastName: 'Nkosi',
      phone: '+265999123460',
      roleId: _pharmacistRole.id,
    }
  });

  const _cashierUser = await prisma.user.create({
    data: {
      staffId: 'BL-STF-006',
      email: 'cashier.tom@betterlifeclinic.com',
      passwordHash: await bcrypt.hash('Cashier123!', 10),
      firstName: 'Tom',
      lastName: 'Chibowa',
      phone: '+265999123461',
      roleId: _cashierRole.id,
    }
  });

  console.log('✅ Created all staff users');

  // ==========================================
  // STEP 3: Create Wards and Beds
  // ==========================================
  console.log('\n🏥 Creating wards and beds...');
  
  const wards = await Promise.all([
    prisma.ward.create({
      data: {
        name: 'Medical Ward',
        department: 'Internal Medicine',
        totalBeds: 20,
        description: 'General medical ward for adult patients',
      }
    }),
    prisma.ward.create({
      data: {
        name: 'Maternity Ward',
        department: 'Obstetrics & Gynecology',
        totalBeds: 15,
        description: 'Maternity ward for antenatal and postnatal care',
      }
    }),
    prisma.ward.create({
      data: {
        name: 'ICU',
        department: 'Critical Care',
        totalBeds: 8,
        description: 'Intensive Care Unit for critical patients',
      }
    }),
    prisma.ward.create({
      data: {
        name: 'Pediatrics Ward',
        department: 'Pediatrics',
        totalBeds: 12,
        description: 'Pediatric ward for children',
      }
    }),
    prisma.ward.create({
      data: {
        name: 'Emergency Ward',
        department: 'Emergency Medicine',
        totalBeds: 10,
        description: 'Emergency department for acute care',
      }
    })
  ]);
  console.log(`✅ Created ${wards.length} wards`);

  // Create beds for Medical Ward
  const medicalWard = wards[0];
  for (let i = 1; i <= 5; i++) {
    await prisma.bed.create({
      data: {
        wardId: medicalWard.id,
        bedNumber: `MED-${i.toString().padStart(2, '0')}`,
        isOccupied: false,
      }
    });
  }

  // ==========================================
  // STEP 4: Create Suppliers
  // ==========================================
  console.log('\n🏪 Creating suppliers...');
  
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'MedSupply Malawi Ltd',
        contact: 'James Wilson',
        phone: '+265999888777',
        email: 'orders@medsupplymw.com',
        address: 'Area 25, Lilongwe',
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'PharmaDirect',
        contact: 'Sarah Johnson',
        phone: '+265888777666',
        email: 'supply@pharmadirect.com',
        address: 'Blantyre CBD, Blantyre',
      }
    })
  ]);
  console.log(`✅ Created ${suppliers.length} suppliers`);

  // ==========================================
  // STEP 5: Create Lab Tests
  // ==========================================
  console.log('\n🔬 Creating laboratory tests...');
  
  const labTests = await Promise.all([
    prisma.labTest.create({
      data: {
        name: 'Full Blood Count',
        code: 'FBC001',
        category: 'HEMATOLOGY',
        unit: 'x10^9/L',
        normalRange: '4.5-11.0',
        price: 5000.00,
      }
    }),
    prisma.labTest.create({
      data: {
        name: 'HIV Test',
        code: 'HIV001',
        category: 'HIV_TEST',
        normalRange: 'Negative',
        price: 3000.00,
      }
    }),
    prisma.labTest.create({
      data: {
        name: 'Malaria Smear',
        code: 'MAL001',
        category: 'MICROBIOLOGY',
        normalRange: 'Negative',
        price: 3500.00,
      }
    }),
    prisma.labTest.create({
      data: {
        name: 'Urinalysis',
        code: 'URINE001',
        category: 'URINALYSIS',
        normalRange: 'Normal',
        price: 4000.00,
      }
    }),
    prisma.labTest.create({
      data: {
        name: 'Blood Glucose (Fasting)',
        code: 'GLUCOSE001',
        category: 'BIOCHEMISTRY',
        unit: 'mmol/L',
        normalRange: '4.0-5.6',
        price: 2500.00,
      }
    }),
    prisma.labTest.create({
      data: {
        name: 'Chest X-Ray',
        code: 'XRAY001',
        category: 'IMAGING',
        price: 15000.00,
      }
    })
  ]);
  console.log(`✅ Created ${labTests.length} lab tests`);

  // ==========================================
  // STEP 6: Create Medicines
  // ==========================================
  console.log('\n💊 Creating medicines...');
  
  const medicines = await Promise.all([
    prisma.medicine.create({
      data: {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        category: 'Analgesic',
        form: 'TABLET',
        strength: '500mg',
        unit: 'Tablet',
        reorderLevel: 50,
      }
    }),
    prisma.medicine.create({
      data: {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        category: 'Antibiotic',
        form: 'CAPSULE',
        strength: '250mg',
        unit: 'Capsule',
        reorderLevel: 30,
      }
    }),
    prisma.medicine.create({
      data: {
        name: 'Artemether-Lumefantrine',
        genericName: 'Coartem',
        category: 'Antimalarial',
        form: 'TABLET',
        strength: '20mg/120mg',
        unit: 'Tablet',
        reorderLevel: 40,
      }
    }),
    prisma.medicine.create({
      data: {
        name: 'Cetirizine',
        genericName: 'Cetirizine Hydrochloride',
        category: 'Antihistamine',
        form: 'TABLET',
        strength: '10mg',
        unit: 'Tablet',
        reorderLevel: 25,
      }
    }),
    prisma.medicine.create({
      data: {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        category: 'Proton Pump Inhibitor',
        form: 'CAPSULE',
        strength: '20mg',
        unit: 'Capsule',
        reorderLevel: 30,
      }
    })
  ]);
  console.log(`✅ Created ${medicines.length} medicines`);

  // Create medicine batches
  const [medSupply, pharmaDirect] = suppliers;
  const [paracetamol, amoxicillin, artemether] = medicines;
  
  await prisma.medicineBatch.create({
    data: {
      medicineId: paracetamol.id,
      supplierId: medSupply.id,
      batchNumber: 'BATCH-PARA-2026-001',
      quantity: 500,
      quantityLeft: 500,
      costPrice: 10.00,
      sellingPrice: 50.00,
      manufacturedAt: new Date('2026-01-01'),
      expiresAt: new Date('2028-01-01'),
    }
  });

  await prisma.medicineBatch.create({
    data: {
      medicineId: amoxicillin.id,
      supplierId: pharmaDirect.id,
      batchNumber: 'BATCH-AMOX-2026-001',
      quantity: 300,
      quantityLeft: 300,
      costPrice: 25.00,
      sellingPrice: 100.00,
      manufacturedAt: new Date('2026-02-01'),
      expiresAt: new Date('2028-02-01'),
    }
  });

  await prisma.medicineBatch.create({
    data: {
      medicineId: artemether.id,
      supplierId: medSupply.id,
      batchNumber: 'BATCH-COART-2026-001',
      quantity: 200,
      quantityLeft: 200,
      costPrice: 150.00,
      sellingPrice: 500.00,
      manufacturedAt: new Date('2026-01-15'),
      expiresAt: new Date('2028-01-15'),
    }
  });
  console.log('✅ Created medicine batches');

  // ==========================================
  // STEP 7: Create Patients
  // ==========================================
  console.log('\n👥 Creating patients...');
  
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        patientNumber: 'BL-2026-000001',
        nationalId: '991234567',
        firstName: 'Thomas',
        lastName: 'Banda',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'MALE',
        phone: '+265999111222',
        email: 'thomas.banda@email.com',
        address: 'Area 10, Lilongwe',
        nextOfKinName: 'Mary Banda',
        nextOfKinPhone: '+265999111223',
        nextOfKinRelation: 'Spouse',
        bloodGroup: 'O+',
        allergies: ['Penicillin'],
        insuranceProvider: 'Medical Aid Society',
        insuranceNumber: 'MAS-12345',
      }
    }),
    prisma.patient.create({
      data: {
        patientNumber: 'BL-2026-000002',
        nationalId: '987654321',
        firstName: 'Alice',
        lastName: 'Mteza',
        dateOfBirth: new Date('1992-11-23'),
        gender: 'FEMALE',
        phone: '+265999333444',
        email: 'alice.mteza@email.com',
        address: 'Area 2, Lilongwe',
        nextOfKinName: 'James Mteza',
        nextOfKinPhone: '+265999333445',
        nextOfKinRelation: 'Husband',
        bloodGroup: 'A+',
        allergies: [],
      }
    }),
    prisma.patient.create({
      data: {
        patientNumber: 'BL-2026-000003',
        nationalId: '976543210',
        firstName: 'David',
        lastName: 'Phiri',
        dateOfBirth: new Date('1978-08-10'),
        gender: 'MALE',
        phone: '+265999555666',
        email: 'david.phiri@email.com',
        address: 'Kawale, Lilongwe',
        nextOfKinName: 'Ruth Phiri',
        nextOfKinPhone: '+265999555667',
        nextOfKinRelation: 'Wife',
        bloodGroup: 'B+',
        allergies: ['Sulfa drugs'],
      }
    })
  ]);
  console.log(`✅ Created ${patients.length} patients`);

  // ==========================================
  // STEP 8: Create Appointments
  // ==========================================
  console.log('\n📅 Creating appointments...');
  
  const [patient1, patient2, patient3] = patients;
  
  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctorUser.id,
      appointmentDate: new Date('2026-06-15'),
      startTime: '09:00',
      endTime: '09:30',
      status: 'SCHEDULED',
      type: 'General Checkup',
      notes: 'Follow-up appointment for hypertension',
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctorUser.id,
      appointmentDate: new Date('2026-06-15'),
      startTime: '10:00',
      endTime: '10:30',
      status: 'CONFIRMED',
      type: 'Antenatal Care',
      notes: 'Pregnancy checkup - 24 weeks',
    }
  });
  console.log('✅ Created appointments');

  // ==========================================
  // STEP 9: Create Visits (active patient visits)
  // ==========================================
  console.log('\n🏥 Creating patient visits...');
  
  const visit1 = await prisma.visit.create({
    data: {
      patientId: patient3.id,
      visitDate: new Date(),
      visitType: 'OUTPATIENT',
      status: 'WAITING_FOR_CONSULTATION',
      referralNote: 'Self-referred with fever and cough',
      createdBy: adminUser.id,
    }
  });

  const _visit2 = await prisma.visit.create({
    data: {
      patientId: patient1.id,
      visitDate: new Date(Date.now() - 86400000), // yesterday
      visitType: 'INPATIENT',
      status: 'ADMITTED',
      admissionDate: new Date(Date.now() - 86400000),
      ward: 'Medical Ward',
      bedNumber: 'MED-01',
      attendingDoctorId: doctorUser.id,
      expectedDischargeDate: new Date(Date.now() + 259200000), // 3 days from now
      dailyRate: 15000.00,
      createdBy: adminUser.id,
    }
  });
  console.log('✅ Created patient visits');

  // ==========================================
  // STEP 10: Create Vitals for current visit
  // ==========================================
  await prisma.vital.create({
    data: {
      visitId: visit1.id,
      recordedBy: nurseUser.id,
      recordedAt: new Date(),
      weightKg: 72.5,
      heightCm: 175.0,
      bmi: 23.7,
      bpSystolic: 130,
      bpDiastolic: 85,
      pulseRate: 88,
      respiratoryRate: 18,
      temperatureC: 38.5,
      oxygenSaturation: 96,
      notes: 'Patient presents with fever, needs investigation',
    }
  });
  console.log('✅ Created vitals records');

  // ==========================================
  // STEP 11: Create ANC Record for the pregnant patient
  // ==========================================
  await prisma.ancRecord.create({
    data: {
      patientId: patient2.id,
      gestationWeeks: 24,
      visitDate: new Date(Date.now() - 604800000), // 1 week ago
      recordedBy: doctorUser.id,
      weightKg: 68.0,
      bpSystolic: 115,
      bpDiastolic: 75,
      fetalHeartRate: 145,
      fundusHeight: 24.0,
      riskFactors: [],
      notes: 'Pregnancy progressing normally',
      nextVisitDate: new Date(Date.now() + 604800000), // 1 week from now
    }
  });
  console.log('✅ Created ANC record');

  // ==========================================
  // STEP 12: Create Staff Schedules (skipped - run migration first to add startTime/endTime columns)
  // ==========================================
  console.log('\n📋 Skipping staff schedules - run prisma migrate dev to add missing columns');

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Created:');
  console.log(`   • ${roles.length} roles`);
  console.log(`   • 6 staff users (Admin, Doctor, Nurse, Lab Tech, Pharmacist, Cashier)`);
  console.log(`   • ${wards.length} wards`);
  console.log(`   • ${suppliers.length} suppliers`);
  console.log(`   • ${labTests.length} laboratory tests`);
  console.log(`   • ${medicines.length} medicines`);
  console.log(`   • ${patients.length} patients`);
  console.log('\n🔑 Default login credentials:');
  console.log('   • Admin: admin@betterlifeclinic.com / Admin123!');
  console.log('   • Doctor: dr.john@betterlifeclinic.com / Doctor123!');
  console.log('   • Nurse: nurse.jane@betterlifeclinic.com / Nurse123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });