import { z } from 'zod';
import { ORGANIZATION_STATUS, ORGANIZATION_TYPE } from '../types/organization.types';

const organizationTypeSchema = z.union([
  z.literal(ORGANIZATION_TYPE.MANUFACTURER),
  z.literal(ORGANIZATION_TYPE.DISTRIBUTOR),
  z.literal(ORGANIZATION_TYPE.RESELLER),
  z.literal(ORGANIZATION_TYPE.GOVERNMENT),
  z.literal(ORGANIZATION_TYPE.OTHER),
]);

export const organizationCreateFormSchema = z.object({
  name: z.string().min(1, 'Ad daxil edin.').max(200, 'Ad 200 simvoldan çox ola bilməz.'),
  type: organizationTypeSchema,
  taxId: z.string().max(50, 'VÖEN 50 simvoldan çox ola bilməz.'),
  contactInfo: z.string().max(200, 'Əlaqə məlumatı 200 simvoldan çox ola bilməz.'),
  username: z.string().min(1, 'İstifadəçi adı daxil edin.'),
  email: z.string().min(1, 'E-poçt daxil edin.').email('Düzgün e-poçt daxil edin.'),
  password: z.string().min(8, 'Şifrə ən azı 8 simvol olmalıdır.'),
  roleNames: z.array(z.string()).min(1, 'Ən azı bir rol seçin.'),
});

export type OrganizationCreateFormSchema = z.infer<typeof organizationCreateFormSchema>;

export const organizationUpdateFormSchema = z.object({
  name: z.string().min(1, 'Ad daxil edin.').max(200, 'Ad 200 simvoldan çox ola bilməz.'),
  type: organizationTypeSchema,
  taxId: z.string().max(50, 'VÖEN 50 simvoldan çox ola bilməz.'),
  contactInfo: z.string().max(200, 'Əlaqə məlumatı 200 simvoldan çox ola bilməz.'),
  status: z.union([
    z.literal(ORGANIZATION_STATUS.ACTIVE),
    z.literal(ORGANIZATION_STATUS.INACTIVE),
    z.literal(ORGANIZATION_STATUS.SUSPENDED),
  ]),
});

export type OrganizationUpdateFormSchema = z.infer<typeof organizationUpdateFormSchema>;
