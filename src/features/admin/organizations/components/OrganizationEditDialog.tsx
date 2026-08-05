import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { ApiError } from '../../../../services/httpClient';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import {
  ORGANIZATION_STATUS_LABELS,
  ORGANIZATION_STATUS_OPTIONS,
  ORGANIZATION_TYPE_ICONS,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_OPTIONS,
  type OrganizationUpdateFormValues,
} from '../types/organization.types';
import { organizationUpdateFormSchema } from '../utils/organizationForm.schema';

export interface OrganizationEditDialogProps {
  open: boolean;
  editValues: OrganizationUpdateFormValues | null;
  // Read-only display only — not part of the submitted form, since PUT
  // can't change the login account (§ 2.2). `null`/undefined for the rare
  // org with no linked login account (bax organization.types.ts).
  username?: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: OrganizationUpdateFormValues, onError: (error: unknown) => void) => void;
}

// No login fields here — this is what actually "disables" a vendor
// (status=SUSPENDED/INACTIVE). The login account itself (username/password)
// is untouched by this endpoint (§ 2.2).
export function OrganizationEditDialog({
  open,
  editValues,
  username,
  isSubmitting,
  onClose,
  onSubmit,
}: OrganizationEditDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<OrganizationUpdateFormValues>({
    resolver: zodResolver(organizationUpdateFormSchema),
    defaultValues: editValues ?? undefined,
  });

  useEffect(() => {
    if (!open || !editValues) {
      return;
    }
    setFormError(null);
    reset(editValues);
  }, [open, editValues, reset]);

  const KNOWN_FIELDS = ['name', 'type', 'taxId', 'contactInfo', 'status'];

  function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 400 && error.validationErrors) {
        const entries = Object.entries(error.validationErrors);
        const fieldEntries = entries.filter(([field]) => KNOWN_FIELDS.includes(field));
        fieldEntries.forEach(([field, message]) => {
          setError(field as keyof OrganizationUpdateFormValues, { type: 'server', message });
        });
        const unmatched = entries.filter(([field]) => !KNOWN_FIELDS.includes(field)).map(([, message]) => message);
        setFormError(unmatched.length > 0 ? unmatched.join(' ') : fieldEntries.length > 0 ? null : getApiErrorMessage(error));
      } else if (error.status === 400) {
        setFormError(error.message || getApiErrorMessage(error));
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
      <DialogTitle>Təşkilatı redaktə et</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <TextField
            label="Giriş adı (username)"
            fullWidth
            value={username ?? '—'}
            disabled
            helperText="Giriş hesabının istifadəçi adı — bu formadan dəyişdirilə bilmir."
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

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Təşkilat növü"
                fullWidth
                error={!!errors.type}
                helperText={errors.type?.message}
                disabled={isSubmitting}
                onChange={(event) => field.onChange(Number(event.target.value))}
              >
                {ORGANIZATION_TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>
                    {ORGANIZATION_TYPE_ICONS[type]} {ORGANIZATION_TYPE_LABELS[type]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="taxId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="VÖEN"
                fullWidth
                error={!!errors.taxId}
                helperText={errors.taxId?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="contactInfo"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Əlaqə məlumatı"
                fullWidth
                error={!!errors.contactInfo}
                helperText={errors.contactInfo?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Status"
                fullWidth
                helperText="Bloklanıb/Deaktiv — giriş hesabının özü söndürülmür, yalnız təşkilatın statusu dəyişir."
                disabled={isSubmitting}
                onChange={(event) => field.onChange(Number(event.target.value))}
              >
                {ORGANIZATION_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {ORGANIZATION_STATUS_LABELS[status]}
                  </MenuItem>
                ))}
              </TextField>
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
