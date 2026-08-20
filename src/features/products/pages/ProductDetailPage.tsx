import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { isOrganizationActor } from '../../../shared/lib/permissions';
import { useProduct } from '../hooks/useProduct';
import { ProductAttributesReadOnly } from '../components/ProductAttributesReadOnly';
import { ProductGeneralTab } from '../components/ProductGeneralTab';
import { ProductListingsTab } from '../components/ProductListingsTab';

type TabKey = 'general' | 'attributes' | 'listings';

const TAB_KEYS: TabKey[] = ['general', 'attributes', 'listings'];

export function ProductDetailPage() {
  const { user } = useAuth();
  const canAccess = !isOrganizationActor(user);
  const { id } = useParams<{ id: string }>();
  // URL-driven so a link (bax MarketAverageDetailDialog "Təchizatçılara bax")
  // can jump straight to a specific tab instead of always landing on Ümumi.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab: TabKey = TAB_KEYS.includes(rawTab as TabKey) ? (rawTab as TabKey) : 'general';
  const setTab = (value: TabKey) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    next.set('tab', value);
    return next;
  }, { replace: true });
  const productQuery = useProduct(id ?? null, canAccess);

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Məhsul"
        subtitle={productQuery.data?.code}
        actions={
          <Button component={RouterLink} to="/products" startIcon={<ArrowBackRoundedIcon />}>
            Siyahıya qayıt
          </Button>
        }
      />

      {productQuery.isLoading && (
        <Stack sx={{ alignItems: 'center', py: 6 }}>
          <CircularProgress />
        </Stack>
      )}

      {productQuery.isError && <Alert severity="error">{getApiErrorMessage(productQuery.error)}</Alert>}

      {productQuery.data && (
        <Paper variant="outlined">
          <Tabs value={tab} onChange={(_event, value) => setTab(value)} sx={{ px: 2, pt: 1 }}>
            <Tab label="Ümumi" value="general" />
            <Tab label="Xüsusiyyətlər" value="attributes" />
            <Tab label="Elanlar" value="listings" />
          </Tabs>
          <Stack sx={{ p: 2 }}>
            {tab === 'general' && <ProductGeneralTab product={productQuery.data} />}
            {tab === 'attributes' && <ProductAttributesReadOnly productId={productQuery.data.id} />}
            {tab === 'listings' && <ProductListingsTab productId={productQuery.data.id} />}
          </Stack>
        </Paper>
      )}
    </PageContainer>
  );
}
