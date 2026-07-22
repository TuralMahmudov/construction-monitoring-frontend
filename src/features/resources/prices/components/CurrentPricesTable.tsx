import dayjs from 'dayjs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useRegionSupplierLookup } from '../hooks/useRegionSupplierLookup';
import type { CurrentPriceEntry } from '../utils/groupCurrentPrices';

export interface CurrentPricesTableProps {
  entries: CurrentPriceEntry[];
}

export function CurrentPricesTable({ entries }: CurrentPricesTableProps) {
  const { regionNames, supplierNames } = useRegionSupplierLookup();

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
            <TableCell>Təchizatçı</TableCell>
            <TableCell>Region</TableCell>
            <TableCell align="right">Qiymət</TableCell>
            <TableCell>Etibarlıdır</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={`${entry.supplierId}-${entry.regionId}`} hover>
              <TableCell>{supplierNames.get(entry.supplierId) ?? '—'}</TableCell>
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
