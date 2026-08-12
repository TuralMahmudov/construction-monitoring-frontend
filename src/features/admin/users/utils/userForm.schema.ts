import { z } from 'zod';

export const userCreateFormSchema = z
  .object({
    username: z.string().min(1, 'İstifadəçi adı daxil edin.'),
    email: z.string().min(1, 'E-poçt daxil edin.').email('Düzgün e-poçt daxil edin.'),
    password: z.string().min(8, 'Şifrə ən azı 8 simvol olmalıdır.'),
    confirmPassword: z.string().min(1, 'Şifrəni təkrar daxil edin.'),
    firstName: z.string().min(1, 'Ad daxil edin.'),
    lastName: z.string().min(1, 'Soyad daxil edin.'),
    roleNames: z.array(z.string()).min(1, 'Ən azı bir rol seçin.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifrələr uyğun gəlmir.',
    path: ['confirmPassword'],
  });

export type UserCreateFormSchema = z.infer<typeof userCreateFormSchema>;

export const userUpdateFormSchema = z.object({
  firstName: z.string().min(1, 'Ad daxil edin.'),
  lastName: z.string().min(1, 'Soyad daxil edin.'),
  enabled: z.boolean(),
  accountNonLocked: z.boolean(),
  roleNames: z.array(z.string()).min(1, 'Ən azı bir rol seçin.'),
});

export type UserUpdateFormSchema = z.infer<typeof userUpdateFormSchema>;
