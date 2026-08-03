import { z } from 'zod';

// Yol B (§ 4) — new/unknown category+attribute combination. Only relevant
// when no existing product was picked from the tree; description is never
// sent (server-generated, bax FRONTEND_AI_PROMPT_PRODUCTS.md § 2).
export const myResourceProductFormSchema = z.object({
  categoryId: z.string().uuid('Kateqoriya seçin.'),
  name: z.string().min(1, 'Ad daxil edin.').max(255, 'Ad 255 simvoldan çox ola bilməz.'),
  unitId: z.string().uuid('Vahid seçin.'),
});

export type MyResourceProductFormSchema = z.infer<typeof myResourceProductFormSchema>;
