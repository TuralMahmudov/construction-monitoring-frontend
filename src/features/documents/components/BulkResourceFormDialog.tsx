import { useEffect, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { ConfirmDialog } from '../../../shared/components';
import { useProductsWithAttributeSummary } from '../../products/hooks/useProductsWithAttributeSummary';
import {
  CategoryProductTreePicker,
  type CategoryProductPickerValue,
} from '../../resource-categories/components/CategoryProductTreePicker';
import { useCategoryAttributes } from '../../resource-categories/hooks/useCategoryAttributeDefinitions';
import type { CategoryAttributeDefinition } from '../../resource-categories/types/categoryAttributeDefinition.types';
import { useCompleteDocument, useCreateDocumentResources } from '../hooks/useDocuments';
import type { BulkResourceRowRequest, CcmsDocument } from '../types/document.types';
import { BulkResourceRow } from './BulkResourceRow';
import { DocumentPeriodPicker } from './DocumentPeriodPicker';
import { makeExistingRow, makeNewRow, type RowState } from './bulkRowState';

export interface BulkResourceFormDialogProps {
  document: CcmsDocument | null;
  onClose: () => void;
}

function rowHasRequiredFields(row: RowState, attributeLinks: CategoryAttributeDefinition[]): string | null {
  if (!row.manufacturer.trim()) {
    return 'İstehsalçı məcburidir.';
  }
  if (row.kind === 'new') {
    if (!row.name.trim() || !row.unitId) {
      return 'Yeni məhsul üçün ad və vahid məcburidir.';
    }
    const missingAttribute = attributeLinks.find(
      (link) => link.required && !(row.attributeValues[link.id] ?? '').trim(),
    );
    if (missingAttribute) {
      return `Məcburi xüsusiyyət doldurulmayıb: ${missingAttribute.attributeName}`;
    }
  }
  if (row.price.enabled) {
    if (!row.price.regionId || !row.price.currency || !row.price.effectiveDate || row.price.price <= 0) {
      return 'Qiymət əlavə edilibsə region, qiymət və effektiv tarix mütləqdir.';
    }
  }
  return null;
}

function toRowRequest(row: RowState): BulkResourceRowRequest {
  const base: BulkResourceRowRequest = {
    manufacturer: row.manufacturer.trim(),
    brand: row.brand.trim() || undefined,
    model: row.model.trim() || undefined,
    specification: row.specification.trim() || undefined,
    price: row.price.enabled
      ? {
          regionId: row.price.regionId,
          price: row.price.price,
          currency: row.price.currency,
          effectiveDate: row.price.effectiveDate,
          expireDate: row.price.expireDate,
          comment: row.price.comment || undefined,
        }
      : undefined,
  };

  if (row.kind === 'existing') {
    return { ...base, productId: row.product.id };
  }
  return {
    ...base,
    newProduct: {
      categoryId: row.categoryId,
      name: row.name.trim(),
      unitId: row.unitId,
      attributes: Object.entries(row.attributeValues)
        .filter(([, value]) => value.trim() !== '')
        .map(([categoryAttributeDefinitionId, value]) => ({ categoryAttributeDefinitionId, value })),
    },
  };
}

// New, dedicated component (bax FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_5.md § 3)
// — the existing "yeni resurs" form (MyResourceFormDialog) is intentionally
// left untouched, this is a separate bulk/group creation flow scoped to one
// leaf category at a time, repeatable across categories while the document
// stays IN_PROGRESS.
export function BulkResourceFormDialog({ document, onClose }: BulkResourceFormDialogProps) {
  const [categoryValue, setCategoryValue] = useState<CategoryProductPickerValue | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  // "Emalı bitir" must not be reachable until at least one resource has
  // actually been saved this session — otherwise a document could be marked
  // COMPLETED (irreversible, bax § 4) with nothing ever processed.
  const [hasSavedAny, setHasSavedAny] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const categoryId = categoryValue?.categoryId ?? '';
  const productsQuery = useProductsWithAttributeSummary(categoryId, Boolean(document && categoryId));
  const attributesQuery = useCategoryAttributes(categoryId || null);
  const attributeLinks = (attributesQuery.data ?? []).filter((link) => link.visible).sort((a, b) => a.sortOrder - b.sortOrder);

  const createMutation = useCreateDocumentResources();
  const completeMutation = useCompleteDocument();

  useEffect(() => {
    setCategoryValue(null);
    setRows([]);
    setFormError(null);
    setHasSavedAny(false);
  }, [document?.id]);

  useEffect(() => {
    if (!categoryId || productsQuery.isLoading) {
      return;
    }
    setRows(productsQuery.items.map(({ product, summary }) => makeExistingRow(product, summary)));
    setFormError(null);
    // Only re-derive when the selected category actually changes — items is
    // recomputed every render (bax useProductsWithAttributeSummary) and would
    // otherwise wipe in-progress edits on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, productsQuery.isLoading]);

  function updateRow(key: string, patch: Partial<RowState>) {
    setRows((prev) => prev.map((row) => (row.key === key ? ({ ...row, ...patch } as RowState) : row)));
  }

  function updateAttribute(key: string, attributeDefinitionId: string, value: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key && row.kind === 'new'
          ? { ...row, attributeValues: { ...row.attributeValues, [attributeDefinitionId]: value } }
          : row,
      ),
    );
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  function addNewProductRow() {
    setRows((prev) => [...prev, makeNewRow(categoryId, categoryValue?.label ?? '')]);
  }

  async function handleSubmit() {
    setFormError(null);
    if (!document) return;

    const pending = rows.filter((row) => row.result?.success !== true);
    if (pending.length === 0) {
      setFormError('Göndəriləcək sətir yoxdur.');
      return;
    }

    const validationErrors = new Map<string, string>();
    pending.forEach((row) => {
      const error = rowHasRequiredFields(row, attributeLinks);
      if (error) {
        validationErrors.set(row.key, error);
      }
    });
    if (validationErrors.size > 0) {
      setRows((prev) =>
        prev.map((row) =>
          validationErrors.has(row.key)
            ? { ...row, result: { index: -1, success: false, error: validationErrors.get(row.key) } }
            : row,
        ),
      );
      setFormError('Bəzi sətirlərdə məcburi sahələr doldurulmayıb.');
      return;
    }

    const submittedKeys = pending.map((row) => row.key);
    try {
      const response = await createMutation.mutateAsync({
        documentId: document.id,
        payload: { rows: pending.map(toRowRequest) },
      });

      const resultByKey = new Map(response.results.map((result) => [submittedKeys[result.index], result]));
      setRows((prev) => prev.map((row) => (resultByKey.has(row.key) ? { ...row, result: resultByKey.get(row.key)! } : row)));

      const successCount = response.results.filter((r) => r.success).length;
      const failCount = response.results.length - successCount;
      if (successCount > 0) {
        setHasSavedAny(true);
      }
      if (failCount === 0) {
        enqueueSnackbar(`${successCount} resurs yaradıldı.`, { variant: 'success' });
      } else {
        enqueueSnackbar(`${successCount} uğurlu, ${failCount} uğursuz — uğursuz sətirləri düzəldib yenidən göndərin.`, {
          variant: 'warning',
        });
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  }

  function handleComplete() {
    if (!document) return;
    completeMutation.mutate(document.id, { onSuccess: onClose });
    setConfirmCompleteOpen(false);
  }

  const unfinishedCount = rows.filter((row) => row.result?.success !== true).length;

  return (
    <Dialog open={document !== null} onClose={ignoreBackdropClose(onClose)} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {document ? `Emal et: ${document.originalFilename}` : ''}
        <IconButton
          onClick={onClose}
          disabled={createMutation.isPending || completeMutation.isPending}
          aria-label="bağla"
          size="small"
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          {document && <DocumentPeriodPicker document={document} />}

          <CategoryProductTreePicker
            label="Kateqoriya"
            value={categoryValue}
            // Clicking a product node also carries its categoryId — either
            // click is treated the same here, only the leaf category matters
            // for loading this dialog's product list (bax § 3.1).
            onChange={(value) => setCategoryValue({ type: 'category', categoryId: value.categoryId, label: value.label })}
          />

          {!categoryId && (
            <Typography color="text.secondary" variant="body2">
              Emal etmək üçün əvvəlcə kateqoriya seçin. Kateqoriyaya bağlı mövcud məhsullar avtomatik siyahıya gələcək.
            </Typography>
          )}

          {categoryId && productsQuery.isLoading && (
            <Stack sx={{ alignItems: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Stack>
          )}

          {categoryId && !productsQuery.isLoading && (
            <Stack spacing={2}>
              {rows.map((row) => (
                <BulkResourceRow
                  key={row.key}
                  row={row}
                  attributeLinks={row.kind === 'new' ? attributeLinks : []}
                  disabled={createMutation.isPending || completeMutation.isPending}
                  onChange={(patch) => updateRow(row.key, patch)}
                  onAttributeChange={(attrId, value) => updateAttribute(row.key, attrId, value)}
                  onRemove={() => removeRow(row.key)}
                />
              ))}

              <Button
                startIcon={<AddRoundedIcon />}
                onClick={addNewProductRow}
                disabled={createMutation.isPending || completeMutation.isPending}
                sx={{ alignSelf: 'flex-start' }}
              >
                Yeni product əlavə et
              </Button>
            </Stack>
          )}

          <Divider />
          <Typography variant="caption" color="text.secondary">
            Bu addımı fərqli kateqoriyalarla təkrarlaya bilərsiniz. Sənəddəki bütün lazımi kateqoriyaları emal
            etdikdən sonra "Emalı bitir"ə basın.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={createMutation.isPending || completeMutation.isPending}>
          Bağla
        </Button>
        <Stack sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!categoryId || unfinishedCount === 0 || createMutation.isPending || completeMutation.isPending}
        >
          {createMutation.isPending ? 'Göndərilir...' : 'Yadda saxla'}
        </Button>
        <Tooltip title={hasSavedAny ? '' : 'Əvvəlcə ən azı bir resurs "Yadda saxla" ilə göndərilməlidir'}>
          <span>
            <Button
              variant="text"
              color="success"
              onClick={() => setConfirmCompleteOpen(true)}
              disabled={!hasSavedAny || createMutation.isPending || completeMutation.isPending}
            >
              {completeMutation.isPending ? 'Tamamlanır...' : 'Emalı bitir'}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>

      <ConfirmDialog
        open={confirmCompleteOpen}
        title="Emalı bitir"
        description='Sənəddəki resursların işlənib yekunlaşmasına əminsiniz? Tamamlandıqdan sonra bu sənəd üzərində yenidən emal aparıla bilməz.'
        confirmLabel="Bəli, bitir"
        cancelLabel="İmtina"
        loading={completeMutation.isPending}
        onConfirm={handleComplete}
        onCancel={() => setConfirmCompleteOpen(false)}
      />
    </Dialog>
  );
}
