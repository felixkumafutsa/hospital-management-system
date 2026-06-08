import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define roles
const roles = [
  { name: 'ADMINISTRATOR', displayName: 'Administrator' },
  { name: 'RECEPTIONIST', displayName: 'Receptionist' },
  { name: 'NURSE', displayName: 'Nurse' },
  { name: 'DOCTOR', displayName: 'Doctor' },
  { name: 'LAB_TECH', displayName: 'Laboratory Technician' },
  { name: 'PHARMACIST', displayName: 'Pharmacist' },
  { name: 'CASHIER', displayName: 'Cashier' },
  { name: 'MD', displayName: 'Medical Director' },
];

// Define permissions according to the matrix
const permissions = [
  // User management
  { action: 'MANAGE_USERS', resource: 'users', roles: ['ADMINISTRATOR'] },
  
  // Patient management
  { action: 'REGISTER_PATIENT', resource: 'patients', roles: ['ADMINISTRATOR', 'RECEPTIONIST'] },
  { action: 'VIEW_ALL_PATIENTS', resource: 'patients', roles: ['ADMINISTRATOR', 'RECEPTIONIST', 'NURSE', 'DOCTOR', 'MD'] },
  
  // Clinical workflows
  { action: 'RECORD_VITALS', resource: 'vitals', roles: ['ADMINISTRATOR', 'NURSE', 'DOCTOR'] },
  { action: 'CONSULT_DIAGNOSE', resource: 'consultations', roles: ['ADMINISTRATOR', 'DOCTOR'] },
  
  // Laboratory
  { action: 'REQUEST_LAB_TESTS', resource: 'lab', roles: ['ADMINISTRATOR', 'DOCTOR'] },
  { action: 'ENTER_LAB_RESULTS', resource: 'lab', roles: ['ADMINISTRATOR', 'LAB_TECH'] },
  { action: 'REVIEW_LAB_RESULTS', resource: 'lab', roles: ['ADMINISTRATOR', 'DOCTOR'] },
  
  // Pharmacy
  { action: 'PRESCRIBE', resource: 'pharmacy', roles: ['ADMINISTRATOR', 'DOCTOR'] },
  { action: 'DISPENSE_MEDICINE', resource: 'pharmacy', roles: ['ADMINISTRATOR', 'PHARMACIST'] },
  { action: 'MANAGE_INVENTORY', resource: 'inventory', roles: ['ADMINISTRATOR', 'PHARMACIST'] },
  
  // Billing
  { action: 'CREATE_INVOICE', resource: 'billing', roles: ['ADMINISTRATOR', 'CASHIER'] },
  { action: 'PROCESS_PAYMENT', resource: 'billing', roles: ['ADMINISTRATOR', 'CASHIER'] },
  
  // OB/GYN
  { action: 'MANAGE_OBGYN_RECORDS', resource: 'obgyn', roles: ['ADMINISTRATOR', 'NURSE', 'DOCTOR'] },
  
  // Reports
  { action: 'VIEW_REPORTS', resource: 'reports', roles: ['ADMINISTRATOR', 'CASHIER', 'MD'] },
  { action: 'VIEW_EXECUTIVE_REPORTS', resource: 'reports', roles: ['ADMINISTRATOR', 'MD'] },
  { action: 'VIEW_AUDIT_LOGS', resource: 'audit', roles: ['ADMINISTRATOR', 'MD'] },
];

// Create admin user
const adminUser = {
  staffId: 'BL-STF-001',
  email: 'admin@betterlifeclinic.mw',
  firstName: 'System',
  lastName: 'Administrator',
  phone: '+265999123456',
  isActive: true,
};

