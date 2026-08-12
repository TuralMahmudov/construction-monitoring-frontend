import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ApiError } from '../../../../services/httpClient';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import { useRoles } from '../../roles/hooks/useRoles';
import type { UserCreateFormValues, UserCreatePayload } from '../types/user.types';
import { userCreateFormSchema } from '../utils/userForm.schema';

const DEFAULT_VALUES: UserCreateFormValues = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  roleNames: [],
};

export interface UserCreateDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: UserCreatePayload, onError: (error: unknown) => void) => void;
}

// Only ever creates mərkəzi (central) individual staff — organizationId/
// actorType aren't fields here, the server always sets them to null/
// INDIVIDUAL (FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md § 3). Vendor accounts
// are created via OrganizationCreateDialog instead.
//
// Unlike Organization's, `email` here is still a mandatory, validated
// login-account field (FRONTEND_AI_PROMPT_ORGANIZATION_EMAIL.md § 5
// explicitly leaves this endpoint's contract untouched) — it's grouped with
// Ad/Soyad above "Giriş hesabı" purely for layout symmetry with the org
// form, not because its backend role changed.
export function UserCreateDialog({ open, isSubmitting, onClose, onSubmit }: UserCreateDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const rolesQuery = useRoles();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isValid },
  } = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const password = watch('password');
  const hasMinLength = password.length >= 8;

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
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

  const submit = handleSubmit(({ confirmPassword: _confirmPassword, ...payload }) => {
    setFormError(null);
    onSubmit(payload, handleApiError);
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
                  label="Ad *"
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
                  label="Soyad *"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Stack>

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="email"
                label="E-poçt *"
                fullWidth
                autoComplete="off"
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
            Giriş hesabı
          </Typography>

          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="İstifadəçi adı *"
                fullWidth
                autoComplete="off"
                error={!!errors.username}
                helperText={errors.username?.message}
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
                type={showPassword ? 'text' : 'password'}
                label="Şifrə *"
                fullWidth
                autoComplete="new-password"
                error={!!errors.password}
                disabled={isSubmitting}
                helperText={
                  errors.password?.message ?? (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }} component="span">
                      {hasMinLength ? (
                        <CheckCircleRoundedIcon color="success" sx={{ fontSize: 14 }} />
                      ) : (
                        <CancelRoundedIcon color="error" sx={{ fontSize: 14 }} />
                      )}
                      <span>Ən azı 8 simvol.</span>
                    </Stack>
                  )
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                          aria-label={showPassword ? 'şifrəni gizlət' : 'şifrəni göstər'}
                        >
                          {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type={showConfirmPassword ? 'text' : 'password'}
                label="Şifrəni təkrarla *"
                fullWidth
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                disabled={isSubmitting}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                          aria-label={showConfirmPassword ? 'şifrəni gizlət' : 'şifrəni göstər'}
                        >
                          {showConfirmPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
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
                    label="Rollar *"
                    error={!!errors.roleNames}
                    helperText={errors.roleNames?.message}
                  />
                )}
              />
            )}
          />

          <Typography variant="caption" color="text.secondary">
            * mütləq doldurulmalı sahələr
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          İmtina
        </Button>
        <Button variant="contained" onClick={submit} disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
