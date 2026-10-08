import { DrugForm, TransactionType } from '@prisma/client';

export interface CreateMedicineDto {
  name: string;
  genericName?: string;
  form: DrugForm;
  strength?: string;
  unit: string;
  reorderLevel?: number;
}

export interface CreateMedicineBatchDto {
  medicineId: string;
  supplierId: string;
  batchNumber: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  manufacturedAt?: string;
  expiresAt: string;
}

export interface RecordInventoryTransactionDto {
  batchId: string;
  type: TransactionType;
  quantity: number;
  reason?: string;
  reference?: string;
  performedBy: string;
}