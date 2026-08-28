import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { PageContainer, PageHeader } from '../../../shared/components';
import { CategorySearchFilters } from '../components/CategorySearchFilters';
import { CategorySearchGrid } from '../components/CategorySearchGrid';
import { useCategorySearchParams } from '../hooks/useCategorySearchParams';

export function CategorySearchPage() {
  const { params, updateParams } = useCategorySearchParams();

  return (
    <PageContainer>
      <PageHeader title="Resurs Kataloqu" />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <CategorySearchFilters
            name={params.name}
            status={params.status}
            type={params.type}
            onChange={updateParams}
          />
        </CardContent>
      </Card>

      <Card>
        <CategorySearchGrid params={params} onParamsChange={updateParams} />
      </Card>
    </PageContainer>
  );
}
