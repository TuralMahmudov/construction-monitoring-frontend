import { z } from 'zod';

export const categoryFormSchema = z.object({
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1, 'Ad daxil edin.').max(200, 'Ad 200 simvoldan çox ola bilməz.'),
  // 0 is the "not yet selected" sentinel — the backend itself rejects 0
  // ("Unrecognized resource type: 0"), so it doubles as a safe default.
  type: z.number().int().positive('Növ seçin.'),
  active: z.boolean(),
});

export type CategoryFormSchema = z.infer<typeof categoryFormSchema>;
