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
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { ApiError } from '../../../../services/httpClient';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import { useRoles } from '../../roles/hooks/useRoles';
import type { UserCreateFormValues } from '../types/user.types';
import { userCreateFormSchema } from '../utils/userForm.schema';

const DEFAULT_VALUES: UserCreateFormValues = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  roleNames: [],
};

export interface UserCreateDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: UserCreateFormValues, onError: (error: unknown) => void) => void;
}

// Only ever creates mərkəzi (central) individual staff — organizationId/
// actorType aren't fields here, the server always sets them to null/
// INDIVIDUAL (FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md § 3). Vendor accounts
// are created via OrganizationCreateDialog instead.
export function UserCreateDialog({ open, isSubmitting, onClose, onSubmit }: UserCreateDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const rolesQuery = useRoles();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateFormSchema),
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
        const fieldEntries = Object.entries(error.validationErrors).filter(([field]) => field in DEFAULT_VALUES);
        fieldEntries.forEach(([field, message]) => {
          setError(field as keyof UserCreateFormValues, { type: 'server', message });
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
      <DialogTitle>Yeni İstifadəçi</DialogTitle>
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
