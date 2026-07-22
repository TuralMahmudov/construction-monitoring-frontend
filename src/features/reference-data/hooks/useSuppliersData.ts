import { suppliersApi } from '../api/suppliersApi';
import { createReferenceDataHooks } from './createReferenceDataHooks';

export const suppliersHooks = createReferenceDataHooks('suppliers', suppliersApi, {
  created: 'Təchizatçı uğurla yaradıldı.',
  updated: 'Təchizatçı uğurla yeniləndi.',
  deleted: 'Təchizatçı uğurla silindi.',
  deleteConflict: 'Bu təchizatçı qiymətlərdə istifadə olunur, silinə bilməz.',
});
