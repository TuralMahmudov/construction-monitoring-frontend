import { z } from 'zod';

export const resourceAttributeFormSchema = z.object({
  attributeName: z
    .string()
    .min(1, 'Xüsusiyyət adı daxil edin.')
    .max(100, 'Ad 100 simvoldan çox ola bilməz.'),
  attributeValue: z.string().min(1, 'Dəyər daxil edin.').max(1000, 'Dəyər 1000 simvoldan çox ola bilməz.'),
  unit: z.string().max(50, 'Vahid 50 simvoldan çox ola bilməz.'),
  sortOrder: z
    .number({ message: 'Sıra nömrəsi rəqəm olmalıdır.' })
    .int('Tam ədəd olmalıdır.')
    .min(0, 'Mənfi ola bilməz.'),
  searchable: z.boolean(),
  required: z.boolean(),
  active: z.boolean(),
});
