import dayjs from 'dayjs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { MyResourcePrice } from '../types/price.types';
import { useRegionLookup } from '../hooks/useRegionLookup';

export interface MyResourcePricesListProps {
  prices: MyResourcePrice[];
}

export function MyResourcePricesList({ prices }: MyResourcePricesListProps) {
  const regionNames = useRegionLookup();

  if (prices.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2" sx={{ py: 1 }}>
        Hələ heç bir qiymət əlavə edilməyib.
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Region</TableCell>
            <TableCell align="right">Qiymət</TableCell>
            <TableCell>Valyuta</TableCell>
            <TableCell>Effektiv tarix</TableCell>
            <TableCell>Bitmə tarixi</TableCell>
            <TableCell>Şərh</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {prices.map((price) => (
            <TableRow key={price.id} hover>
              <TableCell>{regionNames.get(price.regionId) ?? '—'}</TableCell>
              <TableCell align="right">{price.price.toFixed(2)}</TableCell>
              <TableCell>{price.currency}</TableCell>
              <TableCell>{dayjs(price.effectiveDate).format('DD.MM.YYYY')}</TableCell>
              <TableCell>{price.expireDate ? dayjs(price.expireDate).format('DD.MM.YYYY') : '—'}</TableCell>
              <TableCell>{price.comment || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
