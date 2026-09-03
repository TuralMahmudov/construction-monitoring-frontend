import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { NumberField } from '../../../shared/components';
import { useAllUnits, useRegionOptions, useUnitOptions } from '../../reference-data/hooks/useReferenceOptions';
import { AttributeValueField } from '../../products/components/AttributeValueField';
import type { CategoryAttributeDefinition } from '../../resource-categories/types/categoryAttributeDefinition.types';
import type { BulkResourceRowResult } from '../types/document.types';
import type { RowState } from './bulkRowState';

const CURRENCY_OPTIONS = ['AZN', 'USD', 'EUR', 'TRY', 'GBP', 'RUB'];

export interface BulkResourceRowProps {
  row: RowState;
  attributeLinks: CategoryAttributeDefinition[];
  disabled: boolean;
  // İşçi qüvvəsi (category type 3) — İstehsalçı/Model resource-level
  // fields don't apply to labor, bax BulkResourceFormDialog's isLaborCategory.
  hideManufacturerFields?: boolean;
  onChange: (patch: Partial<RowState>) => void;
  onAttributeChange: (attributeDefinitionId: string, value: string) => void;
  onRemove: () => void;
}

function ResultBadge({ result }: { result: BulkResourceRowResult | null }) {
  if (!result) return null;
  if (result.success) {
    return (
      <Tooltip title="Yaradıldı">
        <CheckCircleRoundedIcon color="success" fontSize="small" />
      </Tooltip>
    );
  }
  return (
    <Tooltip title={result.error ?? 'Xəta'}>
      <ErrorRoundedIcon color="error" fontSize="small" />
    </Tooltip>
  );
}

