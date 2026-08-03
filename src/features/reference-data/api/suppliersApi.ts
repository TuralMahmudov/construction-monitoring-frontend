import { createReferenceDataApi } from './createReferenceDataApi';
import type { SupplierFormValues, SupplierItem } from '../types/referenceData.types';

export const suppliersApi = createReferenceDataApi<SupplierItem, SupplierFormValues>(
  '/api/suppliers',
);
