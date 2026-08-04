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
import { useRegionOrganizationLookup } from '../hooks/useRegionOrganizationLookup';
import { PriceStatusChip } from './PriceStatusChip';

export interface PriceHistoryTableProps {
  prices: ResourcePrice[];
  canEdit: boolean;
  canApprove: boolean;
  currentUserId: string | null;
  isCentralAdmin: boolean;
  onEdit: (price: ResourcePrice) => void;
  onApprove: (price: ResourcePrice) => void;
  onReject: (price: ResourcePrice) => void;
}

export function PriceHistoryTable({
  prices,
  canEdit,
  canApprove,
  currentUserId,
  isCentralAdmin,
  onEdit,
  onApprove,
  onReject,
}: PriceHistoryTableProps) {
  const { regionNames, organizationNames } = useRegionOrganizationLookup(isCentralAdmin);

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
            <TableCell>Təşkilat</TableCell>
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
            const isActionable = price.status === PRICE_STATUS.PENDING || price.status === PRICE_STATUS.FLAGGED;
            const canEditRow = isActionable && (price.createdBy === currentUserId || isCentralAdmin);
            return (
              <TableRow key={price.id} hover>
                <TableCell>{organizationNames.get(price.organizationId) ?? '—'}</TableCell>
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
                      (canEditRow ? (
                        <IconButton size="small" onClick={() => onEdit(price)} aria-label="redaktə et">
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Tooltip
                          title={
                            isActionable
                              ? 'Bu qiyməti yalnız onu göndərən istifadəçi və ya admin redaktə edə bilər.'
                              : 'Təsdiqlənmiş/rədd edilmiş qiymət redaktə oluna bilməz — yenisini yaradın.'
                          }
                        >
                          <span>
                            <IconButton size="small" disabled aria-label="redaktə et">
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ))}
                    {canApprove && isActionable && (
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