export function BulkResourceRow({
  row,
  attributeLinks,
  disabled,
  hideManufacturerFields = false,
  onChange,
  onAttributeChange,
  onRemove,
}: BulkResourceRowProps) {
  const regionOptions = useRegionOptions();
  const unitOptions = useUnitOptions();
  const allUnitsQuery = useAllUnits();
  const regions = regionOptions.data?.content ?? [];
  // Active-only for the "+ Yeni product" unit picker (can't assign a
  // deactivated unit to a new product) but the full list for resolving an
  // existing product's already-assigned unit, which may since have been
  // deactivated — bax useAllUnits's own rationale.
  const units = unitOptions.data?.content ?? [];
  const allUnits = allUnitsQuery.data?.content ?? [];
  const isDone = row.result?.success === true;
  const rowDisabled = disabled || isDone;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        opacity: isDone ? 0.6 : 1,
        borderWidth: 1.5,
        borderColor: row.result?.success === false ? 'error.main' : 'grey.400',
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Stack>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {row.kind === 'existing' ? row.product.name : 'Yeni Məhsul'}
              </Typography>
              {row.kind === 'existing' && (
                <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.primary">
                  {row.product.code}
                  {row.summary ? ` — ${row.summary}` : ''}
                  {' — Vahid: '}
                  {(() => {
                    const unit = allUnits.find((u) => u.id === row.product.unitId);
                    return unit ? `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ''}` : '—';
                  })()}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <ResultBadge result={row.result} />
              <Tooltip title="Bu sətri siyahıdan çıxar">
                <span>
                  <IconButton size="small" onClick={onRemove} disabled={disabled} aria-label="sətri çıxar">
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {row.result?.success === false && <Alert severity="error">{row.result.error}</Alert>}

          {row.kind === 'new' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Ad"
                fullWidth
                value={row.name}
                onChange={(event) => onChange({ name: event.target.value })}
                disabled={rowDisabled}
              />
              <TextField
                select
                label="Vahid"
                fullWidth
                value={row.unitId}
                onChange={(event) => onChange({ unitId: event.target.value })}
                disabled={rowDisabled}
              >
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name} {unit.symbol ? `(${unit.symbol})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          )}

          {row.kind === 'new' && attributeLinks.length > 0 && (
            <Stack spacing={2}>
              <Typography variant="caption" color="text.secondary">
                Məhsulu müəyyən edən xüsusiyyətlər
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 2,
                }}
              >
                {attributeLinks.map((link) => (
                  <AttributeValueField
                    key={link.id}
                    dataType={link.dataType}
                    value={row.attributeValues[link.id] ?? ''}
                    onChange={(value) => onAttributeChange(link.id, value)}
                    label={link.attributeName}
                    unit={link.defaultUnitSymbol}
                    defaultUnitId={link.defaultUnitId}
                    enumValues={link.enumValues}
                    required={link.required}
                    disabled={rowDisabled}
                  />
                ))}
              </Box>
            </Stack>
          )}

          <Stack spacing={1.5}>
            <Divider />
            <Typography variant="caption" color="text.secondary">
              Elana aid məlumatlar
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {!hideManufacturerFields && (
                <>
                  <TextField
                    label="İstehsalçı *"
                    fullWidth
                    value={row.manufacturer}
                    onChange={(event) => onChange({ manufacturer: event.target.value })}
                    disabled={rowDisabled}
                  />
                  <TextField
                    label="Model"
                    fullWidth
                    value={row.model}
                    onChange={(event) => onChange({ model: event.target.value })}
                    disabled={rowDisabled}
                  />
                </>
              )}
              <TextField
                label="Spesifikasiya"
                fullWidth
                value={row.specification}
                onChange={(event) => onChange({ specification: event.target.value })}
                disabled={rowDisabled}
              />
            </Stack>
          </Stack>

          {/* Switch (not Checkbox) deliberately — this toggles the whole price
              section open/closed, a different kind of action from the plain
              option checkboxes inside it (e.g. "Naməlum müddətə qədər"), so it
              needs a visibly different control shape, not just a second
              checkbox next to/above another one. FormControlLabel isn't used
              here either, for the same stray-click reason as before. */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Switch
              checked={row.price.enabled}
              onChange={(event) => onChange({ price: { ...row.price, enabled: event.target.checked } })}
              disabled={rowDisabled}
            />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Qiymət əlavə et
            </Typography>
          </Stack>

          {row.price.enabled && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Autocomplete
                  options={regions}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  value={regions.find((region) => region.id === row.price.regionId) ?? null}
                  onChange={(_event, newValue) => onChange({ price: { ...row.price, regionId: newValue?.id ?? '' } })}
                  disabled={rowDisabled}
                  sx={{ flex: 1 }}
                  renderInput={(inputParams) => <TextField {...inputParams} label="Region" />}
                />
                <NumberField
                  label="Qiymət"
                  fullWidth
                  value={row.price.price}
                  onChange={(price) => onChange({ price: { ...row.price, price } })}
                  disabled={rowDisabled}
                  sx={{ flex: 1 }}
                />
                <Autocomplete
                  freeSolo
                  options={CURRENCY_OPTIONS}
                  value={row.price.currency}
                  onInputChange={(_event, newValue) => onChange({ price: { ...row.price, currency: newValue.toUpperCase() } })}
                  disabled={rowDisabled}
                  sx={{ flex: 1, minWidth: 120 }}
                  renderInput={(inputParams) => <TextField {...inputParams} label="Valyuta" />}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <DatePicker
                  label="Effektiv tarix"
                  value={row.price.effectiveDate ? dayjs(row.price.effectiveDate) : null}
                  onChange={(newValue: Dayjs | null) =>
                    onChange({ price: { ...row.price, effectiveDate: newValue ? newValue.format('YYYY-MM-DD') : '' } })
                  }
                  disabled={rowDisabled}
                  slotProps={{ textField: { fullWidth: true, sx: { flex: 1 } } }}
                />
                <DatePicker
                  label="Bitmə tarixi"
                  value={row.price.expireDate ? dayjs(row.price.expireDate) : null}
                  onChange={(newValue: Dayjs | null) =>
                    onChange({ price: { ...row.price, expireDate: newValue ? newValue.format('YYYY-MM-DD') : null } })
                  }
                  disabled={rowDisabled || row.price.expireDate === null}
                  slotProps={{ textField: { fullWidth: true, sx: { flex: 1 } } }}
                />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Checkbox
                  checked={row.price.expireDate === null}
                  onChange={(event) =>
                    onChange({
                      price: {
                        ...row.price,
                        expireDate: event.target.checked ? null : dayjs().format('YYYY-MM-DD'),
                      },
                    })
                  }
                  disabled={rowDisabled}
                />
                <Typography variant="body2">Naməlum müddətə qədər</Typography>
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
