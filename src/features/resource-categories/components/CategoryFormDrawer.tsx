import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ApiError } from '../../../services/httpClient';
import { StatusBadge } from '../../../shared/components';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useCategory } from '../hooks/useCategory';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useUpdateCategory } from '../hooks/useUpdateCategory';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { CATEGORY_TYPES, getCategoryTypeLabel } from '../types/resourceCategory.types';
import { categoryFormSchema, type CategoryFormSchema } from '../utils/categoryForm.schema';
import { CategoryParentPicker } from './CategoryParentPicker';

const FORM_FIELD_NAMES = ['parentId', 'name', 'type', 'sortOrder', 'active'] as const;
type FormFieldName = (typeof FORM_FIELD_NAMES)[number];

function isFormFieldName(value: string): value is FormFieldName {
  return (FORM_FIELD_NAMES as readonly string[]).includes(value);
}

const DEFAULT_VALUES: CategoryFormSchema = {
  parentId: null,
  name: '',
  type: 0,
  sortOrder: 0,
  active: true,
};

export function CategoryFormDrawer() {
  const drawer = useCategoryUiStore((state) => state.drawer);
  const closeDrawer = useCategoryUiStore((state) => state.closeDrawer);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = drawer.mode === 'edit';
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Only relevant in edit mode, to show the current (non-editable) parent's
  // name — parent changes go through the dedicated Move action instead.
  const parentQuery = useCategory(isEdit ? (drawer.category?.parentId ?? null) : null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryFormSchema>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!drawer.open) {
      return;
    }
    setFormError(null);
    if (drawer.mode === 'edit' && drawer.category) {
      reset({
        parentId: drawer.category.parentId,
        name: drawer.category.name,
        type: drawer.category.type,
        sortOrder: drawer.category.sortOrder,
        active: drawer.category.active,
      });
    } else {
      reset({ ...DEFAULT_VALUES, parentId: drawer.parentId });
    }
  }, [drawer, reset]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError && error.status === 400 && error.validationErrors) {
      const fieldEntries = Object.entries(error.validationErrors).filter(([field]) =>
        isFormFieldName(field),
      );
      fieldEntries.forEach(([field, message]) => {
        setError(field as FormFieldName, { type: 'server', message });
      });
      setFormError(fieldEntries.length > 0 ? null : getApiErrorMessage(error));
    } else {
      setFormError(getApiErrorMessage(error));
    }
  }

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    if (isEdit && drawer.category) {
      // PUT /{id} only accepts name/sortOrder — parent, type and active are
      // not part of the update DTO on the backend.
      updateMutation.mutate(
        {
          id: drawer.category.id,
          parentId: drawer.category.parentId,
          payload: { name: values.name, sortOrder: values.sortOrder },
        },
        { onSuccess: () => closeDrawer(), onError: handleApiError },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => closeDrawer(),
        onError: handleApiError,
      });
    }
  });

  return (
    <Drawer anchor="right" open={drawer.open} onClose={ignoreBackdropClose(closeDrawer)}>
      <Box
        sx={{
          width: { xs: '100vw', sm: 480 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isEdit ? 'Kateqoriyanı redaktə et' : 'Yeni kateqoriya'}
          </Typography>
          <IconButton onClick={closeDrawer} aria-label="bağla">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Divider />

        <Box component="form" onSubmit={onSubmit} sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
          <Stack spacing={2.5}>
            {formError && <Alert severity="error">{formError}</Alert>}

            {isEdit ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Valideyn kateqoriya
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {drawer.category?.parentId
                    ? (parentQuery.data?.name ?? '…')
                    : 'Kök kateqoriya (valideyn yoxdur)'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Valideyni dəyişmək üçün &quot;Köçür&quot; əməliyyatından istifadə edin.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Valideyn kateqoriya
                </Typography>
                <Controller
                  name="parentId"
                  control={control}
                  render={({ field }) => (
                    <CategoryParentPicker value={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.parentId && <FormHelperText error>{errors.parentId.message}</FormHelperText>}
              </Box>
            )}

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

            {isEdit ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Növ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {drawer.category ? getCategoryTypeLabel(drawer.category.type) : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Növ yaradıldıqdan sonra dəyişdirilə bilməz.
                </Typography>
              </Box>
            ) : (
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type} disabled={isSubmitting}>
                    <InputLabel id="category-type-label">Növ</InputLabel>
                    <Select {...field} labelId="category-type-label" label="Növ">
                      {CATEGORY_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {getCategoryTypeLabel(type)}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            )}

            <Controller
              name="sortOrder"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Sıra nömrəsi"
                  fullWidth
                  error={!!errors.sortOrder}
                  helperText={errors.sortOrder?.message}
                  disabled={isSubmitting}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                />
              )}
            />

            {isEdit && drawer.category && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Status
                </Typography>
                <StatusBadge active={drawer.category.active} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Statusu dəyişmək üçün alət çubuğundan istifadə edin.
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        <Divider />
        <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={closeDrawer} disabled={isSubmitting}>
            İmtina
          </Button>
          <Button variant="contained" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
