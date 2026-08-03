import { z } from 'zod';

export const myResourcePriceFormSchema = z.object({
  regionId: z.string().uuid('Region seçin.'),
  price: z.number({ message: 'Qiymət rəqəm olmalıdır.' }).positive('Qiymət 0-dan böyük olmalıdır.'),
  currency: z.string().length(3, 'Valyuta kodu 3 hərfdən ibarət olmalıdır.'),
  effectiveDate: z.string().min(1, 'Effektiv tarix seçin.'),
  expireDate: z.string().nullable(),
  comment: z.string().max(500, 'Şərh 500 simvoldan çox ola bilməz.'),
});

export type MyResourcePriceFormSchema = z.infer<typeof myResourcePriceFormSchema>;
