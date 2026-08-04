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
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { ApiError } from '../../../../services/httpClient';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import { useRoles } from '../../roles/hooks/useRoles';
import type { UserUpdateFormValues } from '../types/user.types';
import { userUpdateFormSchema } from '../utils/userForm.schema';

export interface UserEditDialogProps {
  open: boolean;
  editValues: UserUpdateFormValues | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: UserUpdateFormValues, onError: (error: unknown) => void) => void;
}

// No password field — this endpoint doesn't support password reset (§ 3.2).
// `accountNonLocked` isn't part of any GET response either, so it can't be
// pre-filled from real state; it always opens defaulted to "unlocked"
// (editValues.accountNonLocked, set that way by the caller) and only needs
// touching to explicitly lock/unlock someone.
export function UserEditDialog({ open, editValues, isSubmitting, onClose, onSubmit }: UserEditDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const rolesQuery = useRoles();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserUpdateFormValues>({
    resolver: zodResolver(userUpdateFormSchema),
    defaultValues: editValues ?? undefined,
  });

  useEffect(() => {
    if (!open || !editValues) {
      return;
    }
    setFormError(null);
    reset(editValues);
  }, [open, editValues, reset]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 400 && error.validationErrors) {
        const fieldEntries = Object.entries(error.validationErrors).filter(
          ([field]) => field === 'firstName' || field === 'lastName' || field === 'roleNames',
        );
        fieldEntries.forEach(([field, message]) => {
          setError(field as keyof UserUpdateFormValues, { type: 'server', message });
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

  const roleOptions = rolesQuery.data ?? [];

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="xs" fullWidth>
      <DialogTitle>İstifadəçini redaktə et</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Stack direction="row" spacing={2}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Ad"
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  disabled={isSubmitting}
                />
              )}
            />
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Soyad"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Stack>

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

          <Controller
            name="enabled"
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

          <Controller
            name="accountNonLocked"
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
                label="Kilidlənməyib"
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
