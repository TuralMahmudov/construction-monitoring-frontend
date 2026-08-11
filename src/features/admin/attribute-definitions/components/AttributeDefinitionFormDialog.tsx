import { useEffect, useMemo, useState } from 'react';
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
import { useUnitOptions } from '../../../reference-data/hooks/useReferenceOptions';
import { ApiError } from '../../../../services/httpClient';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import { useAllActiveAttributeDefinitions } from '../hooks/useAttributeDefinitions';
import {
  ATTRIBUTE_DATA_TYPE,
  ATTRIBUTE_DATA_TYPE_LABELS,
  ATTRIBUTE_DATA_TYPE_OPTIONS,
  type AttributeDefinitionFormValues,
} from '../types/attributeDefinition.types';
import { attributeDefinitionFormSchema } from '../utils/attributeDefinitionForm.schema';

const MIN_WORD_LEN = 4;

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase('az');
}

// Heuristic only — catches "Diametr" vs "Boru Diametri" (shared word) and
// "Diametr" vs "Diametr2" (substring), not unrelated synonyms like "En" vs
// "Genişlik". A nudge for the admin to check, not a guarantee.
function findSimilarNames(typedName: string, existingNames: string[]): string[] {
  const typed = normalize(typedName);
  if (typed.length < 3) {
    return [];
  }
  const typedWords = typed.split(/[^a-zçəğıöşü0-9]+/i).filter((w) => w.length >= MIN_WORD_LEN);

  return existingNames.filter((existing) => {
    const candidate = normalize(existing);
    if (candidate === typed) {
      return false; // exact match already surfaced via the 409 "already exists" error on submit
    }
    if (candidate.includes(typed) || typed.includes(candidate)) {
      return true;
    }
    const candidateWords = candidate.split(/[^a-zçəğıöşü0-9]+/i);
    return typedWords.some((word) => candidateWords.includes(word));
  });
}

const DEFAULT_VALUES: AttributeDefinitionFormValues = {
  name: '',
  dataType: ATTRIBUTE_DATA_TYPE.TEXT,
  defaultUnitId: null,
  active: true,
};

export interface AttributeDefinitionFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  editValues: AttributeDefinitionFormValues | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: AttributeDefinitionFormValues, onError: (error: unknown) => void) => void;
}

export function AttributeDefinitionFormDialog({
  open,
  mode,
  editValues,
  isSubmitting,
  onClose,
  onSubmit,
}: AttributeDefinitionFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const unitOptions = useUnitOptions();
  const existingDefinitionsQuery = useAllActiveAttributeDefinitions();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<AttributeDefinitionFormValues>({
    resolver: zodResolver(attributeDefinitionFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const dataType = watch('dataType');
  const name = watch('name');

  const similarNames = useMemo(() => {
    if (mode === 'edit') {
      return []; // renaming an existing definition isn't the "accidental duplicate" scenario
    }
    const existingNames = (existingDefinitionsQuery.data?.content ?? []).map((def) => def.name);
    return findSimilarNames(name ?? '', existingNames);
  }, [name, mode, existingDefinitionsQuery.data]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormError(null);
    reset(mode === 'edit' && editValues ? editValues : DEFAULT_VALUES);
  }, [open, mode, editValues, reset]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 400 && error.validationErrors) {
        const fieldEntries = Object.entries(error.validationErrors).filter(
          ([field]) => field in DEFAULT_VALUES,
        );
        fieldEntries.forEach(([field, message]) => {
          setError(field as keyof AttributeDefinitionFormValues, { type: 'server', message });
        });
        setFormError(fieldEntries.length > 0 ? null : getApiErrorMessage(error));
      } else if (error.status === 409) {
        setError('name', { type: 'server', message: 'Bu adda xüsusiyyət növü artıq mövcuddur.' });
      } else {
        setFormError(getApiErrorMessage(error));
      }
    } else {
      setFormError(getApiErrorMessage(error));
    }
  }

  const submit = handleSubmit((values) => {
    setFormError(null);
    onSubmit(
      values.dataType === ATTRIBUTE_DATA_TYPE.NUMBER ? values : { ...values, defaultUnitId: null },
      handleApiError,
    );
  });

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === 'edit' ? 'Xüsusiyyət növünü redaktə et' : 'Yeni xüsusiyyət növü'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Ad"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isSubmitting}
              />
            )}
          />

          {similarNames.length > 0 && (
            <Alert severity="warning">
              Oxşar adlı xüsusiyyət növü artıq mövcuddur: {similarNames.join(', ')}. Eyni xüsusiyyəti
              təkrar yaratmadığınızdan əmin olun.
            </Alert>
          )}

          <Controller
            name="dataType"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Tip"
                fullWidth
                disabled={isSubmitting || mode === 'edit'}
                helperText={mode === 'edit' ? 'Yaradıldıqdan sonra tip dəyişdirilə bilməz.' : undefined}
                onChange={(event) => field.onChange(Number(event.target.value))}
              >
                {ATTRIBUTE_DATA_TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>
                    {ATTRIBUTE_DATA_TYPE_LABELS[type]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {dataType === ATTRIBUTE_DATA_TYPE.NUMBER && (
            <Controller
              name="defaultUnitId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Vahid"
                  fullWidth
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value || null)}
                  error={!!errors.defaultUnitId}
                  helperText={errors.defaultUnitId?.message ?? 'Bu xüsusiyyət növünün bütün dəyərləri bu vahidlə ölçülür.'}
                  disabled={isSubmitting || unitOptions.isLoading}
                >
                  <MenuItem value="">Seçilməyib</MenuItem>
                  {(unitOptions.data?.content ?? []).map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name} {unit.symbol ? `(${unit.symbol})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label="Aktiv"
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
