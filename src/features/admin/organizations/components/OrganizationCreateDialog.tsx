import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ApiError } from '../../../../services/httpClient';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import {
  ORGANIZATION_TYPE_ICONS,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_OPTIONS,
  type OrganizationCreateFormValues,
  type OrganizationCreatePayload,
} from '../types/organization.types';
import { organizationCreateFormSchema } from '../utils/organizationForm.schema';

// Tural, 2026-09-07: a vendor admin shouldn't have to think about roles at
// all. FRONTEND_AI_PROMPT_CENTRAL_ORG_AND_ROLES.md § 1 (updated same day)
// made `roleNames` fully optional on this endpoint — omit it and the backend
// itself defaults every vendor login to OPERATOR (the one role that carries
// DOCUMENT_UPLOAD, a vendor account's only real capability now that "Mənim
// Resurslarım" is gone). So there's no field to fix client-side either: no
// picker, no constant, `roleNames` just isn't part of this form anymore.
const DEFAULT_VALUES: OrganizationCreateFormValues = {
  name: '',
  type: ORGANIZATION_TYPE_OPTIONS[0],
  taxId: '',
  contactInfo: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
};

export interface OrganizationCreateDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: OrganizationCreatePayload, onError: (error: unknown) => void) => void;
}

// Creates an organization AND its single login account in one request.
// `type` classifies which of rəhbərlik's categories this org belongs to
// (manufacturer/distributor/reseller/government/other) — CENTRAL is never
// offered here (FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 1).
// Central staff accounts are a separate flow (UserCreateDialog).
//
// `email` moved out of the login-account group and into "Təşkilat
// məlumatları" 2026-08-12 (FRONTEND_AI_PROMPT_ORGANIZATION_EMAIL.md § 4) —
// it's optional contact info now, not a credential; login is username+
// password only, always was.
export function OrganizationCreateDialog({
  open,
  isSubmitting,
  onClose,
  onSubmit,
}: OrganizationCreateDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isValid },
  } = useForm<OrganizationCreateFormValues>({
    resolver: zodResolver(organizationCreateFormSchema),
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

  const submit = handleSubmit(({ confirmPassword: _confirmPassword, ...payload }) => {
    setFormError(null);
    onSubmit(payload, handleApiError);
  });

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
                label="Ad *"
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
                label="Təşkilat növü *"
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
                  placeholder="məs. 1234567890"
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
                  placeholder="məs. +994 XX XXX XX XX"
                  fullWidth
                  error={!!errors.contactInfo}
                  helperText={errors.contactInfo?.message}
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
                label="E-poçt"
                placeholder="məs. contact@example.com"
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
