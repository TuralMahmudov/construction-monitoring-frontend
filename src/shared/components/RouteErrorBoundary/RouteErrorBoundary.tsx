import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export function RouteErrorBoundary() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : 'Gözlənilməyən xəta baş verdi.';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Xəta baş verdi
      </Typography>
      <Typography color="text.secondary">{message}</Typography>
      <Button variant="contained" onClick={() => window.location.assign('/')}>
        Ana səhifəyə qayıt
      </Button>
    </Box>
  );
}
