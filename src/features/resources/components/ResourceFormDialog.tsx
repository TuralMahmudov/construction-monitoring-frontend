import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { useUnitOptions } from '../../reference-data/hooks/useReferenceOptions';
import { useAuth } from '../../../hooks/useAuth';
import { ApiError } from '../../../services/httpClient';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { isCentralAdmin } from '../../../shared/lib/permissions';
import { useCategoryAttributes } from '../../resource-categories/hooks/useCategoryAttributeDefinitions';
import { useCategoryOptions } from '../hooks/useCategoryOptions';
import { useUnitLookup } from '../hooks/useLookups';
import { ProductAttributesFields } from '../../products/components/ProductAttributesFields';
import { ProductAttributesReadOnly } from '../../products/components/ProductAttributesReadOnly';
import { ProductPicker } from '../../products/components/ProductPicker';
import { useFindOrCreateProduct } from '../../products/hooks/useFindOrCreateProduct';
import type { Product } from '../../products/types/product.types';
import { productFormSchema, type ProductFormSchema } from '../../products/utils/productForm.schema';
import { useManufacturerOptions, useModelOptions } from '../hooks/useResourceFieldOptions';
import type { ResourceCreateRequest } from '../types/resource.types';
import { resourceListingFieldsSchema, type ResourceListingFieldsSchema } from '../utils/resourceListingForm.schema';
import { CategoryPathAutocomplete } from './CategoryPathAutocomplete';
import { ResourceFieldAutocomplete } from './ResourceFieldAutocomplete';

type SelectionMode = 'existing' | 'new';

const DEFAULT_PRODUCT_VALUES: ProductFormSchema = {
  categoryId: '',
  name: '',
  unitId: null,
};

const DEFAULT_LISTING_VALUES: ResourceListingFieldsSchema = {
  manufacturer: '',
  model: '',
  specification: '',
};

export interface ResourceFormDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ResourceCreateRequest, onError: (error: unknown) => void) => void;
}

