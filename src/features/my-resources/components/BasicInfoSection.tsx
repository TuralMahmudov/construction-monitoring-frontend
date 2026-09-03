import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useUnitOptions } from '../../reference-data/hooks/useReferenceOptions';
import type { Product } from '../../products/types/product.types';
import type { CategoryProductPickerValue } from '../../resource-categories/components/CategoryProductTreePicker';
import { CategoryProductTreePicker } from '../../resource-categories/components/CategoryProductTreePicker';
import { useManufacturerOptions, useModelOptions } from '../../resources/hooks/useResourceFieldOptions';
import { useUnitLookup } from '../../resources/hooks/useLookups';
import { ResourceFieldAutocomplete } from '../../resources/components/ResourceFieldAutocomplete';
import type { ResourceListingFieldsSchema } from '../../resources/utils/resourceListingForm.schema';
import type { MyResourceProductFormSchema } from '../utils/myResourceForm.schema';

export interface BasicInfoSectionProps {
  productControl: Control<MyResourceProductFormSchema>;
  productErrors: FieldErrors<MyResourceProductFormSchema>;
  listingControl: Control<ResourceListingFieldsSchema>;
  listingErrors: FieldErrors<ResourceListingFieldsSchema>;
  manufacturerInput: string;
  modelInput: string;
  categoryPickerValue: CategoryProductPickerValue | null;
  onCategoryPickerChange: (value: CategoryProductPickerValue) => void;
  disabled?: boolean;
  /** Set when an existing product was picked from the tree (Yol A, § 4) —
   *  name/unit/description come from this product and aren't sent at all
   *  (bax MyResourceFormDialog), only shown here for context. */
  lockedProduct?: Product | null;
}

export function BasicInfoSection({
  productControl,
  productErrors,
  listingControl,
  listingErrors,
  manufacturerInput,
  modelInput,
  categoryPickerValue,
  onCategoryPickerChange,
  disabled,
  lockedProduct,
}: BasicInfoSectionProps) {
  const unitOptions = useUnitOptions();
  const unitSymbols = useUnitLookup();
  const manufacturerOptions = useManufacturerOptions(manufacturerInput);
  const modelOptions = useModelOptions(modelInput);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Əsas Məlumatlar
        </Typography>

        <Stack spacing={2.5}>
          <CategoryProductTreePicker
            value={categoryPickerValue}
            onChange={onCategoryPickerChange}
            disabled={disabled}
          />

          {lockedProduct ? (
            <Alert severity="info" sx={{ mb: 0 }}>
              Mövcud məhsul seçilib: <strong>{lockedProduct.code} — {lockedProduct.name}</strong>.
              {' '}Təsvir: {lockedProduct.description || '—'}. Vahid:{' '}
              {lockedProduct.unitId ? (unitSymbols.get(lockedProduct.unitId) ?? '—') : '—'}.
              {' '}İstehsalçı/Model/Spesifikasiya aşağıda hər zaman doldurula bilər — bu elana aiddir.
            </Alert>
          ) : (
            <>
              <Controller
                name="name"
                control={productControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Ad"
                    fullWidth
                    required
                    error={!!productErrors.name}
                    helperText={productErrors.name?.message}
                    disabled={disabled}
                  />
                )}
              />

              <Controller
                name="unitId"
                control={productControl}
                render={({ field }) => (
                  <TextField
                    select
                    label="Vahid"
                    fullWidth
                    required
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    disabled={disabled || unitOptions.isLoading}
                    error={!!productErrors.unitId}
                    helperText={productErrors.unitId?.message}
                  >
                    <MenuItem value="" disabled>
                      Seçin
                    </MenuItem>
                    {(unitOptions.data?.content ?? []).map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.name} {unit.symbol ? `(${unit.symbol})` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </>
          )}

          <Controller
            name="specification"
            control={listingControl}
            render={({ field }) => (
              <TextField
                {...field}
                label="Spesifikasiya"
                fullWidth
                multiline
                minRows={2}
                error={!!listingErrors.specification}
                helperText={listingErrors.specification?.message}
                disabled={disabled}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="manufacturer"
              control={listingControl}
              render={({ field }) => (
                <ResourceFieldAutocomplete
                  label="İstehsalçı *"
                  value={field.value}
                  onChange={field.onChange}
                  options={manufacturerOptions.data ?? []}
                  loading={manufacturerOptions.isFetching}
                  error={!!listingErrors.manufacturer}
                  helperText={listingErrors.manufacturer?.message}
                  disabled={disabled}
                />
              )}
            />
            <Controller
              name="model"
              control={listingControl}
              render={({ field }) => (
                <ResourceFieldAutocomplete
                  label="Model"
                  value={field.value}
                  onChange={field.onChange}
                  options={modelOptions.data ?? []}
                  loading={modelOptions.isFetching}
                  error={!!listingErrors.model}
                  helperText={listingErrors.model?.message}
                  disabled={disabled}
                />
              )}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
