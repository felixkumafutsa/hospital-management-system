
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createSurgicalProcedure = async (data: any) => {
  return prisma.surgicalProcedure.create({ data });
};

export const findMany = async () => {
  return prisma.surgicalProcedure.findMany();
};

export const findById = async (id: string) => {
  return prisma.surgicalProcedure.findUnique({ where: { id } });
};

export const update = async (id: string, data: any) => {
  return prisma.surgicalProcedure.update({ where: { id }, data });
};