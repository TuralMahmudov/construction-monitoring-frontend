import { useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { canViewSubmittedPricesReport } from '../../../shared/lib/permissions';
import { currentQuarter, quarterToRoman } from '../../../shared/lib/period';
import { useOrganizationLookup } from '../../admin/organizations/hooks/useOrganizations';
import { ProductAutocomplete } from '../../products/components/ProductAutocomplete';
import type { Product } from '../../products/types/product.types';
import { useAllRegions } from '../../reference-data/hooks/useReferenceOptions';
import { PRICE_STATUS_LABELS, type PriceStatus } from '../../resources/prices/types/resourcePrice.types';
import { downloadSubmittedPricesReport } from '../api/submittedPricesReportApi';

const QUARTERS = [1, 2, 3, 4];
const STATUS_OPTIONS: PriceStatus[] = [1, 2, 3, 4];

export function SubmittedPricesReportPage() {
  const { user } = useAuth();
  const canAccess = canViewSubmittedPricesReport(user);
  const { enqueueSnackbar } = useSnackbar();

  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<number | ''>(currentQuarter());
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [regionId, setRegionId] = useState('');
  const [status, setStatus] = useState<PriceStatus | ''>('');
  const [isDownloading, setIsDownloading] = useState(false);

  const organizations = useOrganizationLookup(canAccess);
  const organizationOptions = Array.from(organizations.values()).sort((a, b) => a.name.localeCompare(b.name));
  const regionsQuery = useAllRegions(canAccess);

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  async function handleDownload() {
    if (!year || !quarter) {
      return;
    }
    setIsDownloading(true);
    try {
      await downloadSubmittedPricesReport({
        periodYear: year,
        periodQuarter: quarter,
        organizationId: organizationId || undefined,
        productId: product?.id,
        regionId: regionId || undefined,
        status: status || undefined,
      });
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Təqdim Edilmiş Qiymətlər"
        subtitle="Seçilmiş rübdə hansı təşkilat hansı məhsula, hansı regionda, hansı qiymət təqdim edib — hər təqdimat üçün ayrı sətir"
        actions={
          <Button component={RouterLink} to="/reports" startIcon={<ArrowBackRoundedIcon />}>
            Hesabatlara qayıt
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                type="number"
                label="İl"
                required
                value={year}
                onChange={(event) => setYear(event.target.value === '' ? '' : Number(event.target.value))}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                label="Rüb"
                required
                value={quarter}
                onChange={(event) => setQuarter(event.target.value === '' ? '' : Number(event.target.value))}
                sx={{ flex: 1 }}
              >
                {QUARTERS.map((q) => (
                  <MenuItem key={q} value={q}>
                    {quarterToRoman(q)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Autocomplete
              options={organizationOptions}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              value={organizationOptions.find((org) => org.id === organizationId) ?? null}
              onChange={(_event, newValue) => setOrganizationId(newValue?.id ?? null)}
              renderInput={(params) => <TextField {...params} label="Təşkilat" placeholder="Hamısı" />}
            />

            <ProductAutocomplete value={product} onChange={setProduct} />

            <TextField
              select
              label="Region"
              value={regionId}
              disabled={regionsQuery.isLoading}
              onChange={(event) => setRegionId(event.target.value)}
            >
              <MenuItem value="">Bütün regionlar</MenuItem>
              {(regionsQuery.data?.content ?? []).map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  {region.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value === '' ? '' : (Number(event.target.value) as PriceStatus))}
            >
              <MenuItem value="">Hamısı</MenuItem>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {PRICE_STATUS_LABELS[s]}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={isDownloading ? <CircularProgress size={16} color="inherit" /> : <DownloadRoundedIcon />}
                onClick={handleDownload}
                disabled={isDownloading || !year || !quarter}
              >
                Yüklə
              </Button>
              <Typography variant="caption" color="text.secondary">
                Nəticə boş ola bilər (seçilmiş rübdə heç bir təqdimat yoxdursa).
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
