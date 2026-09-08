import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import PriceChangeRoundedIcon from '@mui/icons-material/PriceChangeRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../../hooks/useAuth';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { azGridLocaleText } from '../../../theme/dataGridLocaleText';
import { canWrite } from '../../../shared/lib/permissions';
import { productDisplayLabel } from '../../../shared/lib/productLabel';
import { searchResources } from '../../resources/api/resourcesApi';
import { resourceKeys } from '../../resources/hooks/queryKeys';
import { ResourcePriceQuickDialog } from '../../resources/prices/components/ResourcePriceQuickDialog';
import type { Resource } from '../../resources/types/resource.types';
import type { CcmsDocument } from '../types/document.types';

export interface DocumentResourcesViewDialogProps {
  document: CcmsDocument | null;
  onClose: () => void;
}

// § 5 — hansı resurslar bu sənəddən yarandığını göstərir (GET
// /api/resources?documentId=), Resource cədvəlinin özü dəyişməyib, yalnız bu
// filtrlə yeni bir görünüş. Qiymət sütunu/düyməsi 2026-08-11 əlavə olundu —
// "Emal et" formunda qiymət hər sətir üçün opsionaldır, ona görə burada hansı
// resursun qiymətsiz qaldığını görüb tamamlamaq lazım gəlir. Queried directly
// (not via the shared useResourceSearch) so it can stay `enabled`-gated on
// the dialog actually being open — this mounts permanently on DocumentsAdminPage.
export function DocumentResourcesViewDialog({ document, onClose }: DocumentResourcesViewDialogProps) {
  const { user } = useAuth();
  const canAddPrice = canWrite(user?.roles ?? []);
  const [priceTarget, setPriceTarget] = useState<Resource | null>(null);

  const params = { documentId: document?.id, size: 200, sort: 'createdDate,desc' };
  const searchQuery = useQuery({
    queryKey: resourceKeys.search(params),
    queryFn: () => searchResources(params),
    enabled: Boolean(document),
  });

  const columns: GridColDef<Resource>[] = [
    { field: 'code', headerName: 'Kod', width: 120, valueGetter: (_value, row) => row.product.code },
    {
      field: 'name',
      headerName: 'Ad',
      flex: 1,
      minWidth: 320,
      // bax productDisplayLabel (shared/lib) — description only wins when it
      // carries the attribute summary, not for a bare category-name
      // description. İstehsalçı/Model sütunları bilərəkdən çıxarılıb (Tural,
      // 2026-08-31) — description artıq tam görünsün deyə, ayrıca dar
      // sütunlara ehtiyac qalmadı.
      valueGetter: (_value, row) => productDisplayLabel(row.product.name, row.product.description),
    },
    {
      field: 'hasPrice',
      headerName: 'Qiymət',
      width: canAddPrice ? 110 : 70,
      sortable: false,
      filterable: false,
      renderCell: (cellParams) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
          <Tooltip title={cellParams.row.hasPrice ? 'Qiymət əlavə olunub' : 'Qiymət yoxdur'}>
            <CircleRoundedIcon sx={{ fontSize: 10, color: cellParams.row.hasPrice ? 'success.main' : 'text.disabled' }} />
          </Tooltip>
          {canAddPrice && (
            <Tooltip title="Qiymət əlavə et">
              <IconButton size="small" onClick={() => setPriceTarget(cellParams.row)}>
                <PriceChangeRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Dialog open={document !== null} onClose={ignoreBackdropClose(onClose)} maxWidth="md" fullWidth>
        <DialogTitle>
          {document ? `Yaranan resurslar: ${document.originalFilename}` : ''}
          {searchQuery.data && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({searchQuery.data.totalElements} resurs)
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mb: 2 }}>
            {document?.description && (
              <Typography variant="body2" color="text.secondary">
                {document.description}
              </Typography>
            )}
          </Stack>
          {searchQuery.isError && <Alert severity="error">{getApiErrorMessage(searchQuery.error)}</Alert>}
          {!searchQuery.isError && (
            <DataGrid
              autoHeight
              rows={searchQuery.data?.content ?? []}
              columns={columns}
              loading={searchQuery.isFetching}
              disableRowSelectionOnClick
              localeText={{ ...azGridLocaleText, noRowsLabel: 'Bu sənəddən hələ resurs yaradılmayıb.' }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Bağla</Button>
        </DialogActions>
      </Dialog>

      <ResourcePriceQuickDialog
        open={priceTarget !== null}
        resourceId={priceTarget?.id ?? null}
        resourceLabel={priceTarget ? `${priceTarget.product.code} — ${productDisplayLabel(priceTarget.product.name, priceTarget.product.description)}` : ''}
        organizationId={priceTarget?.organizationId ?? null}
        onClose={() => setPriceTarget(null)}
      />
    </>
  );
}
