import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../shared/components';
import { isOrganizationActor } from '../../../shared/lib/permissions';
import { ProductSearchFilters } from '../components/ProductSearchFilters';
import { ProductSearchGrid } from '../components/ProductSearchGrid';
import { useProductSearchParams } from '../hooks/useProductSearchParams';

// § 10 — standalone catalog browse/search, independent of the category tree
// (bax CategoryProductsPanel for the tree-scoped view). Creating a product
// happens via the Resurslar "Elan Yarat" flow (§ 6), not from here.
export function ProductListPage() {
  const { user } = useAuth();
  const { params, updateParams } = useProductSearchParams();

  if (isOrganizationActor(user)) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Məhsullar" subtitle="Kataloq — hər məhsulun öz kodu, xüsusiyyətləri və vahidi" />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <ProductSearchFilters
            category={params.category}
            name={params.name}
            code={params.code}
            unit={params.unit}
            active={params.active}
            onChange={updateParams}
          />
        </CardContent>
      </Card>

      <Card>
        <ProductSearchGrid params={params} onParamsChange={updateParams} />
      </Card>
    </PageContainer>
  );
}
