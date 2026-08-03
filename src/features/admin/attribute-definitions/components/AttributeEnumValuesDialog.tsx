import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import {
  useAttributeEnumValues,
  useCreateAttributeEnumValue,
  useDeleteAttributeEnumValue,
  useUpdateAttributeEnumValue,
} from '../hooks/useAttributeEnumValues';

export interface AttributeEnumValuesDialogProps {
  open: boolean;
  definitionId: string | null;
  definitionName: string;
  onClose: () => void;
}

// Kept as a lightweight standalone dialog (no react-hook-form/Zod layer) —
// each row is a single free-text value + active toggle, so per-row local
// state is simpler than wiring a form for one field.
export function AttributeEnumValuesDialog({
  open,
  definitionId,
  definitionName,
  onClose,
}: AttributeEnumValuesDialogProps) {
  const [newValue, setNewValue] = useState('');
  const enumValuesQuery = useAttributeEnumValues(definitionId);
  const createMutation = useCreateAttributeEnumValue(definitionId ?? '');
  const updateMutation = useUpdateAttributeEnumValue(definitionId ?? '');
  const deleteMutation = useDeleteAttributeEnumValue(definitionId ?? '');

  const values = enumValuesQuery.data ?? [];

  function handleAdd() {
    const value = newValue.trim();
    if (!value) {
      return;
    }
    createMutation.mutate(
      { value, sortOrder: values.length, active: true },
      { onSuccess: () => setNewValue('') },
    );
  }

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="xs" fullWidth>
      <DialogTitle>{`"${definitionName}" — icazə verilən dəyərlər`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {enumValuesQuery.isLoading && (
            <Stack sx={{ alignItems: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Stack>
          )}

          {enumValuesQuery.isError && (
            <Alert severity="error">{getApiErrorMessage(enumValuesQuery.error)}</Alert>
          )}

          {!enumValuesQuery.isLoading && values.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Hələ heç bir dəyər yoxdur.
            </Typography>
          )}

          {values.map((enumValue) => (
            <Stack key={enumValue.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flexGrow: 1 }}>{enumValue.value}</Typography>
              <Switch
                size="small"
                checked={enumValue.active}
                onChange={(event) =>
                  updateMutation.mutate({
                    id: enumValue.id,
                    payload: {
                      value: enumValue.value,
                      sortOrder: enumValue.sortOrder,
                      active: event.target.checked,
                    },
                  })
                }
              />
              <IconButton
                size="small"
                aria-label="sil"
                onClick={() => deleteMutation.mutate(enumValue.id)}
              >
                <DeleteRoundedIcon fontSize="small" color="error" />
              </IconButton>
            </Stack>
          ))}

          <Stack direction="row" spacing={1}>
            <TextField
              label="Yeni dəyər"
              size="small"
              fullWidth
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAdd();
                }
              }}
              disabled={createMutation.isPending}
            />
            <Button
              startIcon={<AddRoundedIcon />}
              onClick={handleAdd}
              disabled={createMutation.isPending || !newValue.trim()}
            >
              Əlavə et
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Bağla</Button>
      </DialogActions>
    </Dialog>
  );
}
