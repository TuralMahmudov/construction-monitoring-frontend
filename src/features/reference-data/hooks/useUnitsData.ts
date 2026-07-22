import { unitsApi } from '../api/unitsApi';
import { createReferenceDataHooks } from './createReferenceDataHooks';

export const unitsHooks = createReferenceDataHooks('units', unitsApi, {
  created: 'Vahid uğurla yaradıldı.',
  updated: 'Vahid uğurla yeniləndi.',
  deleted: 'Vahid uğurla silindi.',
  deleteConflict: 'Bu vahid resurslarda istifadə olunur, silinə bilməz.',
});
