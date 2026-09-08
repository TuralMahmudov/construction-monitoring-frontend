import { z } from 'zod';
import { ORGANIZATION_STATUS, ORGANIZATION_TYPE } from '../types/organization.types';

const organizationTypeSchema = z.union([
  z.literal(ORGANIZATION_TYPE.MANUFACTURER),
  z.literal(ORGANIZATION_TYPE.DISTRIBUTOR),
  z.literal(ORGANIZATION_TYPE.RESELLER),
  z.literal(ORGANIZATION_TYPE.GOVERNMENT),
  z.literal(ORGANIZATION_TYPE.OTHER),
]);

// Optional contact email (FRONTEND_AI_PROMPT_ORGANIZATION_EMAIL.md, 2026-08-12)
// — no longer a login credential, so empty is fine, but a non-empty value
// still has to look like an email.
const optionalEmailSchema = z.union([z.literal(''), z.string().email('Düzgün e-poçt daxil edin.')]);

export const organizationCreateFormSchema = z
  .object({
    name: z.string().min(1, 'Ad daxil edin.').max(200, 'Ad 200 simvoldan çox ola bilməz.'),
    type: organizationTypeSchema,
    taxId: z.string().max(50, 'VÖEN 50 simvoldan çox ola bilməz.'),
    contactInfo: z.string().max(200, 'Əlaqə məlumatı 200 simvoldan çox ola bilməz.'),
    email: optionalEmailSchema,
    username: z.string().min(1, 'İstifadəçi adı daxil edin.'),
    password: z.string().min(8, 'Şifrə ən azı 8 simvol olmalıdır.'),
    confirmPassword: z.string().min(1, 'Şifrəni təkrar daxil edin.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifrələr uyğun gəlmir.',
    path: ['confirmPassword'],
  });

export type OrganizationCreateFormSchema = z.infer<typeof organizationCreateFormSchema>;

export const organizationUpdateFormSchema = z.object({
  name: z.string().min(1, 'Ad daxil edin.').max(200, 'Ad 200 simvoldan çox ola bilməz.'),
  type: organizationTypeSchema,
  taxId: z.string().max(50, 'VÖEN 50 simvoldan çox ola bilməz.'),
  contactInfo: z.string().max(200, 'Əlaqə məlumatı 200 simvoldan çox ola bilməz.'),
  email: optionalEmailSchema,
  status: z.union([
    z.literal(ORGANIZATION_STATUS.ACTIVE),
    z.literal(ORGANIZATION_STATUS.INACTIVE),
    z.literal(ORGANIZATION_STATUS.SUSPENDED),
  ]),
});

export type OrganizationUpdateFormSchema = z.infer<typeof organizationUpdateFormSchema>;
