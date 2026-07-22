import { z } from 'zod';

export const regionFormSchema = z.object({
  code: z.string().min(1, 'Kod daxil edin.').max(20, 'Kod 20 simvoldan çox ola bilməz.'),
  name: z.string().min(1, 'Ad daxil edin.').max(150, 'Ad 150 simvoldan çox ola bilməz.'),
  active: z.boolean(),
});

export const supplierFormSchema = regionFormSchema;

export const unitFormSchema = z.object({
  code: z.string().min(1, 'Kod daxil edin.').max(20, 'Kod 20 simvoldan çox ola bilməz.'),
  name: z.string().min(1, 'Ad daxil edin.').max(100, 'Ad 100 simvoldan çox ola bilməz.'),
  symbol: z.string().max(20, 'Simvol 20 simvoldan çox ola bilməz.'),
  decimalPrecision: z
    .number({ message: 'Onluq dəqiqlik rəqəm olmalıdır.' })
    .int('Tam ədəd olmalıdır.')
    .min(0, 'Mənfi ola bilməz.')
    .max(10, '10-dan çox ola bilməz.'),
  active: z.boolean(),
});
