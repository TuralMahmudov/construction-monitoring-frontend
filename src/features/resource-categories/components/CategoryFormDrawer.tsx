import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ApiError } from '../../../services/httpClient';
import { StatusBadge } from '../../../shared/components';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useFullCategoryList } from '../../resources/hooks/useFullCategoryList';
import { useCategory } from '../hooks/useCategory';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useUpdateCategory } from '../hooks/useUpdateCategory';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { CATEGORY_TYPES, getCategoryTypeLabel } from '../types/resourceCategory.types';
import { categoryFormSchema, type CategoryFormSchema } from '../utils/categoryForm.schema';

const FORM_FIELD_NAMES = ['parentId', 'name', 'type', 'active'] as const;
type FormFieldName = (typeof FORM_FIELD_NAMES)[number];

function isFormFieldName(value: string): value is FormFieldName {
  return (FORM_FIELD_NAMES as readonly string[]).includes(value);
}

const DEFAULT_VALUES: CategoryFormSchema = {
  parentId: null,
  name: '',
  type: 0,
  active: true,
};

// Fixed top label, never floating — every field in this drawer uses the same
// shape (label above, control below) instead of mixing floating-label
// TextFields with plain-text rows, which used to look like two different
// design systems in one form.
function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <Typography
      variant="caption"
      sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}
    >
      {children}
      {required && (
        <Box component="span" sx={{ color: 'error.main' }}>
          {' '}
          *
        </Box>
      )}
    </Typography>
  );
}

/** Ancestor chain (root → ... → categoryId itself), by name — used for both
 *  the header breadcrumb and duplicate-name sibling lookups. Walks the
 *  already-cached full flat category list, no extra request. */
function useCategoryAncestry(categoryId: string | null) {
  const listQuery = useFullCategoryList();

  return useMemo(() => {
    const categories = listQuery.data ?? [];
    const byId = new Map(categories.map((category) => [category.id, category]));

    const path: string[] = [];
    if (categoryId) {
      let current = byId.get(categoryId);
      const visited = new Set<string>();
      while (current && !visited.has(current.id)) {
        path.unshift(current.name);
        visited.add(current.id);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
    }

    return { categories, path };
  }, [listQuery.data, categoryId]);
}

// Purely informational — the parent was already picked by whichever tree
// node the user clicked "Alt kateqoriya" on, and changing a category's
// parent afterwards goes through the dedicated "Köçür" action, not this
// form. An earlier version let you re-pick it here via a searchable
// popover, but that list mixes every category in the system (including
// near-duplicate names like "Material"/"Materiallar") and just added a
// confusing extra way to do something this drawer isn't meant to do.
function ParentField({ parentId }: { parentId: string }) {
  const parentQuery = useCategory(parentId);

  return (
    <Box>
      <FieldLabel>Valideyn kateqoriya</FieldLabel>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          px: 1.5,
          py: 0.75,
        }}
      >
        <FolderRoundedIcon fontSize="small" color="action" />
        <Typography variant="body2">{parentQuery.data?.name ?? '…'}</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        Ağacda seçdiyiniz düyündən götürüldü, dəyişdirilə bilməz.
      </Typography>
    </Box>
  );
}

