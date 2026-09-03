# CCMS Frontend — Sənəd Önizləməsi (Excel/Word → PDF, inline baxış)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, sənəd idxalı ekranlarının (`FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_*.md`) **davamıdır** — konvensiyalar (unified response envelope, auth axını) təkrarlanmır. `GET /{id}/download` (orijinal faylı endirmək) **dəyişməyib**, bu fayl yalnız YENİ bir endpoint (`GET /{id}/preview`) və `DocumentResponse`-a əlavə olunan bir sahəni təsvir edir.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Kontekst (qısa)

İndiyə qədər Excel/Word sənədləri üçün heç bir inline baxış yox idi — sadəcə yükləmək mümkün idi. İndi bu sənədlər arxa planda avtomatik PDF-ə çevrilir (Gotenberg/LibreOffice, backend-də) və `GET /{id}/preview` ilə brauzerdə birbaşa göstərilə bilər — **`/download` ilə eyni PDF-viewer komponentini** işlədə bilərsiniz.

**Vacib:** `/preview` heç vaxt orijinal faylı vermir, HƏMİŞƏ PDF verir (Excel/Word üçün çevrilmiş, PDF/şəkil üçün orijinalın özü). Orijinal faylı əldə etmək üçün yenə `/download` istifadə edin.

---

## 1. YENİ: `DocumentResponse.previewStatus`

```json
{
  "id": "uuid", "originalFilename": "qiymet-siyahisi.xlsx", "contentType": "application/vnd...",
  "status": 1,
  "previewStatus": 3
}
```

Dəyərlər:

| Kod | Məna | Nə etmək |
|---|---|---|
| `1` NOT_APPLICABLE | Fayl artıq PDF/şəkildir, çevirməyə ehtiyac yoxdur | `/preview` çağırın — dərhal işləyir |
| `2` PENDING | Çevirmə hələ gedir (adətən bir neçə saniyə) | `/preview` çağırmayın — `409` alarsınız. "Hazırlanır..." göstərin, bir neçə saniyə sonra sənədi yenidən sorğulayın (`GET /{id}` və ya siyahını yeniləyin) |
| `3` READY | Çevrilmiş PDF hazırdır | `/preview` çağırın |
| `4` FAILED | Çevirmə uğursuz oldu (nadir hal) | `/preview` göstərməyin, sadəcə "Yüklə" düyməsini göstərin |

**Vacib:** `xlsx/xls/doc/docx` yüklənəndə status ilkin olaraq `2` (PENDING) gəlir, bir neçə saniyə sonra `3`-ə keçir — yükləmə cavabının özündə YOX, sonrakı bir sorğuda görünür. `pdf/jpg/jpeg/png` isə yükləmə cavabının özündə birbaşa `1` gəlir (heç gözləmə yoxdur).

---

## 2. YENİ: `GET /api/documents/{id}/preview`

**İcazə:** `DOCUMENT_UPLOAD` (vendor, öz sənədi) və ya `DOCUMENT_REVIEW` (mərkəzi) — `/download` ilə eyni icazə qaydası.

- `previewStatus` `1` (NOT_APPLICABLE) və ya `3` (READY) olanda: `200`, body — PDF bayt axını (`Content-Type: application/pdf`, `Content-Disposition: inline`). Mövcud PDF-viewer komponentinizi (blob URL / `<iframe>` / `<embed>`) birbaşa bura yönləndirin — `/download`-da PDF üçün etdiyiniz kimi.
- `previewStatus` `2` (PENDING) və ya `4` (FAILED) olanda: **`409 Conflict`**, `message` sahəsində aydın izah (məs. "Preview is still being generated..."). Bu halda `/preview`-a HEÇ müraciət etməyin — əvvəlcə `previewStatus`-u yoxlayın (yuxarı bax).

**Tövsiyə olunan UI axını (sənəd baxış ekranında, "Bax" düyməsi):**
```
previewStatus == 1 və ya 3  →  "Bax" düyməsi aktiv, klikləyəndə /preview açılır (yeni tab və ya inline modal)
previewStatus == 2          →  "Bax" düyməsi qeyri-aktiv/spinner, yanında "Hazırlanır..." mətni
previewStatus == 4          →  "Bax" düyməsi görünmür/qeyri-aktiv, yalnız "Yüklə" qalır
```

"Yüklə" düyməsi bütün hallarda, həmişə `/download`-a bağlı qalır və işlək olur — `previewStatus`-dan asılı deyil.

---

## 3. Nə DƏYİŞMƏYİB

- `GET /{id}/download` — eyni davranış, həmişə ORİJİNAL faylı `attachment` kimi verir.
- Yükləmə (`POST /api/documents`), sənəd siyahısı, emal axını (`/process`, `/status`, `/resources`) — heç biri toxunulmayıb.
