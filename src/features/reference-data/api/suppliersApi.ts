import { createReferenceDataApi } from './createReferenceDataApi';
import type { BaseReferenceFormValues, SupplierItem } from '../types/referenceData.types';

export const suppliersApi = createReferenceDataApi<SupplierItem, BaseReferenceFormValues>(
  '/api/suppliers',
);
