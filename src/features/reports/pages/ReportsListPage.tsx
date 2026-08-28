import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../shared/components';
import {
  canReadCosts,
  canReviewDocuments,
  canViewAnyReport,
  canViewSubmittedPricesReport,
} from '../../../shared/lib/permissions';
import type { AuthUser } from '../../../types/auth';

// Sabit, əvvəlcədən müəyyən edilmiş hesabat formaları — "Resurslar"
// ekranındakı gələcək ad-hoc filtr-export-dan fərqli (bax
// FRONTEND_AI_PROMPT_REPORTS.md, Kontekst bölmə 1). Yeni hesabat əlavə
// olunanda sadəcə bu massivə bir sətir əlavə olunur. `visible` — hər
// hesabatın öz icazə tələbi ola bilər (bax "Təqdim Edilmiş Qiymətlər",
// COST_READ-dən əlavə VIEW_ALL_ORGANIZATION_RESOURCES da istəyir) — bu
// siyahı səhifənin ümumi qapısından (canReadCosts) daha dar ola bilər.
const REPORTS: {
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  visible: (user: AuthUser | null) => boolean;
}[] = [
  {
    label: 'Rüblük Bazar Qiyməti',
    description:
      'Məhsul kataloqu üzrə (bütün təşkilatların elanları birgə) rüblərarası bazar qiymət trendi — region və kateqoriyaya görə filtrlənə bilər, Excel-ə çıxarıla bilər.',
    path: '/reports/quarterly-market-prices',
    icon: <TrendingUpRoundedIcon />,
    visible: canReadCosts,
  },
  {
    label: 'Təqdim Edilmiş Qiymətlər',
    description:
      'Seçilmiş rübdə hansı təşkilat hansı məhsula, hansı regionda, hansı qiymət təqdim edib — hər təqdimat üçün ayrı sətir, birbaşa Excel faylı kimi enir.',
    path: '/reports/submitted-prices',
    icon: <ReceiptLongRoundedIcon />,
    visible: canViewSubmittedPricesReport,
  },
  {
    label: 'Sənəd/İdxal Hesabatı',
    description:
      'Hansı təşkilat hansı rübdə nə göndərib, statusu nədir — nəzarət hesabatı, Excel-ə çıxarıla bilər.',
    path: '/reports/documents-import',
    icon: <UploadFileRoundedIcon />,
    visible: canReviewDocuments,
  },
];

export function ReportsListPage() {
  const { user } = useAuth();
  const canAccess = canViewAnyReport(user);
  const navigate = useNavigate();
  const visibleReports = REPORTS.filter((report) => report.visible(user));

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Hesabatlar" />

      <Card>
        <List disablePadding>
          {visibleReports.map((report) => (
            <ListItemButton key={report.path} onClick={() => navigate(report.path)} sx={{ py: 2 }}>
              <ListItemIcon>{report.icon}</ListItemIcon>
              <ListItemText
                primary={report.label}
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {report.description}
                  </Typography>
                }
              />
              <ChevronRightRoundedIcon color="action" />
            </ListItemButton>
          ))}
        </List>
      </Card>
    </PageContainer>
  );
}
