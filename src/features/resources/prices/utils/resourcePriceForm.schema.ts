import { z } from 'zod';

export const resourcePriceFormSchema = z.object({
  regionId: z.string().uuid('Region seçin.'),
  supplierId: z.string().uuid('Təchizatçı seçin.'),
  price: z.number({ message: 'Qiymət rəqəm olmalıdır.' }).positive('Qiymət 0-dan böyük olmalıdır.'),
  vat: z
    .number({ message: 'ƏDV rəqəm olmalıdır.' })
    .min(0, 'ƏDV mənfi ola bilməz.')
    .max(100, 'ƏDV 100-dən çox ola bilməz.'),
  currency: z.string().length(3, 'Valyuta kodu 3 hərfdən ibarət olmalıdır.'),
  effectiveDate: z.string().min(1, 'Effektiv tarix seçin.'),
  expireDate: z.string().nullable(),
});
