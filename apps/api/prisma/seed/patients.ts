import { PrismaClient, Gender } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPatients() {
  console.log('🌱 Seeding patients...');

  // Clear existing patients
  await prisma.patient.deleteMany({});

  const patients = [
    {
      patientNumber: 'BL-2025-000001',
      nationalId: '880101001',
      firstName: 'Temwani',
      lastName: 'Chirwa',
      dateOfBirth: new Date('1990-03-15'),
      gender: Gender.FEMALE,
      phone: '+265999111222',
      email: 'temwani.chirwa@email.com',
      address: '123 Main Street, Blantyre',
      nextOfKinName: 'John Chirwa',
      nextOfKinPhone: '+265999111223',
      nextOfKinRelation: 'Husband',
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
      insuranceProvider: 'MACRA',
      insuranceNumber: 'MAC-001234',
      isActive: true
    },
    {
      patientNumber: 'BL-2025-000002',
      nationalId: '850520002',
      firstName: 'Gift',
      lastName: 'Mbewe',
      dateOfBirth: new Date('1985-05-20'),
      gender: Gender.MALE,
      phone: '+265999222333',
      email: 'gift.mbewe@email.com',
      address: '456 Oak Avenue, Lilongwe',
      nextOfKinName: 'Mary Mbewe',
      nextOfKinPhone: '+265999222334',
      nextOfKinRelation: 'Wife',
      bloodGroup: 'A+',
      allergies: [],
      insuranceProvider: null,
      insuranceNumber: null,
      isActive: true
    },
    {
      patientNumber: 'BL-2025-000003',
      nationalId: '951110003',
      firstName: 'Chikondi',
      lastName: 'Banda',
      dateOfBirth: new Date('1995-11-10'),
      gender: Gender.FEMALE,
      phone: '+265999333444',
      email: 'chikondi.banda@email.com',
      address: '789 Pine Road, Zomba',
      nextOfKinName: 'David Banda',
      nextOfKinPhone: '+265999333445',
      nextOfKinRelation: 'Father',
      bloodGroup: 'B+',
      allergies: ['Aspirin'],
      insuranceProvider: 'FMLM',
      insuranceNumber: 'FML-005678',
      isActive: true
    },
    {
      patientNumber: 'BL-2025-000004',
      nationalId: '800805004',
      firstName: 'Peter',
      lastName: 'Kumwenda',
      dateOfBirth: new Date('1980-08-05'),
      gender: Gender.MALE,
      phone: '+265999444555',
      email: 'peter.kumwenda@email.com',
      address: '321 Cedar Street, Mzuzu',
      nextOfKinName: 'Anna Kumwenda',
      nextOfKinPhone: '+265999444556',
      nextOfKinRelation: 'Spouse',
      bloodGroup: 'AB+',
      allergies: [],
      insuranceProvider: 'MACRA',
      insuranceNumber: 'MAC-009876',
      isActive: true
    },
    {
      patientNumber: 'BL-2025-000005',
      nationalId: '920228005',
      firstName: 'Eva',
      lastName: 'Phiri',
      dateOfBirth: new Date('1992-02-28'),
      gender: Gender.FEMALE,
      phone: '+265999555666',
      email: 'eva.phiri@email.com',
      address: '654 Maple Avenue, Blantyre',
      nextOfKinName: 'James Phiri',
      nextOfKinPhone: '+265999555667',
      nextOfKinRelation: 'Brother',
      bloodGroup: 'O-',
      allergies: ['Sulfa drugs'],
      insuranceProvider: null,
      insuranceNumber: null,
      isActive: true
    }
  ];

  for (const patient of patients) {
    await prisma.patient.create({ data: patient });
  }

  console.log(`✅ Created ${patients.length} patients`);
}