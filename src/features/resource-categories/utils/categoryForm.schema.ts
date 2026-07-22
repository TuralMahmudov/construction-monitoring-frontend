import { z } from 'zod';

const CODE_PATTERN = /^[A-Za-z0-9._-]+$/;

export const categoryFormSchema = z.object({
  parentId: z.string().uuid().nullable(),
  code: z
    .string()
    .min(1, 'Kod daxil edin.')
    .max(50, 'Kod 50 simvoldan çox ola bilməz.')
    .regex(CODE_PATTERN, 'Kod yalnız hərf, rəqəm, nöqtə, tire və alt xətt ola bilər.'),
  name: z.string().min(1, 'Ad daxil edin.').max(200, 'Ad 200 simvoldan çox ola bilməz.'),
  // 0 is the "not yet selected" sentinel — the backend itself rejects 0
  // ("Unrecognized resource type: 0"), so it doubles as a safe default.
  type: z.number().int().positive('Növ seçin.'),
  sortOrder: z
    .number({ message: 'Sıra nömrəsi rəqəm olmalıdır.' })
    .int('Sıra nömrəsi tam ədəd olmalıdır.')
    .min(0, 'Sıra nömrəsi mənfi ola bilməz.'),
  active: z.boolean(),
});

export type CategoryFormSchema = z.infer<typeof categoryFormSchema>;