// Create additional doctors as specified
const additionalDoctors = [
  {
    staffId: 'BL-STF-005',
    email: 'chisomo.banda@betterlifeclinic.mw',
    firstName: 'Chisomo',
    lastName: 'Banda',
    phone: '+265999123457',
    isActive: true,
  },
  {
    staffId: 'BL-STF-006',
    email: 'evelyn.phiri@betterlifeclinic.mw',
    firstName: 'Evelyn',
    lastName: 'Phiri',
    phone: '+265999123458',
    isActive: true,
  },
  {
    staffId: 'BL-STF-007',
    email: 'james.nkosi@betterlifeclinic.mw',
    firstName: 'James',
    lastName: 'Nkosi',
    phone: '+265999123459',
    isActive: true,
  },
];

export async function seedUsers() {
  console.log('🌱 Seeding users, roles and permissions...');

  // Clear existing data - correct order to respect foreign key constraints
  await prisma.user.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});

  // Create roles
  const createdRoles = await Promise.all(
    roles.map(role => 
      prisma.role.create({ data: role })
    )
  );

  console.log(`✅ Created ${createdRoles.length} roles`);

  // Create permissions and assign to roles
  for (const perm of permissions) {
    const rolesToAssign = createdRoles.filter(r => perm.roles.includes(r.name));
    
    await prisma.permission.create({
      data: {
        action: perm.action,
        resource: perm.resource,
        roles: {
          connect: rolesToAssign.map(r => ({ id: r.id })),
        },
      },
    });
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  // Hash password for admin
  const saltRounds = 12;
  const adminPassword = await bcrypt.hash('Admin123!', saltRounds);

  // Find admin role
  const adminRole = createdRoles.find(r => r.name === 'ADMINISTRATOR');
  
  if (!adminRole) {
    throw new Error('Admin role not found');
  }

  // Create admin user
  await prisma.user.create({
    data: {
      ...adminUser,
      passwordHash: adminPassword,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Created admin user');

  // Create additional doctors
  const doctorRole = createdRoles.find(r => r.name === 'DOCTOR');
  
  if (!doctorRole) {
    throw new Error('Doctor role not found');
  }

  const doctorPassword = await bcrypt.hash('Doctor123!', saltRounds);

  for (const doctor of additionalDoctors) {
    await prisma.user.create({
      data: {
        ...doctor,
        passwordHash: doctorPassword,
        roleId: doctorRole.id,
      },
    });
  }

  console.log(`✅ Created ${additionalDoctors.length} additional doctors`);
  
  // Create one user for each other role
  const usersToCreate = [
    { roleName: 'RECEPTIONIST', email: 'reception@betterlifeclinic.mw', firstName: 'Mary', lastName: 'Chirwa', staffId: 'BL-STF-002' },
    { roleName: 'NURSE', email: 'nurse@betterlifeclinic.mw', firstName: 'Anna', lastName: 'Mbewe', staffId: 'BL-STF-003' },
    { roleName: 'LAB_TECH', email: 'labtech@betterlifeclinic.mw', firstName: 'Peter', lastName: 'Kumwenda', staffId: 'BL-STF-004' },
    { roleName: 'PHARMACIST', email: 'pharmacist@betterlifeclinic.mw', firstName: 'Grace', lastName: 'Banda', staffId: 'BL-STF-008' },
    { roleName: 'CASHIER', email: 'cashier@betterlifeclinic.mw', firstName: 'John', lastName: 'Phiri', staffId: 'BL-STF-009' },
    { roleName: 'MD', email: 'medicaldirector@betterlifeclinic.mw', firstName: 'David', lastName: 'Mwanza', staffId: 'BL-STF-010' },
  ];

  const defaultPassword = await bcrypt.hash('Password123!', saltRounds);

  for (const userData of usersToCreate) {
    const role = createdRoles.find(r => r.name === userData.roleName);
    if (role) {
      await prisma.user.create({
        data: {
          staffId: userData.staffId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          passwordHash: defaultPassword,
          isActive: true,
          roleId: role.id,
        },
      });
      console.log(`✅ Created ${userData.roleName} user`);
    }
  }

  console.log('🌱 Users, roles and permissions seeding completed!');
}