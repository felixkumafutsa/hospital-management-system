
import { BaseModel } from '../../lib/base.model';
import { DrugForm, Medicine, Prisma, Supplier } from '@prisma/client';

export class PharmacyInventoryModel extends BaseModel {
  id!: string;
  name!: string;
  genericName?: string;
  strength?: string;
  isOtc!: boolean;
  form!: DrugForm;
  unit!: string;
  reorderLevel!: number;
  batches!:
    | ({ supplier: Supplier } & {
        id: string;
        medicineId: string;
        batchNumber: string;
        quantity: number;
        quantityLeft: number;
        costPrice: Prisma.Decimal;
        sellingPrice: Prisma.Decimal;
        manufacturedAt: Date | null;
        expiresAt: Date;
      })[]
    | [];

  static fromDB(
    medicine: Medicine & {
      batches: ({ supplier: Supplier } & {
        id: string;
        medicineId: string;
        batchNumber: string;
        quantity: number;
        quantityLeft: number;
        costPrice: Prisma.Decimal;
        sellingPrice: Prisma.Decimal;
        manufacturedAt: Date | null;
        expiresAt: Date;
      })[];
    }
  ) {
    const instance = new PharmacyInventoryModel();
    instance.id = medicine.id;
    instance.name = medicine.name;
    instance.genericName = medicine.genericName ?? undefined;
    instance.strength = medicine.strength ?? undefined;
    instance.isOtc = medicine.isOtc;
    instance.form = medicine.form;
    instance.unit = medicine.unit;
    instance.reorderLevel = medicine.reorderLevel;
    instance.batches = medicine.batches.map((batch) => ({
      id: batch.id,
      medicineId: batch.medicineId,
      supplier: batch.supplier,
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      quantityLeft: batch.quantityLeft,
      costPrice: batch.costPrice,
      sellingPrice: batch.sellingPrice,
      manufacturedAt: batch.manufacturedAt,
      expiresAt: batch.expiresAt,
    }));
    return instance;
  }
}