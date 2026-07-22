import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useUnitOptions } from '../../reference-data/hooks/useReferenceOptions';
import { ApiError } from '../../../services/httpClient';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { ResourceFormValues } from '../types/resource.types';
import { resourceFormSchema } from '../utils/resourceForm.schema';
import { CategoryPathAutocomplete } from './CategoryPathAutocomplete';

const FORM_FIELD_NAMES = [
  'categoryId',
  'code',
  'name',
  'description',
  'unitId',
  'specification',
  'manufacturer',
  'brand',
  'model',
  'active',
] as const;
type FormFieldName = (typeof FORM_FIELD_NAMES)[number];

function isFormFieldName(value: string): value is FormFieldName {
  return (FORM_FIELD_NAMES as readonly string[]).includes(value);
}

const DEFAULT_VALUES: ResourceFormValues = {
  categoryId: '',
  code: '',
  name: '',
  description: '',
  unitId: null,
  specification: '',
  manufacturer: '',
  brand: '',
  model: '',
  active: true,
};

export interface ResourceFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  editValues: ResourceFormValues | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ResourceFormValues, onError: (error: unknown) => void) => void;
}

export function ResourceFormDialog({
  open,
  mode,
  editValues,
  isSubmitting,
  onClose,
  onSubmit,
}: ResourceFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const unitOptions = useUnitOptions();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormError(null);
    reset(mode === 'edit' && editValues ? editValues : DEFAULT_VALUES);
  }, [open, mode, editValues, reset]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 400 && error.validationErrors) {
        const fieldEntries = Object.entries(error.validationErrors).filter(([field]) =>
          isFormFieldName(field),
        );
        fieldEntries.forEach(([field, message]) => {
          setError(field as FormFieldName, { type: 'server', message });
        });
        setFormError(fieldEntries.length > 0 ? null : getApiErrorMessage(error));
      } else if (error.status === 409) {
        setError('code', { type: 'server', message: 'Bu kod artıq mövcuddur.' });
      } else if (error.status === 404) {
        setFormError('Seçilmiş kateqoriya və ya vahid tapılmadı.');
      } else {
        setFormError(getApiErrorMessage(error));
      }
    } else {
      setFormError(getApiErrorMessage(error));
    }
  }

  const submit = handleSubmit((values) => {
    setFormError(null);
    onSubmit(values, handleApiError);
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'edit' ? 'Resursu redaktə et' : 'Yeni resurs'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CategoryPathAutocomplete
                value={field.value || null}
                onChange={(id) => field.onChange(id ?? '')}
                error={!!errors.categoryId}
                helperText={errors.categoryId?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Kod"
                  fullWidth
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  disabled={isSubmitting}
                />
              )}
            />
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Ad"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Stack>

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Təsvir"
                fullWidth
                multiline
                minRows={2}
                error={!!errors.description}
                helperText={errors.description?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="unitId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Vahid"
                  fullWidth
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value || null)}
                  disabled={isSubmitting || unitOptions.isLoading}
                >
                  <MenuItem value="">Seçilməyib</MenuItem>
                  {(unitOptions.data?.content ?? []).map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name} {unit.symbol ? `(${unit.symbol})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
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
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="manufacturer"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="İstehsalçı"
                  fullWidth
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
                <TextField
                  {...field}
                  label="Brend"
                  fullWidth
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
                <TextField
                  {...field}
                  label="Model"
                  fullWidth
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
        <Box sx={{ flexGrow: 1 }} />
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
