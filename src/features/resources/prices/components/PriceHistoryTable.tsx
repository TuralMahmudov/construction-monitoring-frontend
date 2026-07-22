import dayjs from 'dayjs';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { PRICE_STATUS, type ResourcePrice } from '../types/resourcePrice.types';
import { useRegionSupplierLookup } from '../hooks/useRegionSupplierLookup';
import { PriceStatusChip } from './PriceStatusChip';

export interface PriceHistoryTableProps {
  prices: ResourcePrice[];
  canEdit: boolean;
  canApprove: boolean;
  onEdit: (price: ResourcePrice) => void;
  onApprove: (price: ResourcePrice) => void;
  onReject: (price: ResourcePrice) => void;
}

export function PriceHistoryTable({
  prices,
  canEdit,
  canApprove,
  onEdit,
  onApprove,
  onReject,
}: PriceHistoryTableProps) {
  const { regionNames, supplierNames } = useRegionSupplierLookup();

  if (prices.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Hələ heç bir qiymət yaradılmayıb.
      </Typography>
    );
  }

  const showActions = canEdit || canApprove;

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Təchizatçı</TableCell>
            <TableCell>Region</TableCell>
            <TableCell align="right">Qiymət</TableCell>
            <TableCell align="right">ƏDV</TableCell>
            <TableCell>Valyuta</TableCell>
            <TableCell>Effektiv tarix</TableCell>
            <TableCell>Bitmə tarixi</TableCell>
            <TableCell>Status</TableCell>
            {showActions && <TableCell align="right">Əməliyyatlar</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {prices.map((price) => {
            const isPending = price.status === PRICE_STATUS.PENDING;
            return (
              <TableRow key={price.id} hover>
                <TableCell>{supplierNames.get(price.supplierId) ?? '—'}</TableCell>
                <TableCell>{regionNames.get(price.regionId) ?? '—'}</TableCell>
                <TableCell align="right">{price.price.toFixed(2)}</TableCell>
                <TableCell align="right">{price.vat.toFixed(2)}%</TableCell>
                <TableCell>{price.currency}</TableCell>
                <TableCell>{dayjs(price.effectiveDate).format('DD.MM.YYYY')}</TableCell>
                <TableCell>{price.expireDate ? dayjs(price.expireDate).format('DD.MM.YYYY') : '—'}</TableCell>
                <TableCell>
                  <PriceStatusChip status={price.status} />
                </TableCell>
                {showActions && (
                  <TableCell align="right">
                    {canEdit &&
                      (isPending ? (
                        <IconButton size="small" onClick={() => onEdit(price)} aria-label="redaktə et">
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Tooltip title="Təsdiqlənmiş/rədd edilmiş qiymət redaktə oluna bilməz — yenisini yaradın.">
                          <span>
                            <IconButton size="small" disabled aria-label="redaktə et">
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ))}
                    {canApprove && isPending && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => onApprove(price)}
                          aria-label="təsdiqlə"
                        >
                          <CheckRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onReject(price)}
                          aria-label="rədd et"
                        >
                          <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
