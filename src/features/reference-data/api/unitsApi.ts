import { createReferenceDataApi } from './createReferenceDataApi';
import type { UnitFormValues, UnitItem } from '../types/referenceData.types';

export const unitsApi = createReferenceDataApi<UnitItem, UnitFormValues>('/api/units');
