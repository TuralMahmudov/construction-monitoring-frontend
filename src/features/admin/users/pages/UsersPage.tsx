import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../../../hooks/useAuth';
import { PageContainer, PageHeader, StatusBadge } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { isCentralAdmin } from '../../../../shared/lib/permissions';
import { UserCreateDialog } from '../components/UserCreateDialog';
import { UserEditDialog } from '../components/UserEditDialog';
import { useCreateUser, useUpdateUser, useUsersList } from '../hooks/useUsers';
import type { CentralUser } from '../types/user.types';

export function UsersPage() {
  const { user } = useAuth();
  const canAccess = isCentralAdmin(user?.roles ?? []);

  const [filters, setFilters] = useState<{ username?: string; enabled?: boolean }>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const listQuery = useUsersList({
    ...filters,
    page: paginationModel.page,
    size: paginationModel.pageSize,
    sort: 'username,asc',
  });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CentralUser | null>(null);

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  const columns: GridColDef<CentralUser>[] = [
    { field: 'username', headerName: 'İstifadəçi adı', width: 160 },
    {
      field: 'fullName',
      headerName: 'Ad Soyad',
      flex: 1,
      minWidth: 160,
      sortable: false,
      valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
    },
    { field: 'email', headerName: 'E-poçt', flex: 1, minWidth: 180 },
    {
      field: 'roles',
      headerName: 'Rollar',
      width: 200,
      sortable: false,
      valueGetter: (_value, row) => row.roles.join(', '),
    },
    {
      field: 'enabled',
      headerName: 'Status',
      width: 110,
      sortable: false,
      renderCell: (params) => <StatusBadge active={params.row.enabled} />,
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
        title="İstifadəçilər"
        subtitle="Mərkəzi heyət — vendor giriş hesabları burada göstərilmir, onlar Təşkilatlar bölməsindədir"
        actions={
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setCreateOpen(true)}>
            Yeni istifadəçi
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ pb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            label="İstifadəçi adı"
            fullWidth
            size="small"
            value={filters.username ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, username: event.target.value || undefined }))
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            select
            label="Status"
            fullWidth
            size="small"
            value={filters.enabled === undefined ? '' : String(filters.enabled)}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                enabled: event.target.value === '' ? undefined : event.target.value === 'true',
              }))
            }
          >
            <MenuItem value="">Hamısı</MenuItem>
            <MenuItem value="true">Aktiv</MenuItem>
            <MenuItem value="false">Deaktiv</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <DataGrid
        autoHeight
        rows={listQuery.data?.content ?? []}
        rowCount={listQuery.data?.totalElements ?? 0}
        loading={listQuery.isFetching}
        columns={columns}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        localeText={{ noRowsLabel: 'Hələ heç bir mərkəzi istifadəçi yoxdur — "Yeni istifadəçi" ilə əlavə edin.' }}
      />

      <UserCreateDialog
        open={createOpen}
        isSubmitting={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values, onError) =>
          createMutation.mutate(values, { onSuccess: () => setCreateOpen(false), onError })
        }
      />

      <UserEditDialog
        open={Boolean(editTarget)}
        editValues={
          editTarget
            ? {
                firstName: editTarget.firstName,
                lastName: editTarget.lastName,
                enabled: editTarget.enabled,
                accountNonLocked: true,
                roleNames: editTarget.roles,
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
