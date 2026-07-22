import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { loginSchema } from '../../utils/loginSchema';
import type { LoginFieldErrors } from '../../hooks/useLogin';
import type { LoginFormValues } from '../../types/auth';

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  isSubmitting: boolean;
  errorMessage?: string | null;
  fieldErrors?: LoginFieldErrors | null;
}

export function LoginForm({ onSubmit, isSubmitting, errorMessage, fieldErrors }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (!fieldErrors) return;
    (Object.entries(fieldErrors) as [keyof LoginFieldErrors, string][]).forEach(
      ([field, message]) => {
        setError(field, { type: 'server', message });
      },
    );
  }, [fieldErrors, setError]);

  return (
    <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Controller
        name="username"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="İstifadəçi adı"
            autoComplete="username"
            fullWidth
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
            label="Şifrə"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isSubmitting}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />

      <Controller
        name="rememberMe"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Checkbox {...field} checked={field.value} disabled={isSubmitting} />}
            label="Məni xatırla"
          />
        )}
      />

      <Button type="submit" variant="contained" size="large" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Daxil olunur...' : 'Daxil ol'}
      </Button>
    </Stack>
  );
}
