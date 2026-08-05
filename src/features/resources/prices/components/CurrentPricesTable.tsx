import dayjs from 'dayjs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useRegionLookup } from '../hooks/useRegionLookup';
import type { CurrentPriceEntry } from '../utils/groupCurrentPrices';

export interface CurrentPricesTableProps {
  entries: CurrentPriceEntry[];
}

export function CurrentPricesTable({ entries }: CurrentPricesTableProps) {
  const regionNames = useRegionLookup();

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
              <TableCell>{entry.price.organizationName}</TableCell>
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
