import dayjs from 'dayjs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../../../hooks/useAuth';
import { isCentralAdmin } from '../../../../shared/lib/permissions';
import { useRegionOrganizationLookup } from '../hooks/useRegionOrganizationLookup';
import type { CurrentPriceEntry } from '../utils/groupCurrentPrices';

export interface CurrentPricesTableProps {
  entries: CurrentPriceEntry[];
}

export function CurrentPricesTable({ entries }: CurrentPricesTableProps) {
  const { user } = useAuth();
  const { regionNames, organizationNames } = useRegionOrganizationLookup(isCentralAdmin(user?.roles ?? []));

  if (entries.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Hazırda təsdiqlənmiş qiymət yoxdur.
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Təşkilat</TableCell>
            <TableCell>Region</TableCell>
            <TableCell align="right">Qiymət</TableCell>
            <TableCell>Etibarlıdır</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={`${entry.organizationId}-${entry.regionId}`} hover>
              <TableCell>{organizationNames.get(entry.organizationId) ?? '—'}</TableCell>
              <TableCell>{regionNames.get(entry.regionId) ?? '—'}</TableCell>
              <TableCell align="right">
                {entry.price.price.toFixed(2)} {entry.price.currency}
              </TableCell>
              <TableCell>{dayjs(entry.price.effectiveDate).format('DD.MM.YYYY')}-dən</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
