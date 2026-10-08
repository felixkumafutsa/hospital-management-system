import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { createInterface } from 'readline/promises';

const prisma = new PrismaClient();

const roles = [
  { name: 'ADMINISTRATOR', displayName: 'Administrator' },
  { name: 'RECEPTION_CASHIER', displayName: 'Reception & Cashier (combined role)' },
  { name: 'NURSE', displayName: 'Nurse' },
  { name: 'DOCTOR', displayName: 'Doctor' },
  { name: 'ANESTHETIST', displayName: 'Anesthetist' },
  { name: 'LAB_TECH', displayName: 'Laboratory Technician' },
  { name: 'PHARMACIST', displayName: 'Pharmacist' },
  { name: 'MD', displayName: 'Medical Director' },
];

const permissions = [
  { action: 'MANAGE_USERS', resource: 'users', roles: ['ADMINISTRATOR'] },
  { action: 'REGISTER_PATIENT', resource: 'patients', roles: ['ADMINISTRATOR', 'RECEPTION_CASHIER'] },
  { action: 'VIEW_ALL_PATIENTS', resource: 'patients', roles: ['ADMINISTRATOR', 'RECEPTION_CASHIER', 'NURSE', 'DOCTOR', 'MD'] },
  { action: 'RECORD_VITALS', resource: 'vitals', roles: ['ADMINISTRATOR', 'NURSE', 'DOCTOR'] },
  { action: 'CONSULT_DIAGNOSE', resource: 'consultations', roles: ['ADMINISTRATOR', 'DOCTOR'] },
  { action: 'REQUEST_LAB_TESTS', resource: 'lab', roles: ['ADMINISTRATOR', 'DOCTOR'] },
  { action: 'ENTER_LAB_RESULTS', resource: 'lab', roles: ['ADMINISTRATOR', 'LAB_TECH'] },
  { action: 'REVIEW_LAB_RESULTS', resource: 'lab', roles: ['ADMINISTRATOR', 'DOCTOR'] },
  { action: 'PRESCRIBE', resource: 'pharmacy', roles: ['ADMINISTRATOR', 'DOCTOR'] },
  { action: 'DISPENSE_MEDICINE', resource: 'pharmacy', roles: ['ADMINISTRATOR', 'PHARMACIST'] },
  { action: 'MANAGE_INVENTORY', resource: 'inventory', roles: ['ADMINISTRATOR', 'PHARMACIST'] },
  { action: 'CREATE_INVOICE', resource: 'billing', roles: ['ADMINISTRATOR', 'RECEPTION_CASHIER'] },
  { action: 'PROCESS_PAYMENT', resource: 'billing', roles: ['ADMINISTRATOR', 'RECEPTION_CASHIER'] },
  { action: 'MANAGE_OBGYN_RECORDS', resource: 'obgyn', roles: ['ADMINISTRATOR', 'NURSE', 'DOCTOR'] },
  { action: 'MANAGE_THEATER', resource: 'theater', roles: ['ADMINISTRATOR', 'DOCTOR', 'NURSE', 'ANESTHETIST'] },
  { action: 'VIEW_REPORTS', resource: 'reports', roles: ['ADMINISTRATOR', 'RECEPTION_CASHIER', 'MD'] },
  { action: 'VIEW_EXECUTIVE_REPORTS', resource: 'reports', roles: ['ADMINISTRATOR', 'MD'] },
  { action: 'VIEW_AUDIT_LOGS', resource: 'audit', roles: ['ADMINISTRATOR', 'MD'] },
];

const askText = async (question: string): Promise<string> => {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await prompt.question(question)).trim();
  } finally {
    prompt.close();
  }
};

const askSecret = (question: string): Promise<string> => new Promise((resolve, reject) => {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    reject(new Error('Run this one-time setup from an interactive terminal.'));
    return;
  }

  let value = '';
  const finish = (error?: Error) => {
    input.removeListener('data', onData);
    input.setRawMode(false);
    input.pause();
    process.stdout.write('\n');
    if (error) reject(error);
    else resolve(value);
  };
  const onData = (buffer: Buffer) => {
    for (const character of buffer.toString('utf8')) {
      if (character === '\u0003') {
        finish(new Error('Setup cancelled.'));
        return;
      }
      if (character === '\r' || character === '\n') {
        finish();
        return;
      }
      if (character === '\u007f' || character === '\b') {
        value = value.slice(0, -1);
        process.stdout.write('\b \b');
      } else if (character >= ' ') {
        value += character;
        process.stdout.write('*');
      }
    }
  };

  process.stdout.write(question);
  input.setRawMode(true);
  input.resume();
  input.on('data', onData);
});

const main = async (): Promise<void> => {
  const activeAdministratorCount = await prisma.user.count({
    where: { isActive: true, role: { name: 'ADMINISTRATOR' } },
  });
  if (activeAdministratorCount > 0) {
    throw new Error('An active administrator already exists. Bootstrap is only for a new installation.');
  }

  const email = (await askText('Administrator email: ')).toLowerCase();
  const staffId = (await askText('Administrator staff ID: ')).toUpperCase();
  const firstName = await askText('First name: ');
  const lastName = await askText('Last name: ');
  if (!email || !staffId || !firstName || !lastName) {
    throw new Error('Email, staff ID, first name, and last name are required.');
  }

  const password = await askSecret('Administrator password (minimum 12 characters): ');
  const passwordConfirmation = await askSecret('Confirm administrator password: ');
  if (password.length < 12 || password !== passwordConfirmation) {
    throw new Error('The password must be at least 12 characters and both entries must match.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (transaction) => {
    const roleIds = new Map<string, string>();
    for (const role of roles) {
      const savedRole = await transaction.role.upsert({
        where: { name: role.name },
        create: role,
        update: { displayName: role.displayName },
      });
      roleIds.set(role.name, savedRole.id);
    }

    for (const permission of permissions) {
      const roleConnections = permission.roles.map((roleName) => ({
        id: roleIds.get(roleName) as string,
      }));
      await transaction.permission.upsert({
        where: {
          action_resource: {
            action: permission.action,
            resource: permission.resource,
          },
        },
        create: {
          action: permission.action,
          resource: permission.resource,
          roles: { connect: roleConnections },
        },
        update: { roles: { connect: roleConnections } },
      });
    }

    await transaction.user.create({
      data: {
        email,
        staffId,
        firstName,
        lastName,
        passwordHash,
        roleId: roleIds.get('ADMINISTRATOR') as string,
      },
    });
  });

  process.stdout.write('Administrator account created. Sign in and create named staff accounts with individual passwords.\n');
};

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
    process.stderr.write(`Bootstrap failed: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
