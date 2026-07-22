import { regionsApi } from '../api/regionsApi';
import { createReferenceDataHooks } from './createReferenceDataHooks';

export const regionsHooks = createReferenceDataHooks('regions', regionsApi, {
  created: 'Region uğurla yaradıldı.',
  updated: 'Region uğurla yeniləndi.',
  deleted: 'Region uğurla silindi.',
  deleteConflict: 'Bu region qiymətlərdə istifadə olunur, silinə bilməz.',
});
