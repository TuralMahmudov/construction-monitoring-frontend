import { useEffect, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useRegionOptions } from '../../../reference-data/hooks/useReferenceOptions';
import { ApiError } from '../../../../services/httpClient';
import { NumberField } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import type { ResourcePriceFormValues } from '../types/resourcePrice.types';
import { resourcePriceFormSchema } from '../utils/resourcePriceForm.schema';

const CURRENCY_OPTIONS = ['AZN', 'USD', 'EUR', 'TRY', 'GBP', 'RUB'];

const DEFAULT_VALUES: ResourcePriceFormValues = {
  regionId: '',
  price: 0,
  vat: 0,
  currency: 'AZN',
  effectiveDate: dayjs().format('YYYY-MM-DD'),
  expireDate: null,
  comment: '',
};

export interface PriceFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  editValues: ResourcePriceFormValues | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ResourcePriceFormValues, onError: (error: unknown) => void) => void;
}

export function PriceFormDialog({
  open,
  mode,
  editValues,
  isSubmitting,
  onClose,
  onSubmit,
}: PriceFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [noExpiry, setNoExpiry] = useState(true);
  const regionOptions = useRegionOptions();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ResourcePriceFormValues>({
    resolver: zodResolver(resourcePriceFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormError(null);
    const values = mode === 'edit' && editValues ? editValues : DEFAULT_VALUES;
    reset(values);
    setNoExpiry(!values.expireDate);
  }, [open, mode, editValues, reset]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 400 && error.validationErrors) {
        const fieldEntries = Object.entries(error.validationErrors).filter(
          ([field]) => field in DEFAULT_VALUES,
        );
        fieldEntries.forEach(([field, message]) => {
          setError(field as keyof ResourcePriceFormValues, { type: 'server', message });
        });
        setFormError(fieldEntries.length > 0 ? null : getApiErrorMessage(error));
      } else if (error.status === 409) {
        setFormError(getApiErrorMessage(error));
      } else {
        setFormError(getApiErrorMessage(error));
      }
    } else {
      setFormError(getApiErrorMessage(error));
    }
  }

  const submit = handleSubmit((values) => {
    setFormError(null);
    onSubmit({ ...values, expireDate: noExpiry ? null : values.expireDate }, handleApiError);
  });

  const regions = regionOptions.data?.content ?? [];

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'edit' ? 'Qiyməti redaktə et' : 'Yeni qiymət'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Controller
            name="regionId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={regions}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                value={regions.find((r) => r.id === field.value) ?? null}
                onChange={(_event, newValue) => field.onChange(newValue?.id ?? '')}
                loading={regionOptions.isLoading}
                disabled={isSubmitting}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Region"
                    error={!!errors.regionId}
                    helperText={errors.regionId?.message}
                  />
                )}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <NumberField
                  label="Qiymət"
                  fullWidth
                  value={field.value}
                  error={!!errors.price}
                  helperText={errors.price?.message}
                  disabled={isSubmitting}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="vat"
              control={control}
              render={({ field }) => (
                <NumberField
                  label="ƏDV (%)"
                  fullWidth
                  value={field.value}
                  error={!!errors.vat}
                  helperText={errors.vat?.message}
                  disabled={isSubmitting}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  freeSolo
                  options={CURRENCY_OPTIONS}
                  value={field.value}
                  onInputChange={(_event, newValue) => field.onChange(newValue.toUpperCase())}
                  disabled={isSubmitting}
                  sx={{ flex: 1, minWidth: 140 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Valyuta"
                      error={!!errors.currency}
                      helperText={errors.currency?.message}
                    />
                  )}
                />
              )}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="effectiveDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Effektiv tarix"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(newValue: Dayjs | null) =>
                    field.onChange(newValue ? newValue.format('YYYY-MM-DD') : '')
                  }
                  disabled={isSubmitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.effectiveDate,
                      helperText: errors.effectiveDate?.message,
                    },
                  }}
                />
              )}
            />
            <Controller
              name="expireDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Bitmə tarixi"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(newValue: Dayjs | null) =>
                    field.onChange(newValue ? newValue.format('YYYY-MM-DD') : null)
                  }
                  disabled={isSubmitting || noExpiry}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.expireDate,
                      helperText: errors.expireDate?.message,
                    },
                  }}
                />
              )}
            />
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={noExpiry}
                onChange={(event) => setNoExpiry(event.target.checked)}
                disabled={isSubmitting}
              />
            }
            label="Naməlum müddətə qədər"
          />

          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Şərh"
                fullWidth
                multiline
                minRows={2}
                error={!!errors.comment}
                helperText={errors.comment?.message}
                disabled={isSubmitting}
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
