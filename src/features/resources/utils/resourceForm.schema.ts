import { z } from 'zod';

export const resourceFormSchema = z.object({
  categoryId: z.string().uuid('Kateqoriya seçin.'),
  code: z.string().min(1, 'Kod daxil edin.').max(50, 'Kod 50 simvoldan çox ola bilməz.'),
  name: z.string().min(1, 'Ad daxil edin.').max(255, 'Ad 255 simvoldan çox ola bilməz.'),
  description: z.string().max(1000, 'Təsvir 1000 simvoldan çox ola bilməz.'),
  unitId: z.string().uuid().nullable(),
  specification: z.string().max(1000, 'Spesifikasiya 1000 simvoldan çox ola bilməz.'),
  manufacturer: z.string().max(255, 'İstehsalçı 255 simvoldan çox ola bilməz.'),
  brand: z.string().max(255, 'Brend 255 simvoldan çox ola bilməz.'),
  model: z.string().max(255, 'Model 255 simvoldan çox ola bilməz.'),
  active: z.boolean(),
});

export type ResourceFormSchema = z.infer<typeof resourceFormSchema>;
