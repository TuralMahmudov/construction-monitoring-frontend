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
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ApiError } from '../../../../services/httpClient';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import type { ResourceAttributeFormValues } from '../types/resourceAttribute.types';
import { resourceAttributeFormSchema } from '../utils/resourceAttributeForm.schema';

const DEFAULT_VALUES: ResourceAttributeFormValues = {
  attributeName: '',
  attributeValue: '',
  unit: '',
  sortOrder: 0,
  searchable: false,
  required: false,
  active: true,
};

export interface ResourceAttributeFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  editValues: ResourceAttributeFormValues | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ResourceAttributeFormValues, onError: (error: unknown) => void) => void;
}

export function ResourceAttributeFormDialog({
  open,
  mode,
  editValues,
  isSubmitting,
  onClose,
  onSubmit,
}: ResourceAttributeFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ResourceAttributeFormValues>({
    resolver: zodResolver(resourceAttributeFormSchema),
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
          ([field]) => field in DEFAULT_VALUES,
        );
        fieldEntries.forEach(([field, message]) => {
          setError(field as keyof ResourceAttributeFormValues, { type: 'server', message });
        });
        setFormError(fieldEntries.length > 0 ? null : getApiErrorMessage(error));
      } else if (error.status === 409) {
        setError('attributeName', {
          type: 'server',
          message: 'Bu resursda bu adda xüsusiyyət artıq mövcuddur.',
        });
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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === 'edit' ? 'Xüsusiyyəti redaktə et' : 'Yeni xüsusiyyət'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Controller
            name="attributeName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Xüsusiyyət adı"
                fullWidth
                error={!!errors.attributeName}
                helperText={errors.attributeName?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="attributeValue"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Dəyər"
                fullWidth
                error={!!errors.attributeValue}
                helperText={errors.attributeValue?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Vahid (sərbəst mətn, məs. mm, kg)"
                fullWidth
                error={!!errors.unit}
                helperText={errors.unit?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="sortOrder"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Sıra nömrəsi"
                fullWidth
                error={!!errors.sortOrder}
                helperText={errors.sortOrder?.message}
                disabled={isSubmitting}
                onChange={(event) => field.onChange(Number(event.target.value))}
              />
            )}
          />

          <Controller
            name="searchable"
            control={control}
            render={({ field }) => (
              <Stack direction="row" sx={{ alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="Axtarışda filtr kimi istifadə oluna bilsin"
                />
                <Tooltip title="Bu xüsusiyyət resurs axtarışında filtr kimi istifadə oluna bilsin?">
                  <InfoOutlinedIcon fontSize="small" color="action" />
                </Tooltip>
              </Stack>
            )}
          />

          <Controller
            name="required"
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
                label="Məcburi (informativ bayraq)"
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