export function CategoryFormDrawer() {
  const drawer = useCategoryUiStore((state) => state.drawer);
  const closeDrawer = useCategoryUiStore((state) => state.closeDrawer);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = drawer.mode === 'edit';
  const isRootMode = !isEdit && drawer.parentId === null;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormSchema>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const parentId = useWatch({ control, name: 'parentId' });
  const name = useWatch({ control, name: 'name' });
  const type = useWatch({ control, name: 'type' });

  const { categories: allCategories, path: parentPath } = useCategoryAncestry(parentId);

  // Sub-categories inherit their type from the parent on the backend (bax
  // PROJECT_STATUS.md §4o — "Uşaq kateqoriya... type avtomatik parent-dən
  // götürülür"), so re-asking for it here would just be the same redundant
  // re-selection problem the parent field itself used to have. Fetched once
  // per open and pushed into the form so both the read-only display and the
  // submit payload stay in sync with the parent's actual type.
  //
  // Keyed off `drawer.parentId` (the store's value, correct the instant the
  // drawer opens) rather than the watched form field — the form's `parentId`
  // is still holding the *previous* drawer session's value for one render
  // after opening (reset() below hasn't run yet), so querying off it could
  // fetch the wrong parent's category for an instant.
  const isChildCreate = !isEdit && !isRootMode;
  const parentQuery = useCategory(isChildCreate ? drawer.parentId : null);

  const duplicateName = useMemo(() => {
    const trimmed = name?.trim().toLowerCase();
    if (!trimmed) {
      return false;
    }
    return allCategories.some(
      (category) =>
        category.parentId === parentId &&
        category.id !== drawer.category?.id &&
        category.name.trim().toLowerCase() === trimmed,
    );
  }, [allCategories, name, parentId, drawer.category]);

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
        active: drawer.category.active,
      });
    } else {
      reset({ ...DEFAULT_VALUES, parentId: drawer.parentId });
    }
  }, [drawer, reset]);

  // Declared *after* the reset effect above: if the parent's category detail
  // is already cached (e.g. it was just selected in the tree, which warms
  // CategoryDetailsPanel's query for the same id) both effects' dependencies
  // change in the same commit, and effects run in declaration order — this
  // one must go second so it applies the inherited type after reset(), not
  // before, or reset() silently wipes it back to the empty/0 sentinel.
  useEffect(() => {
    if (isChildCreate && parentQuery.data) {
      setValue('type', parentQuery.data.type);
    }
  }, [isChildCreate, parentQuery.data, setValue]);

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
      // not part of the update DTO on the backend. sortOrder isn't a form
      // field anymore (bax categoryForm.schema.ts), so the category's own
      // existing value is resent unchanged instead of a fresh default —
      // sending 0 here would silently reorder it to the front of its siblings.
      updateMutation.mutate(
        {
          id: drawer.category.id,
          parentId: drawer.category.parentId,
          payload: { name: values.name, sortOrder: drawer.category.sortOrder },
        },
        { onSuccess: () => closeDrawer(), onError: handleApiError },
      );
    } else {
      // sortOrder is required by the backend but no longer user-facing — 0
      // ("append/default position") is sent for every newly created category.
      createMutation.mutate(
        { ...values, sortOrder: 0 },
        { onSuccess: () => closeDrawer(), onError: handleApiError },
      );
    }
  });

  const title = isEdit ? 'Kateqoriyanı redaktə et' : isRootMode ? 'Yeni kök kateqoriya' : 'Yeni alt kateqoriya';
  // parentPath already resolves to the parent category's own ancestry
  // (ending with the parent itself) — nothing to trim in either mode.
  const breadcrumb = parentPath.join(' / ');
  const saveDisabled = isSubmitting || !name?.trim() || !type;

  return (
    <Drawer anchor="right" open={drawer.open} onClose={ignoreBackdropClose(closeDrawer)}>
      <Box
        sx={{
          width: { xs: '100vw', sm: 420 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              {breadcrumb && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                  {breadcrumb}
                </Typography>
              )}
            </Box>
            <IconButton onClick={closeDrawer} aria-label="bağla" size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Box>
        <Divider />

        <Box component="form" onSubmit={onSubmit} sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
          <Stack spacing={2.5}>
            {formError && <Alert severity="error">{formError}</Alert>}

            {!isRootMode && parentId && <ParentField parentId={parentId} />}

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Box>
                  <FieldLabel required>Ad</FieldLabel>
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    autoFocus
                    error={!!errors.name}
                    disabled={isSubmitting}
                  />
                  {errors.name ? (
                    <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                      {errors.name.message}
                    </Typography>
                  ) : (
                    duplicateName && (
                      <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                        Bu ad artıq eyni valideyn altında mövcuddur.
                      </Typography>
                    )
                  )}
                </Box>
              )}
            />

            {isEdit ? (
              <Box>
                <FieldLabel>Növ</FieldLabel>
                <Typography variant="body2" color="text.secondary">
                  {drawer.category ? getCategoryTypeLabel(drawer.category.type) : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Növ yaradıldıqdan sonra dəyişdirilə bilməz.
                </Typography>
              </Box>
            ) : isChildCreate ? (
              <Box>
                <FieldLabel>Növ</FieldLabel>
                <Typography variant="body2" color="text.secondary">
                  {type ? getCategoryTypeLabel(type) : '…'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Valideyn kateqoriyadan avtomatik götürülür.
                </Typography>
              </Box>
            ) : (
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Box>
                    <FieldLabel required>Növ</FieldLabel>
                    <Select
                      {...field}
                      fullWidth
                      size="small"
                      displayEmpty
                      error={!!errors.type}
                      disabled={isSubmitting}
                    >
                      <MenuItem value={0} disabled>
                        Seçin
                      </MenuItem>
                      {CATEGORY_TYPES.map((typeOption) => (
                        <MenuItem key={typeOption} value={typeOption}>
                          {getCategoryTypeLabel(typeOption)}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.type && (
                      <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                        {errors.type.message}
                      </Typography>
                    )}
                  </Box>
                )}
              />
            )}

            {isEdit && drawer.category && (
              <Box>
                <FieldLabel>Status</FieldLabel>
                <StatusBadge active={drawer.category.active} />
              </Box>
            )}
          </Stack>
        </Box>

        <Divider />
        <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="inherit" onClick={closeDrawer} disabled={isSubmitting}>
            İmtina
          </Button>
          <Button variant="contained" onClick={onSubmit} disabled={saveDisabled}>
            {isSubmitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
