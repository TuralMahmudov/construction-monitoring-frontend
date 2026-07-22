import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        İdarə Paneli
      </Typography>
      <Typography color="text.secondary">
        Bu, idarə paneli üçün yer tutucu səhifədir.
      </Typography>
    </Box>
  );
}
