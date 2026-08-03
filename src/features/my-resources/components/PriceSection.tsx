import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import dayjs, { type Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { NumberField } from '../../../shared/components';
import { useRegionOptions } from '../../reference-data/hooks/useReferenceOptions';
import type { MyResourcePriceFormValues } from '../types/price.types';

const CURRENCY_OPTIONS = ['AZN', 'USD', 'EUR', 'TRY', 'GBP', 'RUB'];

export interface PriceSectionEntry extends MyResourcePriceFormValues {
  tempId: string;
}

export interface PriceSectionProps {
  entries: PriceSectionEntry[];
  onAdd: () => void;
  onRemove: (tempId: string) => void;
  onChange: (tempId: string, values: MyResourcePriceFormValues) => void;
  disabled?: boolean;
}

// Optional — a resource can be saved with zero entries. Rendered as a
// repeatable list (not a fixed set of fields) so supporting several prices
// per resource later is a backend/data change only, no UI rework.
export function PriceSection({ entries, onAdd, onRemove, onChange, disabled }: PriceSectionProps) {
  const regionOptions = useRegionOptions();
  const regions = regionOptions.data?.content ?? [];

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: entries.length ? 2 : 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Qiymət
          </Typography>
          <Button startIcon={<AddRoundedIcon />} size="small" onClick={onAdd} disabled={disabled}>
            Qiymət əlavə et
          </Button>
        </Stack>

        <Stack spacing={2.5} divider={<Divider />}>
          {entries.map((entry, index) => (
            <Stack key={entry.tempId} spacing={2}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Qiymət #{index + 1}
                </Typography>
                <IconButton size="small" onClick={() => onRemove(entry.tempId)} disabled={disabled} aria-label="sil">
                  <DeleteRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Autocomplete
                  options={regions}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  value={regions.find((region) => region.id === entry.regionId) ?? null}
                  onChange={(_event, newValue) => onChange(entry.tempId, { ...entry, regionId: newValue?.id ?? '' })}
                  loading={regionOptions.isLoading}
                  disabled={disabled}
                  sx={{ flex: 1 }}
                  renderInput={(params) => <TextField {...params} label="Region" />}
                />
                <NumberField
                  label="Qiymət"
                  fullWidth
                  value={entry.price}
                  onChange={(price) => onChange(entry.tempId, { ...entry, price })}
                  disabled={disabled}
                  sx={{ flex: 1 }}
                />
                <Autocomplete
                  freeSolo
                  options={CURRENCY_OPTIONS}
                  value={entry.currency}
                  onInputChange={(_event, newValue) => onChange(entry.tempId, { ...entry, currency: newValue.toUpperCase() })}
                  disabled={disabled}
                  sx={{ flex: 1, minWidth: 140 }}
                  renderInput={(params) => <TextField {...params} label="Valyuta" />}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <DatePicker
                  label="Effektiv tarix"
                  value={entry.effectiveDate ? dayjs(entry.effectiveDate) : null}
                  onChange={(newValue: Dayjs | null) =>
                    onChange(entry.tempId, { ...entry, effectiveDate: newValue ? newValue.format('YYYY-MM-DD') : '' })
                  }
                  disabled={disabled}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="Bitmə tarixi"
                  value={entry.expireDate ? dayjs(entry.expireDate) : null}
                  onChange={(newValue: Dayjs | null) =>
                    onChange(entry.tempId, { ...entry, expireDate: newValue ? newValue.format('YYYY-MM-DD') : null })
                  }
                  disabled={disabled || entry.expireDate === null}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={entry.expireDate === null}
                    onChange={(event) =>
                      onChange(entry.tempId, { ...entry, expireDate: event.target.checked ? null : dayjs().format('YYYY-MM-DD') })
                    }
                    disabled={disabled}
                  />
                }
                label="Naməlum müddətə qədər"
              />

              <TextField
                label="Şərh"
                fullWidth
                value={entry.comment}
                onChange={(event) => onChange(entry.tempId, { ...entry, comment: event.target.value })}
                disabled={disabled}
              />
            </Stack>
          ))}

          {entries.length === 0 && (
            <Typography color="text.secondary" variant="body2">
              Qiymət əlavə edilməyib — resurs qiymətsiz də yadda saxlanıla bilər.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
