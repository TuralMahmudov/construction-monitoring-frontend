import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { ApiError } from '../../../services/httpClient';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { useBrandOptions, useManufacturerOptions, useModelOptions } from '../hooks/useResourceFieldOptions';
import type { Resource, ResourceUpdateRequest } from '../types/resource.types';
import { resourceUpdateFormSchema, type ResourceUpdateFormSchema } from '../utils/resourceListingForm.schema';
import { ResourceFieldAutocomplete } from './ResourceFieldAutocomplete';

export interface ResourceEditDialogProps {
  open: boolean;
  resource: Resource | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ResourceUpdateRequest, onError: (error: unknown) => void) => void;
}

// § 3.3 — only the brand fields + active are editable here; productId/
// category/attributes/unit are immutable (a different listing is needed
// for those, bax ResourceFormDialog).
export function ResourceEditDialog({ open, resource, isSubmitting, onClose, onSubmit }: ResourceEditDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<ResourceUpdateFormSchema>({
    resolver: zodResolver(resourceUpdateFormSchema),
    defaultValues: {
      specification: '',
      manufacturer: '',
      brand: '',
      model: '',
      active: true,
    },
  });

  const manufacturerInput = watch('manufacturer');
  const brandInput = watch('brand');
  const modelInput = watch('model');
  const manufacturerOptions = useManufacturerOptions(manufacturerInput);
  const brandOptions = useBrandOptions(brandInput);
  const modelOptions = useModelOptions(modelInput);

  useEffect(() => {
    if (!open || !resource) {
      return;
    }
    setFormError(null);
    reset({
      specification: resource.specification ?? '',
      manufacturer: resource.manufacturer ?? '',
      brand: resource.brand ?? '',
      model: resource.model ?? '',
      active: resource.active,
    });
  }, [open, resource, reset]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError && error.status === 400 && error.validationErrors) {
      const fieldEntries = Object.entries(error.validationErrors);
      fieldEntries.forEach(([field, message]) => {
        setError(field as keyof ResourceUpdateFormSchema, { type: 'server', message });
      });
      setFormError(fieldEntries.length > 0 ? null : getApiErrorMessage(error));
    } else {
      setFormError(getApiErrorMessage(error));
    }
  }

  const submit = handleSubmit((values) => {
    setFormError(null);
    onSubmit(values, handleApiError);
  });

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="sm" fullWidth>
      <DialogTitle>Elanı redaktə et</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          {resource && (
            <TextField
              label="Məhsul"
              value={`${resource.product.code} — ${resource.product.name}`}
              fullWidth
              disabled
              helperText="Dəyişdirilə bilməz — fərqli məhsul üçün yeni elan yaradın."
            />
          )}

          <Controller
            name="specification"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Spesifikasiya"
                fullWidth
                error={!!errors.specification}
                helperText={errors.specification?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="manufacturer"
              control={control}
              render={({ field }) => (
                <ResourceFieldAutocomplete
                  label="İstehsalçı"
                  value={field.value}
                  onChange={field.onChange}
                  options={manufacturerOptions.data ?? []}
                  loading={manufacturerOptions.isFetching}
                  error={!!errors.manufacturer}
                  helperText={errors.manufacturer?.message}
                  disabled={isSubmitting}
                />
              )}
            />
            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <ResourceFieldAutocomplete
                  label="Brend"
                  value={field.value}
                  onChange={field.onChange}
                  options={brandOptions.data ?? []}
                  loading={brandOptions.isFetching}
                  error={!!errors.brand}
                  helperText={errors.brand?.message}
                  disabled={isSubmitting}
                />
              )}
            />
            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <ResourceFieldAutocomplete
                  label="Model"
                  value={field.value}
                  onChange={field.onChange}
                  options={modelOptions.data ?? []}
                  loading={modelOptions.isFetching}
                  error={!!errors.model}
                  helperText={errors.model?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Stack>

          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label="Aktiv"
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          İmtina
        </Button>
        <Button variant="contained" onClick={submit} disabled={isSubmitting}>
          {isSubmitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
