import { httpClient } from '../../../services/httpClient';
import { quarterToRoman } from '../../../shared/lib/period';
import type { SubmittedPricesReportParams } from '../types/submittedPricesReport.types';

const BASE_URL = '/api/reports/submitted-prices';

// Backend streams a raw .xlsx (not the unified JSON envelope, unlike every
// other endpoint in this app) — same auth-protected blob-download pattern as
// documentsApi.downloadDocument, since a plain <a href> can't attach the JWT
// header. Filename mirrors the backend's own Content-Disposition convention
// (bax FRONTEND_AI_PROMPT_SUBMITTED_PRICES.md) rather than parsing the header.
export async function downloadSubmittedPricesReport(params: SubmittedPricesReportParams): Promise<void> {
  const response = await httpClient.get<Blob>(BASE_URL, { params, responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Teqdim_Edilmis_Qiymetler_${params.periodYear}_${quarterToRoman(params.periodQuarter)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
