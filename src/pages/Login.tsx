import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/LoginForm';
import { useLogin } from '../hooks/useLogin';

const APP_TITLE = 'Tikinti Qiymətlərinin Monitorinqi Sistemi';
const APP_VERSION = 'Versiya 1.0.0';

export function Login() {
  const { submitLogin, isLoading, error, fieldErrors } = useLogin();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={1} sx={{ alignItems: 'center', mb: 4 }}>
            <Logo />
            <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
              {APP_TITLE}
            </Typography>
          </Stack>

          <LoginForm
            onSubmit={submitLogin}
            isSubmitting={isLoading}
            errorMessage={error}
            fieldErrors={fieldErrors}
          />
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
        {APP_VERSION}
      </Typography>
    </Box>
  );
}
