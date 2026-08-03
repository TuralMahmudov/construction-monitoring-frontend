import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

export interface OrganizationChipProps {
  organizationId: string | null;
}

// There's no /api/organizations lookup on the backend yet, so a non-null id
// can only be shown as a raw UUID (in the tooltip) — never a resolved name.
export function OrganizationChip({ organizationId }: OrganizationChipProps) {
  if (!organizationId) {
    return <Chip size="small" label="Ümumi/Mərkəzi" color="default" variant="outlined" />;
  }

  return (
    <Tooltip title={organizationId}>
      <Chip size="small" label="Təşkilata məxsus" color="primary" variant="outlined" />
    </Tooltip>
  );
}
