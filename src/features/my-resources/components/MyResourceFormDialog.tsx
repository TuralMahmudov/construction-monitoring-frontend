import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ApiError } from '../../../services/httpClient';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { AttributeValueField } from '../../products/components/AttributeValueField';
import type { ProductAttributeInput } from '../../products/types/product.types';
import type { CategoryProductPickerValue } from '../../resource-categories/components/CategoryProductTreePicker';
import { useCategoryAttributes } from '../../resource-categories/hooks/useCategoryAttributeDefinitions';
import {
  resourceListingFieldsSchema,
  type ResourceListingFieldsSchema,
} from '../../resources/utils/resourceListingForm.schema';
import type { CreateMyResourceRequest } from '../types/myResource.types';
import type { MyResourcePriceFormValues } from '../types/price.types';
import { myResourceProductFormSchema, type MyResourceProductFormSchema } from '../utils/myResourceForm.schema';
import { BasicInfoSection } from './BasicInfoSection';
import { PriceSection, type PriceSectionEntry } from './PriceSection';

const DEFAULT_PRODUCT_VALUES: MyResourceProductFormSchema = {
  categoryId: '',
  name: '',
  unitId: '',
};

const DEFAULT_LISTING_VALUES: ResourceListingFieldsSchema = {
  specification: '',
  manufacturer: '',
  model: '',
};

function makeEmptyPriceEntry(): PriceSectionEntry {
  return {
    tempId: crypto.randomUUID(),
    regionId: '',
    price: 0,
    currency: 'AZN',
    effectiveDate: dayjs().format('YYYY-MM-DD'),
    expireDate: null,
    comment: '',
  };
}

export interface MyResourceFormDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    values: CreateMyResourceRequest,
    priceEntries: MyResourcePriceFormValues[],
    onError: (error: unknown) => void,
  ) => void;
}

