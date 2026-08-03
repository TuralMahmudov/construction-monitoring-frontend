import { z } from 'zod';
import { ATTRIBUTE_DATA_TYPE } from '../types/attributeDefinition.types';

export const attributeDefinitionFormSchema = z
  .object({
    name: z.string().min(1, 'Ad daxil edin.').max(100, 'Ad 100 simvoldan çox ola bilməz.'),
    dataType: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    defaultUnitId: z.string().uuid().nullable(),
    active: z.boolean(),
  })
  // NUMBER-typed attributes carry a fixed unit ("vendor yalnız rəqəmi
  // yazır", the unit itself is never free text) — every other type leaves
  // defaultUnitId null.
  .refine((data) => data.dataType !== ATTRIBUTE_DATA_TYPE.NUMBER || Boolean(data.defaultUnitId), {
    message: 'Rəqəm tipli atribut üçün vahid seçilməlidir.',
    path: ['defaultUnitId'],
  });

export type AttributeDefinitionFormSchema = z.infer<typeof attributeDefinitionFormSchema>;
