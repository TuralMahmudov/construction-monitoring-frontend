import { PageContainer, PageHeader } from '../../../shared/components';
import { CategorySearchFilters } from '../components/CategorySearchFilters';
import { CategorySearchGrid } from '../components/CategorySearchGrid';
import { useCategorySearchParams } from '../hooks/useCategorySearchParams';

export function CategorySearchPage() {
  const { params, updateParams } = useCategorySearchParams();

  return (
    <PageContainer>
      <PageHeader title="Resurs Kataloqu" subtitle="Bütün kateqoriyalar üzrə axtarış" />

      <CategorySearchFilters
        name={params.name}
        status={params.status}
        type={params.type}
        onChange={updateParams}
      />

      <CategorySearchGrid params={params} onParamsChange={updateParams} />
    </PageContainer>
  );
}
