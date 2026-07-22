import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import Avatar from '@mui/material/Avatar';

export function Logo() {
  return (
    <Avatar
      variant="rounded"
      sx={{
        width: 56,
        height: 56,
        bgcolor: 'primary.main',
      }}
    >
      <ApartmentRoundedIcon fontSize="large" />
    </Avatar>
  );
}
