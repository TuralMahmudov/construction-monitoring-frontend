import { useMemo, useState } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import dayjs from 'dayjs';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { isCentralAdmin } from '../../../../shared/lib/permissions';
import { azGridLocaleText } from '../../../../theme/dataGridLocaleText';
import { useCategoryNameLookup } from '../../../resources/hooks/useLookups';
import { useConfirmMatchGroup, useMatchGroupsPendingReview } from '../hooks/useMatchGroups';
import type { MatchGroupReviewResponse } from '../types/matchGroup.types';

export function MatchGroupReviewPage() {
  const { user } = useAuth();
  const canAccess = isCentralAdmin(user?.roles ?? []);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [sortField, setSortField] = useState<string | undefined>('createdDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Memoized so the array reference only changes when the sort actually
  // does — DataGrid treats a new `sortModel` reference as an external sort
  // change and resets pagination to page 0 on every unrelated re-render
  // otherwise (bax useGridPaginationModel's `sortModelChange` listener).
  const sortModel = useMemo(
    () => (sortField ? [{ field: sortField, sort: sortDirection }] : []),
    [sortField, sortDirection],
  );
  const listQuery = useMatchGroupsPendingReview({
    page: paginationModel.page,
    size: paginationModel.pageSize,
    sort: sortField ? `${sortField},${sortDirection}` : undefined,
  });
  const confirmMutation = useConfirmMatchGroup();
  const categoryNames = useCategoryNameLookup();

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  const columns: GridColDef<MatchGroupReviewResponse>[] = [
    {
      field: 'code',
      headerName: 'Kod',
      width: 130,
      sortable: false,
    },
    {
      field: 'name',
      headerName: 'Ad',
      width: 200,
      sortable: false,
    },
    {
      field: 'matchKey',
      headerName: 'Uyğunlaşdırma açarı',
      width: 200,
      sortable: false,
      valueGetter: (_value, row) => row.matchKey || '(boş açar)',
    },
    {
      field: 'categoryId',
      headerName: 'Kateqoriya',
      width: 200,
      sortable: false,
      valueGetter: (_value, row) => categoryNames.get(row.categoryId) ?? row.categoryId,
    },
    {
      field: 'listings',
      headerName: 'Elanlar',
      flex: 1,
      minWidth: 200,
      sortable: false,
      // The old per-row code/name chips are gone — a listing no longer
      // carries them, the product's own code/name (columns above) already
      // covers that once per row (§ 7). Just the listing/organization count.
      renderCell: (params) => (
        <Chip size="small" label={`${params.row.listings.length} təşkilat bu məhsulu elan edir`} />
      ),
    },
    {
      field: 'createdDate',
      headerName: 'Yaradılma tarixi',
      width: 160,
      valueGetter: (_value, row) => dayjs(row.createdDate).format('DD.MM.YYYY HH:mm'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Əməliyyatlar',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="confirm"
          icon={<CheckRoundedIcon color="success" />}
          label="Təsdiqlə"
          onClick={() => confirmMutation.mutate(params.row.id)}
        />,
      ],
    },
  ];

  if (listQuery.isError) {
    return (
      <PageContainer>
        <Alert severity="error">{getApiErrorMessage(listQuery.error)}</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Uyğunlaşdırma Baxışı"
        subtitle="Az məlumatla avtomatik yaradılmış 'eyni məhsul' qruplaşdırmaları — nəzərdən keçirib təsdiqləyin"
      />

      <Card>
        <DataGrid
          autoHeight
          getRowHeight={() => 'auto'}
          rows={listQuery.data?.content ?? []}
          rowCount={listQuery.data?.totalElements ?? 0}
          loading={listQuery.isFetching}
          columns={columns}
          paginationMode="server"
          sortingMode="server"
          sortingOrder={['asc', 'desc']}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={(model) => {
            if (model.length === 0) {
              return;
            }
            setSortField(model[0].field);
            setSortDirection(model[0].sort ?? 'asc');
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          localeText={{ ...azGridLocaleText, noRowsLabel: 'Nəzərdən keçirilməli yeni qruplaşdırma yoxdur.' }}
        />
      </Card>
    </PageContainer>
  );
}
