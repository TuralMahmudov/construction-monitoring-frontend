import { useMemo, useState } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import dayjs from 'dayjs';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { isCentralAdmin } from '../../../../shared/lib/permissions';
import { useResourceLookup } from '../../../resources/hooks/useResourceLookup';
import { useRegionLookup } from '../../../resources/prices/hooks/useRegionLookup';
import { useApproveFlaggedPrice, useFlaggedPrices, useRejectFlaggedPrice } from '../hooks/useFlaggedPrices';
import type { FlaggedPriceReviewResponse } from '../types/flaggedPrice.types';

export function FlaggedPricesPage() {
  const { user } = useAuth();
  const canAccess = isCentralAdmin(user?.roles ?? []);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const listQuery = useFlaggedPrices({
    page: paginationModel.page,
    size: paginationModel.pageSize,
    sort: 'createdDate,asc',
  });
  const approveMutation = useApproveFlaggedPrice();
  const rejectMutation = useRejectFlaggedPrice();

  const rows = listQuery.data?.content ?? [];
  const resourceIds = useMemo(
    () => (listQuery.data?.content ?? []).map((row) => row.resourceId),
    [listQuery.data],
  );
  const resourceLookup = useResourceLookup(resourceIds);
  const regionNames = useRegionLookup();

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  const columns: GridColDef<FlaggedPriceReviewResponse>[] = [
    {
      field: 'resourceId',
      headerName: 'Resurs',
      flex: 1,
      minWidth: 200,
      sortable: false,
      valueGetter: (_value, row) => {
        const resource = resourceLookup.get(row.resourceId);
        return resource ? `${resource.product.code} — ${resource.product.name}` : row.resourceId;
      },
    },
    {
      field: 'regionId',
      headerName: 'Region',
      width: 140,
      sortable: false,
      valueGetter: (_value, row) => regionNames.get(row.regionId) ?? '—',
    },
    {
      field: 'organizationId',
      headerName: 'Təşkilat',
      width: 200,
      sortable: false,
      valueGetter: (_value, row) => row.organizationName,
    },
    {
      field: 'price',
      headerName: 'Qiymət',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_value, row) => `${row.price.toFixed(2)} ${row.currency}`,
    },
    {
      field: 'currentMedianPrice',
      headerName: 'Bazar Medianı',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_value, row) => (row.currentMedianPrice != null ? row.currentMedianPrice.toFixed(2) : '—'),
    },
    {
      field: 'deviationPercent',
      headerName: 'Fərq (%)',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const deviation = params.row.deviationPercent;
        if (deviation == null) {
          return '—';
        }
        const isLarge = Math.abs(deviation) > 100;
        return (
          <Box component="span" sx={{ color: isLarge ? 'error.main' : 'text.primary', fontWeight: isLarge ? 700 : 400 }}>
            {deviation > 0 ? '+' : ''}
            {deviation.toFixed(2)}%
          </Box>
        );
      },
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
      width: 110,
      getActions: (params) => [
        <GridActionsCellItem
          key="approve"
          icon={<CheckRoundedIcon color="success" />}
          label="Təsdiqlə"
          onClick={() => approveMutation.mutate(params.row.id)}
        />,
        <GridActionsCellItem
          key="reject"
          icon={<CloseRoundedIcon color="error" />}
          label="Rədd et"
          onClick={() => rejectMutation.mutate(params.row.id)}
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
        title="Kənar Dəyər Qiymətlər"
        subtitle="Bazar medianından əhəmiyyətli dərəcədə fərqləndiyi üçün avtomatik işarələnmiş qiymətlər"
      />

      <Card>
        <DataGrid
          autoHeight
          rows={rows}
          rowCount={listQuery.data?.totalElements ?? 0}
          loading={listQuery.isFetching}
          columns={columns}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: 'Hazırda kənar dəyər kimi işarələnmiş qiymət yoxdur.' }}
        />
      </Card>
    </PageContainer>
  );
}
