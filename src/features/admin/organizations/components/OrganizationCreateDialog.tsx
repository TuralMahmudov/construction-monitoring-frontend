import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ApiError } from '../../../../services/httpClient';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import { useRoles } from '../../roles/hooks/useRoles';
import {
  ORGANIZATION_TYPE_ICONS,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_OPTIONS,
  type OrganizationCreateFormValues,
} from '../types/organization.types';
import { organizationCreateFormSchema } from '../utils/organizationForm.schema';

const DEFAULT_VALUES: OrganizationCreateFormValues = {
  name: '',
  type: ORGANIZATION_TYPE_OPTIONS[0],
  taxId: '',
  contactInfo: '',
  username: '',
  email: '',
  password: '',
  roleNames: [],
};

export interface OrganizationCreateDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: OrganizationCreateFormValues, onError: (error: unknown) => void) => void;
}

// Creates an organization AND its single login account in one request.
// `type` classifies which of rəhbərlik's categories this org belongs to
// (manufacturer/distributor/reseller/government/other) — CENTRAL is never
// offered here (FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 1).
// Central staff accounts are a separate flow (UserCreateDialog).
export function OrganizationCreateDialog({
  open,
  isSubmitting,
  onClose,
  onSubmit,
}: OrganizationCreateDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const rolesQuery = useRoles();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<OrganizationCreateFormValues>({
    resolver: zodResolver(organizationCreateFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormError(null);
    reset(DEFAULT_VALUES);
  }, [open, reset]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 400 && error.validationErrors) {
        const entries = Object.entries(error.validationErrors);
        const fieldEntries = entries.filter(([field]) => field in DEFAULT_VALUES);
        fieldEntries.forEach(([field, message]) => {
          setError(field as keyof OrganizationCreateFormValues, { type: 'server', message });
        });
        // Some 400s carry a validation message under a key that isn't one of
        // our known form fields (e.g. a business-rule check like "ADMIN role
        // cannot be assigned to an organization account" isn't tied to any
        // single input) — surfacing it beats the generic "xəta var" dead end.
        const unmatched = entries.filter(([field]) => !(field in DEFAULT_VALUES)).map(([, message]) => message);
        setFormError(unmatched.length > 0 ? unmatched.join(' ') : fieldEntries.length > 0 ? null : getApiErrorMessage(error));
      } else if (error.status === 400) {
        // Some 400s are a flat business-rule rejection with no
        // `validationErrors` map at all (e.g. "Email is already taken: ..."
        // — confirmed live 2026-08-04, this was silently swallowed before,
        // always showing the generic "xəta var" banner with no way to tell
        // what was actually wrong). `error.message` is the real backend text.
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

  const roleOptions = rolesQuery.data ?? [];

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="sm" fullWidth>
      <DialogTitle>Yeni Təşkilat</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Typography variant="subtitle2" color="text.secondary">
            Təşkilat məlumatları
          </Typography>

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

          <Stack direction="row" spacing={2}>
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
          </Stack>

          <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
            Giriş hesabı
          </Typography>

          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="İstifadəçi adı"
                fullWidth
                error={!!errors.username}
                helperText={errors.username?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="E-poçt"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="password"
                label="Şifrə"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message ?? 'Ən azı 8 simvol.'}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="roleNames"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                options={roleOptions.map((role) => role.name)}
                value={field.value}
                onChange={(_event, value) => field.onChange(value)}
                loading={rolesQuery.isLoading}
                disabled={isSubmitting}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rollar"
                    error={!!errors.roleNames}
                    helperText={errors.roleNames?.message}
                  />
                )}
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
