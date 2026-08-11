import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { ApiError } from '../../../services/httpClient';
import { NumberField } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { ATTRIBUTE_DATA_TYPE_LABELS, type AttributeDefinition } from '../../admin/attribute-definitions/types/attributeDefinition.types';
import type {
  LinkAttributeToCategoryFormValues,
  UpdateCategoryAttributeDefinitionFormValues,
} from '../types/categoryAttributeDefinition.types';
import { linkAttributeFormSchema } from '../utils/categoryAttributeForm.schema';

// LinkAttributeToCategoryFormValues already matches what edit mode needs
// too (UpdateCategoryAttributeDefinitionFormValues is just this minus
// attributeDefinitionId), so one shape covers both — there's no separate
// "active" toggle on this entity (confirmed against the live OpenAPI spec;
// unlinking, not deactivating, is the only removal path).
interface InternalFormValues extends LinkAttributeToCategoryFormValues {}

// Only `required`/`attributeDefinitionId`/`sortOrder` are exposed as actual
// choices. The rest are fixed and not offered as toggles:
// - affectsMatchGroup=true always — left false, it silently breaks
//   find-or-create matching for the whole category (every create attempt
//   then matches the first-ever product regardless of the typed attribute
//   value, bax project memory "affectsMatchGroup misconfiguration" tapılışı,
//   2026-07-31).
// - visible/searchable/filterable=true always — visible is the only one
//   with an actual effect today (shows the attribute input on the create
//   forms); searchable/filterable aren't wired to any real feature yet, so
//   there's no reason to ever turn any of the three off from this dialog.
const DEFAULT_VALUES: InternalFormValues = {
  attributeDefinitionId: '',
  required: false,
  visible: true,
  searchable: true,
  filterable: true,
  sortOrder: 0,
  affectsMatchGroup: true,
};

export interface LinkAttributeDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  editValues: InternalFormValues | null;
  editAttributeName?: string;
  availableDefinitions: AttributeDefinition[];
  // Create mode only — appended silently (currently-linked count), no manual
  // "Sıra nömrəsi" input on this dialog anymore. Reordering after the fact is
  // still possible via edit mode, which is the only place that field shows.
  nextSortOrder: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    values: LinkAttributeToCategoryFormValues | UpdateCategoryAttributeDefinitionFormValues,
    onError: (error: unknown) => void,
  ) => void;
}

export function LinkAttributeDialog({
  open,
  mode,
  editValues,
  editAttributeName,
  availableDefinitions,
  nextSortOrder,
  isSubmitting,
  onClose,
  onSubmit,
}: LinkAttributeDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InternalFormValues>({
    resolver: zodResolver(linkAttributeFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormError(null);
    // Force the fixed fields back to true even for a pre-existing link that
    // was saved with one of them false (before this was locked down) —
    // reopening and saving a broken link is the fix path now that there's
    // no manual toggle for them.
    reset(
      mode === 'edit' && editValues
        ? { ...editValues, visible: true, searchable: true, filterable: true, affectsMatchGroup: true }
        : { ...DEFAULT_VALUES, sortOrder: nextSortOrder },
    );
  }, [open, mode, editValues, nextSortOrder, reset]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 400 && error.validationErrors) {
        const fieldEntries = Object.entries(error.validationErrors).filter(
          ([field]) => field in DEFAULT_VALUES,
        );
        fieldEntries.forEach(([field, message]) => {
          setError(field as keyof InternalFormValues, { type: 'server', message });
        });
        setFormError(fieldEntries.length > 0 ? null : getApiErrorMessage(error));
      } else if (error.status === 409) {
        setFormError('Bu xüsusiyyət növü artıq bu kateqoriyaya bağlıdır.');
      } else {
        setFormError(getApiErrorMessage(error));
      }
    } else {
      setFormError(getApiErrorMessage(error));
    }
  }

  const submit = handleSubmit((values) => {
    setFormError(null);
    if (mode === 'edit') {
      const { attributeDefinitionId: _unused, ...updateValues } = values;
      onSubmit(updateValues, handleApiError);
      return;
    }
    onSubmit(values, handleApiError);
  });

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === 'edit' ? 'Bağlantını konfiqurasiya et' : 'Xüsusiyyət növü bağla'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          {mode === 'edit' ? (
            <TextField label="Xüsusiyyət növü" value={editAttributeName ?? ''} fullWidth disabled />
          ) : (
            <Controller
              name="attributeDefinitionId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Xüsusiyyət növü"
                  fullWidth
                  error={!!errors.attributeDefinitionId}
                  helperText={errors.attributeDefinitionId?.message}
                  disabled={isSubmitting}
                >
                  {availableDefinitions.length === 0 && (
                    <MenuItem value="" disabled>
                      Bağlana biləcək xüsusiyyət növü yoxdur
                    </MenuItem>
                  )}
                  {availableDefinitions.map((definition) => (
                    <MenuItem key={definition.id} value={definition.id}>
                      {definition.name} ({ATTRIBUTE_DATA_TYPE_LABELS[definition.dataType]})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          {mode === 'edit' && (
            <Controller
              name="sortOrder"
              control={control}
              render={({ field }) => (
                <NumberField
                  label="Sıra nömrəsi"
                  fullWidth
                  value={field.value}
                  error={!!errors.sortOrder}
                  helperText={errors.sortOrder?.message}
                  disabled={isSubmitting}
                  onChange={field.onChange}
                />
              )}
            />
          )}

          <Controller
            name="required"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} disabled={isSubmitting} />
                }
                label="Məcburi"
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          İmtina
        </Button>
        <Button variant="contained" onClick={submit} disabled={isSubmitting}>
          {isSubmitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