// § 6 "Elan Yarat" — two branches under one dialog: attach a listing to an
// existing product (§ 6.1), or resolve/create one via find-or-create then
// attach (§ 6.2). Manufacturer/model/specification are always shown and
// always go to POST /api/resources regardless of branch (2026-07-31 — these
// are listing-specific, not product identity; `brand` moved to the product's
// own attributes, bax FRONTEND_AI_PROMPT_BRAND_IDENTITY.md, and is rendered
// inside the xüsusiyyətlər section below instead). Editing an existing
// listing isn't handled here — bax ResourceEditDialog.
export function ResourceFormDialog({ open, isSubmitting, onClose, onSubmit }: ResourceFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('existing');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const { user } = useAuth();
  const canAssignOrganization = isCentralAdmin(user?.roles ?? []);
  const { enqueueSnackbar } = useSnackbar();
  const unitOptions = useUnitOptions();
  const findOrCreateMutation = useFindOrCreateProduct();

  const { options: categoryOptions } = useCategoryOptions();
  const unitSymbols = useUnitLookup();

  const {
    control: productControl,
    reset: resetProduct,
    setError: setProductError,
    setValue: setProductValue,
    watch: watchProduct,
    trigger: triggerProduct,
    getValues: getProductValues,
    formState: { errors: productErrors },
  } = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues: DEFAULT_PRODUCT_VALUES,
  });

  const {
    control: listingControl,
    reset: resetListing,
    setError: setListingError,
    watch: watchListing,
    trigger: triggerListing,
    getValues: getListingValues,
    formState: { errors: listingErrors },
  } = useForm<ResourceListingFieldsSchema>({
    resolver: zodResolver(resourceListingFieldsSchema),
    defaultValues: DEFAULT_LISTING_VALUES,
  });

  const categoryId = watchProduct('categoryId');
  const manufacturerInput = watchListing('manufacturer');
  const modelInput = watchListing('model');
  const manufacturerOptions = useManufacturerOptions(manufacturerInput);
  const modelOptions = useModelOptions(modelInput);

  const categoryAttributesQuery = useCategoryAttributes(categoryId || null);
  const attributeLinks = useMemo(
    () =>
      (categoryAttributesQuery.data ?? [])
        .filter((link) => link.visible)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categoryAttributesQuery.data],
  );

  // Tural, 2026-08-26: a category with zero xüsusiyyət növü has no way to
  // tell one "new" product from another (matchKey is constant/empty for
  // it) — there can only ever be one meaningful product per such category,
  // and it isn't this flow's job to create it. Block "Yeni məhsul yarat"
  // outright (no bootstrap exception); the fix belongs in category admin
  // (bax CategoryAttributesPanel warning) — bind at least one xüsusiyyət
  // növü before the category is usable here.
  const categoryHasNoAttributes =
    Boolean(categoryId) && !categoryAttributesQuery.isLoading && attributeLinks.length === 0;
  const newProductBlocked = categoryHasNoAttributes;

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormError(null);
    setSelectionMode('existing');
    setSelectedProduct(null);
    setAttributeValues({});
    setOrganizationId(null);
    resetProduct(DEFAULT_PRODUCT_VALUES);
    resetListing(DEFAULT_LISTING_VALUES);
  }, [open, resetProduct, resetListing]);

  // Switching category mid-fill invalidates whatever was picked/typed for
  // the previous category's (different) product list and attribute set.
  // Per § 6.2 step 1, "Ad" auto-fills from the selected category's own
  // name (still editable afterwards).
  useEffect(() => {
    setAttributeValues({});
    setSelectedProduct(null);
    const categoryName = categoryOptions.find((option) => option.id === categoryId)?.name ?? '';
    setProductValue('name', categoryName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    if (newProductBlocked) {
      setSelectionMode('existing');
    }
  }, [newProductBlocked]);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 400 && error.validationErrors) {
        const fieldEntries = Object.entries(error.validationErrors);
        let matched = 0;
        fieldEntries.forEach(([field, message]) => {
          if (field in DEFAULT_PRODUCT_VALUES) {
            setProductError(field as keyof ProductFormSchema, { type: 'server', message });
            matched += 1;
          } else if (field in DEFAULT_LISTING_VALUES) {
            setListingError(field as keyof ResourceListingFieldsSchema, { type: 'server', message });
            matched += 1;
          }
        });
        setFormError(matched > 0 ? null : getApiErrorMessage(error));
      } else if (error.status === 404) {
        setFormError('Seçilmiş kateqoriya və ya vahid tapılmadı.');
      } else {
        setFormError(getApiErrorMessage(error));
      }
    } else {
      setFormError(getApiErrorMessage(error));
    }
  }

  async function handleSave() {
    setFormError(null);

    const listingValid = await triggerListing();
    if (!listingValid) {
      return;
    }

    if (selectionMode === 'existing') {
      if (!categoryId) {
        setFormError('Kateqoriya seçin.');
        return;
      }
      if (!selectedProduct) {
        setFormError('Məhsul seçin.');
        return;
      }
      onSubmit({ productId: selectedProduct.id, organizationId, ...getListingValues() }, handleApiError);
      return;
    }

    const productValid = await triggerProduct();
    if (!productValid) {
      return;
    }

    const missingRequired = attributeLinks.filter(
      (link) => link.required && !(attributeValues[link.id] ?? '').trim(),
    );
    if (missingRequired.length > 0) {
      setFormError(
        `Məcburi xüsusiyyətlər doldurulmayıb: ${missingRequired.map((link) => link.attributeName).join(', ')}`,
      );
      return;
    }

    // FRONTEND_AI_PROMPT_STATUS_CLEANUP.md § 2 — a category with attribute
    // fields at all rejects an empty attributes[] with a 400; pre-check here
    // instead of waiting for that round trip.
    if (attributeLinks.length > 0 && attributeLinks.every((link) => !(attributeValues[link.id] ?? '').trim())) {
      setFormError('Ən azı bir xüsusiyyət doldurulmalıdır.');
      return;
    }

    const attributes = attributeLinks
      .filter((link) => (attributeValues[link.id] ?? '').trim() !== '')
      .map((link) => ({ categoryAttributeDefinitionId: link.id, value: attributeValues[link.id] }));

    try {
      const result = await findOrCreateMutation.mutateAsync({ ...getProductValues(), attributes });
      if (result.matched) {
        enqueueSnackbar(
          `Bu xüsusiyyətlərlə artıq mövcud bir məhsul var: ${result.product.code} — ${result.product.name}. Elanınız bu məhsul altında yaradılacaq.`,
          { variant: 'info' },
        );
      } else {
        enqueueSnackbar(`Yeni məhsul yaradıldı: ${result.product.code}.`, { variant: 'success' });
      }
      onSubmit({ productId: result.product.id, organizationId, ...getListingValues() }, handleApiError);
    } catch (error) {
      handleApiError(error);
    }
  }

  const submitting = isSubmitting || findOrCreateMutation.isPending;

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="sm" fullWidth>
      <DialogTitle>Elan Yarat</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Controller
            name="categoryId"
            control={productControl}
            render={({ field }) => (
              <CategoryPathAutocomplete
                value={field.value || null}
                onChange={(id) => field.onChange(id ?? '')}
                error={!!productErrors.categoryId}
                helperText={productErrors.categoryId?.message}
                disabled={submitting}
              />
            )}
          />

          <RadioGroup
            row
            value={selectionMode}
            onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
          >
            <FormControlLabel value="existing" control={<Radio />} label="Mövcud məhsul seç" disabled={submitting} />
            <FormControlLabel
              value="new"
              control={<Radio />}
              label="Yeni məhsul yarat"
              disabled={submitting || newProductBlocked}
            />
          </RadioGroup>
          {newProductBlocked && (
            <Alert severity="warning">
              Bu kateqoriyaya heç bir xüsusiyyət növü bağlanmayıb, ona görə yeni məhsul yaradıla bilməz. Əvvəlcə
              "Resurs Kataloqu"nda kateqoriyaya ən azı bir xüsusiyyət növü bağlayın, ya da mövcud məhsulu seçin.
            </Alert>
          )}

          {selectionMode === 'existing' && (
            <>
              <ProductPicker
                categoryId={categoryId || null}
                value={selectedProduct}
                onChange={setSelectedProduct}
                disabled={submitting}
              />
              {selectedProduct && (
                <>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    Təsvir: {selectedProduct.description || '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vahid:{' '}
                    {selectedProduct.unitId ? (unitSymbols.get(selectedProduct.unitId) ?? '—') : '—'}
                  </Typography>
                  <Typography variant="subtitle2">Xüsusiyyətlər (salt-oxunan)</Typography>
                  <ProductAttributesReadOnly productId={selectedProduct.id} />
                </>
              )}
            </>
          )}

          {selectionMode === 'new' && (
            <>
              <Controller
                name="name"
                control={productControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Ad"
                    fullWidth
                    error={!!productErrors.name}
                    helperText={productErrors.name?.message}
                    disabled={submitting}
                  />
                )}
              />

              <Controller
                name="unitId"
                control={productControl}
                render={({ field }) => (
                  <TextField
                    select
                    label="Vahid"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value || null)}
                    disabled={submitting || unitOptions.isLoading}
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

              <Divider />
              <Typography variant="subtitle2">Xüsusiyyətlər</Typography>
              <ProductAttributesFields
                categoryId={categoryId || null}
                attributeLinks={attributeLinks}
                isLoading={categoryAttributesQuery.isLoading}
                values={attributeValues}
                onChange={(id, value) => setAttributeValues((prev) => ({ ...prev, [id]: value }))}
                disabled={submitting}
              />
            </>
          )}

          <Divider />
          <Typography variant="subtitle2">Elan məlumatları (hər zaman soruşulur)</Typography>

          <Controller
            name="specification"
            control={listingControl}
            render={({ field }) => (
              <TextField
                {...field}
                label="Spesifikasiya"
                fullWidth
                error={!!listingErrors.specification}
                helperText={listingErrors.specification?.message}
                disabled={submitting}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="manufacturer"
              control={listingControl}
              render={({ field }) => (
                <ResourceFieldAutocomplete
                  label="İstehsalçı *"
                  value={field.value}
                  onChange={field.onChange}
                  options={manufacturerOptions.data ?? []}
                  loading={manufacturerOptions.isFetching}
                  error={!!listingErrors.manufacturer}
                  helperText={listingErrors.manufacturer?.message}
                  disabled={submitting}
                />
              )}
            />
            <Controller
              name="model"
              control={listingControl}
              render={({ field }) => (
                <ResourceFieldAutocomplete
                  label="Model"
                  value={field.value}
                  onChange={field.onChange}
                  options={modelOptions.data ?? []}
                  loading={modelOptions.isFetching}
                  error={!!listingErrors.model}
                  helperText={listingErrors.model?.message}
                  disabled={submitting}
                />
              )}
            />
          </Stack>

          {canAssignOrganization && (
            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography variant="body2">Təşkilata təyin et (advanced)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  label="Təşkilat ID (UUID)"
                  fullWidth
                  value={organizationId ?? ''}
                  onChange={(event) => setOrganizationId(event.target.value.trim() || null)}
                  helperText="Boş buraxılsa elan ümumi/mərkəzi kimi yaranır."
                  disabled={submitting}
                />
              </AccordionDetails>
            </Accordion>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose} disabled={submitting}>
          İmtina
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={submitting}>
          {submitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
