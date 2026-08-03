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
import type { Product, ProductUpdateRequest } from '../types/product.types';
import { productUpdateFormSchema, type ProductUpdateFormSchema } from '../utils/productForm.schema';

export interface ProductEditDialogProps {
  open: boolean;
  product: Product | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ProductUpdateRequest, onError: (error: unknown) => void) => void;
}

// § 2.2 — cosmetic fields only. categoryId/attributes/unitId/code never
// appear here: changing those means a different product (§ 6.2 instead).
export function ProductEditDialog({ open, product, isSubmitting, onClose, onSubmit }: ProductEditDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProductUpdateFormSchema>({
    resolver: zodResolver(productUpdateFormSchema),
    defaultValues: {
      name: '',
      active: true,
    },
  });

  useEffect(() => {
    if (!open || !product) {
      return;
    }
    setFormError(null);
    reset({
      name: product.name,
      active: product.active,
    });
  }, [open, product, reset]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError && error.status === 400 && error.validationErrors) {
      const fieldEntries = Object.entries(error.validationErrors);
      fieldEntries.forEach(([field, message]) => {
        setError(field as keyof ProductUpdateFormSchema, { type: 'server', message });
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
      <DialogTitle>Məhsulu redaktə et</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          {product && (
            <TextField label="Kod" value={product.code} fullWidth disabled helperText="Kod dəyişdirilə bilməz." />
          )}

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

          {product && (
            <TextField
              label="Təsvir"
              value={product.description || '—'}
              fullWidth
              multiline
              minRows={2}
              disabled
              helperText="Avtomatik qurulur (kateqoriya adı + xüsusiyyətlər), redaktə edilə bilməz."
            />
          )}

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
