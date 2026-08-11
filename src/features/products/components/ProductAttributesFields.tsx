import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { CategoryAttributeDefinition } from '../../resource-categories/types/categoryAttributeDefinition.types';
import { AttributeValueField } from './AttributeValueField';

export interface ProductAttributesFieldsProps {
  categoryId: string | null;
  attributeLinks: CategoryAttributeDefinition[];
  isLoading: boolean;
  values: Record<string, string>;
  onChange: (categoryAttributeDefinitionId: string, value: string) => void;
  disabled?: boolean;
}

// Dynamic attribute inputs for the "Yeni məhsul yarat" step (§ 6.2) — the
// caller owns the category-attributes query and the values map so it can
// also validate required fields and build the attributes[] payload at
// submit time without a second query.
export function ProductAttributesFields({
  categoryId,
  attributeLinks,
  isLoading,
  values,
  onChange,
  disabled,
}: ProductAttributesFieldsProps) {
  if (!categoryId) {
    return (
      <Typography color="text.secondary" variant="body2">
        Əvvəlcə kateqoriya seçin.
      </Typography>
    );
  }

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 1 }}>
        <CircularProgress size={22} />
      </Stack>
    );
  }

  if (attributeLinks.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        Bu kateqoriya üçün xüsusiyyət tərtib edilməyib.
      </Typography>
    );
  }

  return (
    <Stack spacing={2.5}>
      {attributeLinks.map((link) => (
        <AttributeValueField
          key={link.id}
          dataType={link.dataType}
          value={values[link.id] ?? ''}
          onChange={(value) => onChange(link.id, value)}
          label={link.attributeName}
          unit={link.defaultUnitSymbol}
          defaultUnitId={link.defaultUnitId}
          enumValues={link.enumValues}
          required={link.required}
          disabled={disabled}
        />
      ))}
    </Stack>
  );
}
