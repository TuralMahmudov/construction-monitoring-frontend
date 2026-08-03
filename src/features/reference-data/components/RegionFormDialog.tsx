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
import type { BaseReferenceFormValues } from '../types/referenceData.types';
import { regionFormSchema } from '../utils/referenceDataSchema';

const DEFAULT_VALUES: BaseReferenceFormValues = { name: '', active: true };

export interface RegionFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  title: string;
  editValues: BaseReferenceFormValues | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: BaseReferenceFormValues, onError: (error: unknown) => void) => void;
}

// Region's own dialog — used to share SimpleReferenceFormDialog with
// Supplier, but Region's `code` column was dropped 2026-07-31 while
// Supplier's wasn't, so the two no longer have the same form shape (bax
// SupplierFormDialog.tsx for the code-carrying counterpart).
export function RegionFormDialog({
  open,
  mode,
  title,
  editValues,
  isSubmitting,
  onClose,
  onSubmit,
}: RegionFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BaseReferenceFormValues>({
    resolver: zodResolver(regionFormSchema),
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
        const fieldEntries = Object.entries(error.validationErrors).filter(
          ([field]) => field === 'name' || field === 'active',
        );
        fieldEntries.forEach(([field, message]) => {
          setError(field as keyof BaseReferenceFormValues, { type: 'server', message });
        });
        setFormError(fieldEntries.length > 0 ? null : getApiErrorMessage(error));
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
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

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