// § 4/§ 6 "Yeni Resurs" — Yol A (existing product picked from the tree):
// only productId + listing fields are sent. Yol B (category/new combination):
// categoryId/name/unitId/attributes are sent instead, backend resolves-or-
// creates the product. manufacturer/model/specification are always shown and
// always go straight to the resource, regardless of path. `brand`, when the
// category links it, is one of the attributes above instead (bax
// FRONTEND_AI_PROMPT_BRAND_IDENTITY.md) — no longer a listing field.
export function MyResourceFormDialog({ open, isSubmitting, onClose, onSubmit }: MyResourceFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [priceEntries, setPriceEntries] = useState<PriceSectionEntry[]>([]);
  const [categoryPickerValue, setCategoryPickerValue] = useState<CategoryProductPickerValue | null>(null);
  const lockedProduct = categoryPickerValue?.type === 'product' ? categoryPickerValue.product : null;

  const {
    control: productControl,
    reset: resetProduct,
    setError: setProductError,
    trigger: triggerProduct,
    getValues: getProductValues,
    formState: { errors: productErrors },
  } = useForm<MyResourceProductFormSchema>({
    resolver: zodResolver(myResourceProductFormSchema),
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

  const categoryId = categoryPickerValue?.categoryId ?? '';
  const manufacturerInput = watchListing('manufacturer');
  const modelInput = watchListing('model');

  // Same source the general Resurslar creation dialog uses
  // (GET /api/resource-categories/{id}/attributes) — this is the one
  // category-attribute system the backend actually has, so this module
  // reuses it instead of inventing a parallel one. Only relevant for Yol B
  // (no lockedProduct) — an existing product's attributes aren't editable.
  const categoryAttributesQuery = useCategoryAttributes(!lockedProduct && categoryId ? categoryId : null);
  const attributeLinks = useMemo(
    () =>
      (categoryAttributesQuery.data ?? [])
        .filter((link) => link.visible)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categoryAttributesQuery.data],
  );

  // Same rule as ResourceFormDialog (Tural 2026-08-26): a category with zero
  // xüsusiyyət növü can only ever have one meaningful product (matchKey is
  // constant/empty) — blocked outright, no bootstrap exception. Fix belongs
  // in category admin (bax CategoryAttributesPanel warning), not this flow.
  const categoryHasNoAttributes =
    !lockedProduct && Boolean(categoryId) && !categoryAttributesQuery.isLoading && attributeLinks.length === 0;
  const newProductBlocked = categoryHasNoAttributes;

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormError(null);
    setAttributeValues({});
    setPriceEntries([]);
    setCategoryPickerValue(null);
    resetProduct(DEFAULT_PRODUCT_VALUES);
    resetListing(DEFAULT_LISTING_VALUES);
  }, [open, resetProduct, resetListing]);

  function handleCategoryPickerChange(pickerValue: CategoryProductPickerValue) {
    setCategoryPickerValue(pickerValue);
    setAttributeValues({});
    if (pickerValue.type === 'product') {
      resetProduct({ categoryId: pickerValue.categoryId, name: pickerValue.product.name, unitId: pickerValue.product.unitId ?? '' });
    } else {
      // § 6.2 step 1 — "Ad" auto-fills from the selected leaf category's own
      // name (pickerValue.label carries it, bax CategoryProductTreePicker),
      // still editable afterwards via the Controller in BasicInfoSection.
      resetProduct({ categoryId: pickerValue.categoryId, name: pickerValue.label, unitId: '' });
    }
  }

  function handleApiError(error: unknown) {
    if (error instanceof ApiError && error.status === 400 && error.validationErrors) {
      const fieldEntries = Object.entries(error.validationErrors);
      let matched = 0;
      fieldEntries.forEach(([field, message]) => {
        if (field in DEFAULT_PRODUCT_VALUES) {
          setProductError(field as keyof MyResourceProductFormSchema, { type: 'server', message });
          matched += 1;
        } else if (field in DEFAULT_LISTING_VALUES) {
          setListingError(field as keyof ResourceListingFieldsSchema, { type: 'server', message });
          matched += 1;
        }
      });
      setFormError(matched > 0 ? null : getApiErrorMessage(error));
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

    const invalidPrice = priceEntries.find(
      (entry) => !entry.regionId || !entry.currency || !entry.effectiveDate || entry.price <= 0,
    );
    if (invalidPrice) {
      setFormError('Əlavə edilmiş qiymət sətirlərində region, qiymət və effektiv tarix mütləqdir.');
      return;
    }
    const prices: MyResourcePriceFormValues[] = priceEntries.map(({ tempId: _tempId, ...rest }) => rest);
    const listingValues = getListingValues();

    if (lockedProduct) {
      onSubmit({ productId: lockedProduct.id, ...listingValues }, prices, handleApiError);
      return;
    }

    if (newProductBlocked) {
      setFormError(
        'Bu kateqoriyaya heç bir xüsusiyyət növü bağlanmayıb, ona görə yeni məhsul yaradıla bilməz. Yuxarıdan mövcud məhsulu seçin.',
      );
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

    const attributes: ProductAttributeInput[] = attributeLinks
      .filter((link) => (attributeValues[link.id] ?? '').trim() !== '')
      .map((link) => ({
        categoryAttributeDefinitionId: link.id,
        value: attributeValues[link.id],
      }));

    onSubmit({ ...getProductValues(), attributes, ...listingValues }, prices, handleApiError);
  }

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="md" fullWidth>
      <DialogTitle>Yeni Resurs</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <BasicInfoSection
            productControl={productControl}
            productErrors={productErrors}
            listingControl={listingControl}
            listingErrors={listingErrors}
            manufacturerInput={manufacturerInput}
            modelInput={modelInput}
            categoryPickerValue={categoryPickerValue}
            onCategoryPickerChange={handleCategoryPickerChange}
            disabled={isSubmitting}
            lockedProduct={lockedProduct}
          />

          {!lockedProduct && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Xüsusiyyətlər
                </Typography>

                {!categoryId && (
                  <Typography color="text.secondary" variant="body2">
                    Əvvəlcə kateqoriya seçin.
                  </Typography>
                )}

                {categoryId && categoryAttributesQuery.isLoading && (
                  <Stack sx={{ alignItems: 'center', py: 1 }}>
                    <CircularProgress size={22} />
                  </Stack>
                )}

                {categoryId && !categoryAttributesQuery.isLoading && attributeLinks.length === 0 && !newProductBlocked && (
                  <Typography color="text.secondary" variant="body2">
                    Bu kateqoriya üçün xüsusiyyət tərtib edilməyib.
                  </Typography>
                )}

                {newProductBlocked && (
                  <Alert severity="warning">
                    Bu kateqoriyaya heç bir xüsusiyyət növü bağlanmayıb, ona görə yeni məhsul yaradıla bilməz.
                    Əvvəlcə "Resurs Kataloqu"nda kateqoriyaya ən azı bir xüsusiyyət növü bağlanmalıdır, ya da
                    yuxarıdan mövcud məhsulu seçin.
                  </Alert>
                )}

                <Stack spacing={2.5}>
                  {attributeLinks.map((link) => (
                    <AttributeValueField
                      key={link.id}
                      dataType={link.dataType}
                      value={attributeValues[link.id] ?? ''}
                      onChange={(value) => setAttributeValues((prev) => ({ ...prev, [link.id]: value }))}
                      label={link.attributeName}
                      unit={link.defaultUnitSymbol}
                      defaultUnitId={link.defaultUnitId}
                      enumValues={link.enumValues}
                      required={link.required}
                      disabled={isSubmitting}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          <PriceSection
            entries={priceEntries}
            onAdd={() => setPriceEntries((prev) => [...prev, makeEmptyPriceEntry()])}
            onRemove={(tempId) => setPriceEntries((prev) => prev.filter((entry) => entry.tempId !== tempId))}
            onChange={(tempId, values) =>
              setPriceEntries((prev) => prev.map((entry) => (entry.tempId === tempId ? { ...values, tempId } : entry)))
            }
            disabled={isSubmitting}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose} disabled={isSubmitting}>
          Ləğv et
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Yadda saxlanılır...' : 'Yadda saxla'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
