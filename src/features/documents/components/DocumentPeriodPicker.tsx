import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { currentQuarter, quarterToRoman } from '../../../shared/lib/period';
import { useUpdateDocumentPeriod } from '../hooks/useDocuments';
import type { CcmsDocument } from '../types/document.types';

const QUARTERS = [1, 2, 3, 4];

export interface DocumentPeriodPickerProps {
  document: CcmsDocument;
}

// § 2 (revised 2026-08-17, Tural) — "Emal et" dialoqunun içinə köçürüldü.
// Bir kliklə birbaşa dəyişən toggle-lar (əvvəlki versiya) çıxarıldı — Tural
// bunu "çox rahat dəyişmək olmasın" səbəbiylə rədd etdi: indi cari rüb bir
// düymə kimi göstərilir, üzərinə klikləndikdə YALNIZ onda I/II/III/IV
// seçimləri olan kiçik bir menyu açılır (iki addımlı, təsadüfi dəyişməyə
// qarşı). İl redaktə edilmir — həmişə sənədin mövcud ilində qalır.
export function DocumentPeriodPicker({ document }: DocumentPeriodPickerProps) {
  const updateMutation = useUpdateDocumentPeriod();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [quarter, setQuarter] = useState(document.periodQuarter ?? currentQuarter());
  const year = document.periodYear ?? new Date().getFullYear();

  // Yalnız fərqli bir sənəd üçün dialoq açılanda sıfırlanır — `document`
  // prop-u (DocumentsAdminPage-dəki snapshot) redaktədən sonra reaktiv
  // yenilənmir, ona görə klikdən sonrakı görünüş lokal state-dən asılıdır.
  useEffect(() => {
    setQuarter(document.periodQuarter ?? currentQuarter());
  }, [document.id, document.periodQuarter]);

  function handleSelect(nextQuarter: number) {
    setAnchorEl(null);
    if (nextQuarter === quarter) {
      return;
    }
    setQuarter(nextQuarter);
    updateMutation.mutate({ id: document.id, payload: { periodYear: year, periodQuarter: nextQuarter } });
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        Rüb:
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={updateMutation.isPending}
      >
        {year} {quarterToRoman(quarter)}
      </Button>
      <Menu anchorEl={anchorEl} open={anchorEl !== null} onClose={() => setAnchorEl(null)}>
        {QUARTERS.map((q) => (
          <MenuItem key={q} selected={q === quarter} onClick={() => handleSelect(q)}>
            {quarterToRoman(q)}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}
