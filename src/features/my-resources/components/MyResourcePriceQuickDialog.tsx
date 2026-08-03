import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import dayjs, { type Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { NumberField } from '../../../shared/components';
import { useRegionOptions } from '../../reference-data/hooks/useReferenceOptions';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useCreateMyResourcePrice, useMyResourcePriceList } from '../hooks/useMyResourcePrices';
import type { MyResourcePriceFormValues } from '../types/price.types';
import { myResourcePriceFormSchema } from '../utils/myResourcePriceForm.schema';
import { MyResourcePricesList } from './MyResourcePricesList';

const CURRENCY_OPTIONS = ['AZN', 'USD', 'EUR', 'TRY', 'GBP', 'RUB'];

const DEFAULT_VALUES: MyResourcePriceFormValues = {
  regionId: '',
  price: 0,
  currency: 'AZN',
  effectiveDate: dayjs().format('YYYY-MM-DD'),
  expireDate: null,
  comment: '',
};

export interface MyResourcePriceQuickDialogProps {
  open: boolean;
  resourceId: string | null;
  resourceName: string;
  onClose: () => void;
}

export function MyResourcePriceQuickDialog({
  open,
  resourceId,
  resourceName,
  onClose,
}: MyResourcePriceQuickDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [noExpiry, setNoExpiry] = useState(true);
  const pricesQuery = useMyResourcePriceList(open ? resourceId : null);
  const createMutation = useCreateMyResourcePrice(resourceId ?? '');
  const regionOptions = useRegionOptions();
  const regions = regionOptions.data?.content ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MyResourcePriceFormValues>({
    resolver: zodResolver(myResourcePriceFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      setShowForm(false);
      setNoExpiry(true);
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  const submit = handleSubmit((values) => {
    createMutation.mutate(
      { ...values, expireDate: noExpiry ? null : values.expireDate },
      {
        onSuccess: () => {
          reset(DEFAULT_VALUES);
          setNoExpiry(true);
          setShowForm(false);
        },
      },
    );
  });

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="sm" fullWidth>
      <DialogTitle>Qiymət — {resourceName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {pricesQuery.isLoading && (
            <Stack sx={{ alignItems: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Stack>
          )}
          {pricesQuery.isError && <Alert severity="error">{getApiErrorMessage(pricesQuery.error)}</Alert>}
          {pricesQuery.data && <MyResourcePricesList prices={pricesQuery.data} />}

          <Divider />

          {!showForm && (
            <Button startIcon={<AddRoundedIcon />} onClick={() => setShowForm(true)} sx={{ alignSelf: 'flex-start' }}>
              Qiymət əlavə et
            </Button>
          )}

          {showForm && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">Yeni qiymət</Typography>
              {createMutation.isError && (
                <Alert severity="error">{getApiErrorMessage(createMutation.error)}</Alert>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="regionId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={regions}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(option, val) => option.id === val.id}
                      value={regions.find((region) => region.id === field.value) ?? null}
                      onChange={(_event, newValue) => field.onChange(newValue?.id ?? '')}
                      loading={regionOptions.isLoading}
                      disabled={createMutation.isPending}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField {...params} label="Region" error={!!errors.regionId} helperText={errors.regionId?.message} />
                      )}
                    />
                  )}
                />
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
                      disabled={createMutation.isPending}
                      onChange={field.onChange}
                      sx={{ flex: 1 }}
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
                      disabled={createMutation.isPending}
                      sx={{ flex: 1, minWidth: 140 }}
                      renderInput={(params) => (
                        <TextField {...params} label="Valyuta" error={!!errors.currency} helperText={errors.currency?.message} />
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
                      onChange={(newValue: Dayjs | null) => field.onChange(newValue ? newValue.format('YYYY-MM-DD') : '')}
                      disabled={createMutation.isPending}
                      slotProps={{
                        textField: { fullWidth: true, error: !!errors.effectiveDate, helperText: errors.effectiveDate?.message },
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
                      onChange={(newValue: Dayjs | null) => field.onChange(newValue ? newValue.format('YYYY-MM-DD') : null)}
                      disabled={createMutation.isPending || noExpiry}
                      slotProps={{
                        textField: { fullWidth: true, error: !!errors.expireDate, helperText: errors.expireDate?.message },
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
                    disabled={createMutation.isPending}
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
                    error={!!errors.comment}
                    helperText={errors.comment?.message}
                    disabled={createMutation.isPending}
                  />
                )}
              />

              <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                <Button onClick={() => setShowForm(false)} disabled={createMutation.isPending}>
                  Ləğv et
                </Button>
                <Button variant="contained" onClick={submit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Bağla</Button>
      </DialogActions>
    </Dialog>
  );
}
