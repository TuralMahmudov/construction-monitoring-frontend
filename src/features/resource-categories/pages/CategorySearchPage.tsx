import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Button from '@mui/material/Button';
import { PageContainer, PageHeader } from '../../../shared/components';
import { CategoryFormDrawer } from '../components/CategoryFormDrawer';
import { CategorySearchFilters } from '../components/CategorySearchFilters';
import { CategorySearchGrid } from '../components/CategorySearchGrid';
import { useCategorySearchParams } from '../hooks/useCategorySearchParams';
import { useCategoryUiStore } from '../store/categoryUiStore';

export function CategorySearchPage() {
  const { params, updateParams } = useCategorySearchParams();
  const openCreateDrawer = useCategoryUiStore((state) => state.openCreateDrawer);
  const openEditDrawer = useCategoryUiStore((state) => state.openEditDrawer);

  return (
    <PageContainer>
      <PageHeader
        title="Resurs Kateqoriyaları"
        subtitle="Bütün kateqoriyalar üzrə axtarış və idarəetmə"
        actions={
          <Button
            startIcon={<AddRoundedIcon />}
            variant="contained"
            onClick={() => openCreateDrawer(null)}
          >
            Yeni kateqoriya
          </Button>
        }
      />

      <CategorySearchFilters
        name={params.name}
        code={params.code}
        status={params.status}
        type={params.type}
        onChange={updateParams}
      />

      <CategorySearchGrid params={params} onParamsChange={updateParams} onEdit={openEditDrawer} />

      <CategoryFormDrawer />
    </PageContainer>
  );
}
