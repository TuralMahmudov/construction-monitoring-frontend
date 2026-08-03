import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { PageContainer, PageHeader } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { ResourceMarketAveragesTab } from '../prices/components/ResourceMarketAveragesTab';
import { ResourcePricesTab } from '../prices/components/ResourcePricesTab';
import { ResourceGeneralTab } from '../components/ResourceGeneralTab';
import { useResource } from '../hooks/useResource';

type TabKey = 'general' | 'prices' | 'market';

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabKey>('general');
  const resourceQuery = useResource(id ?? null);

  return (
    <PageContainer>
      <PageHeader
        title="Elan"
        subtitle={resourceQuery.data?.product.code}
        actions={
          <Button component={RouterLink} to="/resources" startIcon={<ArrowBackRoundedIcon />}>
            Siyahıya qayıt
          </Button>
        }
      />

      {resourceQuery.isLoading && (
        <Stack sx={{ alignItems: 'center', py: 6 }}>
          <CircularProgress />
        </Stack>
      )}

      {resourceQuery.isError && (
        <Alert severity="error">{getApiErrorMessage(resourceQuery.error)}</Alert>
      )}

      {resourceQuery.data && (
        <Paper variant="outlined">
          <Tabs value={tab} onChange={(_event, value) => setTab(value)} sx={{ px: 2, pt: 1 }}>
            <Tab label="Ümumi" value="general" />
            <Tab label="Qiymətlər" value="prices" />
            <Tab label="Bazar Qiyməti" value="market" />
          </Tabs>
          <Stack sx={{ p: 2 }}>
            {tab === 'general' && <ResourceGeneralTab resource={resourceQuery.data} />}
            {tab === 'prices' && <ResourcePricesTab resourceId={resourceQuery.data.id} />}
            {tab === 'market' && <ResourceMarketAveragesTab resource={resourceQuery.data} />}
          </Stack>
        </Paper>
      )}
    </PageContainer>
  );
}
