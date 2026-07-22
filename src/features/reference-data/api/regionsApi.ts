import { createReferenceDataApi } from './createReferenceDataApi';
import type { BaseReferenceFormValues, RegionItem } from '../types/referenceData.types';

export const regionsApi = createReferenceDataApi<RegionItem, BaseReferenceFormValues>('/api/regions');
