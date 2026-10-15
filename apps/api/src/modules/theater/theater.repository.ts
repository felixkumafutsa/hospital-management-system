
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createSurgicalProcedure = async (
  data: Prisma.SurgicalProcedureCreateInput,
) => {
  return prisma.surgicalProcedure.create({ data });
};

export const findMany = async () => {
  return prisma.surgicalProcedure.findMany();
};

export const findById = async (id: string) => {
  return prisma.surgicalProcedure.findUnique({ where: { id } });
};

export const findTheaterById = async (id: string) => {
  return prisma.theater.findUnique({ where: { id } });
};

export const findTheaters = async () => {
  return prisma.theater.findMany();
};

export const deleteTheater = async (id: string) => {
  return prisma.theater.delete({ where: { id } });
};


export const update = async (
  id: string,
  data: Prisma.SurgicalProcedureUpdateInput,
) => {
  return prisma.surgicalProcedure.update({ where: { id }, data });
};