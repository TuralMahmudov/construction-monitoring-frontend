import { useMemo, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { isCentralAdmin } from '../../../../shared/lib/permissions';
import { azGridLocaleText } from '../../../../theme/dataGridLocaleText';
import { OrganizationCreateDialog } from '../components/OrganizationCreateDialog';
import { OrganizationEditDialog } from '../components/OrganizationEditDialog';
import { OrganizationStatusChip } from '../components/OrganizationStatusChip';
import { OrganizationTypeChip } from '../components/OrganizationTypeChip';
import { useCreateOrganization, useOrganizationsList, useUpdateOrganization } from '../hooks/useOrganizations';
import {
  ORGANIZATION_STATUS_LABELS,
  ORGANIZATION_STATUS_OPTIONS,
  ORGANIZATION_TYPE_ICONS,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_OPTIONS,
  type CreatableOrganizationType,
  type Organization,
  type OrganizationStatus,
  type OrganizationType,
} from '../types/organization.types';

export function OrganizationsPage() {
  const { user } = useAuth();
  const canAccess = isCentralAdmin(user?.roles ?? []);

  const [filters, setFilters] = useState<{ name?: string; status?: OrganizationStatus; type?: OrganizationType }>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [sortField, setSortField] = useState<string | undefined>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Memoized so the array reference only changes when the sort actually
  // does — DataGrid treats a new `sortModel` reference as an external sort
  // change and resets pagination to page 0 on every unrelated re-render
  // otherwise (bax useGridPaginationModel's `sortModelChange` listener).
  const sortModel = useMemo(
    () => (sortField ? [{ field: sortField, sort: sortDirection }] : []),
    [sortField, sortDirection],
  );

  const listQuery = useOrganizationsList({
    ...filters,
    page: paginationModel.page,
    size: paginationModel.pageSize,
    sort: sortField ? `${sortField},${sortDirection}` : undefined,
  });
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Organization | null>(null);

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  const columns: GridColDef<Organization>[] = [
    { field: 'name', headerName: 'Ad', flex: 1, minWidth: 200 },
    {
      field: 'type',
      headerName: 'Növ',
      width: 170,
      sortable: false,
      renderCell: (params) => <OrganizationTypeChip type={params.row.type} />,
    },
    { field: 'taxId', headerName: 'VÖEN', width: 140, valueGetter: (_value, row) => row.taxId ?? '—' },
    { field: 'username', headerName: 'İstifadəçi adı', width: 160, sortable: false, valueGetter: (_value, row) => row.username ?? '—' },
    {
      field: 'contactInfo',
      headerName: 'Əlaqə məlumatı',
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row.contactInfo ?? '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      sortable: false,
      renderCell: (params) => <OrganizationStatusChip status={params.row.status} />,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Əməliyyatlar',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditRoundedIcon />}
          label="Redaktə et"
          onClick={() => setEditTarget(params.row)}
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
        title="Təşkilatlar"
        actions={
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setCreateOpen(true)}>
            Yeni təşkilat
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            label="Ad"
            fullWidth
            size="small"
            value={filters.name ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value || undefined }))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            select
            label="Status"
            fullWidth
            size="small"
            value={filters.status ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value ? (Number(event.target.value) as OrganizationStatus) : undefined,
              }))
            }
          >
            <MenuItem value="">Hamısı</MenuItem>
            {ORGANIZATION_STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {ORGANIZATION_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            select
            label="Növ"
            fullWidth
            size="small"
            value={filters.type ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                type: event.target.value ? (Number(event.target.value) as OrganizationType) : undefined,
              }))
            }
          >
            <MenuItem value="">Hamısı</MenuItem>
            {ORGANIZATION_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>
                {ORGANIZATION_TYPE_ICONS[type]} {ORGANIZATION_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          autoHeight
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
          localeText={{
            ...azGridLocaleText,
            noRowsLabel: 'Hələ heç bir təşkilat yoxdur — "Yeni təşkilat" ilə əlavə edin.',
          }}
        />
      </Card>

      <OrganizationCreateDialog
        open={createOpen}
        isSubmitting={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values, onError) =>
          createMutation.mutate(values, { onSuccess: () => setCreateOpen(false), onError })
        }
      />

      <OrganizationEditDialog
        open={Boolean(editTarget)}
        username={editTarget?.username}
        editValues={
          editTarget
            ? {
                name: editTarget.name,
                // CENTRAL(1) is never a real DB row (bax organization.types.ts),
                // so any org actually returned by GET /api/organizations is
                // always one of the creatable types.
                type: editTarget.type as CreatableOrganizationType,
                taxId: editTarget.taxId ?? '',
                contactInfo: editTarget.contactInfo ?? '',
                email: editTarget.email ?? '',
                status: editTarget.status,
              }
            : null
        }
        isSubmitting={updateMutation.isPending}
        onClose={() => setEditTarget(null)}
        onSubmit={(values, onError) => {
          if (!editTarget) {
            return;
          }
          updateMutation.mutate(
            { id: editTarget.id, payload: values },
            { onSuccess: () => setEditTarget(null), onError },
          );
        }}
      />
    </PageContainer>
  );
}
