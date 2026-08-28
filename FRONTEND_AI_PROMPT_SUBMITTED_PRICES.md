# CCMS Frontend — Hesabatlar Modulu: Təqdim Edilmiş Qiymətlər (hesabat #4)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`** və **`FRONTEND_AI_PROMPT_REPORTS.md`**-nin **davamıdır** — konvensiyalar təkrarlanmır. **Diqqət:** bu hesabat digərlərindən (#1/#2/#3) fərqlidir — o birilər client-side (SheetJS) generasiya olunurdu, bu isə **backend birbaşa `.xlsx` fayl qaytarır** (aşağıya bax, səbəb izah olunub). `exportToExcel()` utility-si bu fayl üçün **lazım deyil**.
>
> **Yenilənib (2026-08-24):** frontend-in öz sorğusu ilə endpoint-ə yeni opsional **`categoryId`** parametri əlavə olundu (bax aşağı, "Kateqoriya ilə filtr" bölməsi) — əgər aşağıdakı orijinal spesifikasiyanı artıq tətbiq etmisinizsə, sadəcə bu yeni bölməni oxuyub tətbiq edin, qalanı dəyişməyib.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Kontekst

Bu hesabat "bu rübdə hansı təşkilat hansı məhsula, hansı regionda, hansı qiymət təqdim edib" sualını cavablandırır — sənədlərin/resursların DEYİL, **fərdi qiymət qeydlərinin** (təqdimatların) siyahısıdır. Digər 3 hesabatdan (aqreqat statistika) fərqli olaraq bu, xam məlumatdır — sətir sayı zamanla böyüyür (hər təqdimat = 1 sətir, silinmir), ona görə **backend-də generasiya olunur**, brauzerə göndərilmədən əvvəl.

---

## `GET /api/reports/submitted-prices` — yeni endpoint

**İcazə:** `COST_READ` + `VIEW_ALL_ORGANIZATION_RESOURCES` (mərkəz-yalnız).

**Query params:**
- **`periodYear`, `periodQuarter` — MƏCBURİDİR.** Göndərilməsə `400` ("Missing required parameter"). `periodQuarter` `1`-`4` xaricindəsə `400`.
- `organizationId`, `productId`, `categoryId`, `regionId`, `status` — opsional, əlavə daraltma üçün. `categoryId` haqda bax aşağı, "Kateqoriya ilə filtr" bölməsi.

**Cavab:** JSON DEYİL — birbaşa `.xlsx` fayl (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="Teqdim_Edilmis_Qiymetler_{il}_Q{rüb}.xlsx"`).

**Sütunlar (backend-də hazırdır, dəyişməyə ehtiyac yoxdur):** Təşkilat, Məhsul kodu, Məhsul adı, Kateqoriya, Ölçü vahidi, Region, İl, Rüb, Qiymət, ƏDV, Valyuta, Effektiv tarix, Status (mətnə çevrilmiş: Gözləyir / Təsdiqlənib / Rədd edilib / Bayraqlanıb (kənar dəyər)).

---

## Ekran: Hesabatlar → "Təqdim Edilmiş Qiymətlər"

Bu, digər hesabat ekranlarından fərqli olaraq **cədvəl göstərmir** — sadəcə bir filtr forması + "Yüklə" düyməsidir (nəticəni əvvəlcədən ekranda göstərmirik, birbaşa fayl kimi enir).

### Forma

- **İl** (say seçici, məcburi, defolt: hazırkı il) + **Rüb** (Q1-Q4 dropdown, məcburi, defolt: hazırkı rüb).
- **Təşkilat** (opsional, `/api/organizations`-dan dropdown).
- **Məhsul VƏ YA Kateqoriya** (opsional, **bir sahə, iki rejim** — bax aşağı "Kateqoriya ilə filtr" bölməsi; bu, orijinal spesifikasiyadakı "sadə axtarış, ağac YOX" qərarını əvəz edir).
- **Region** (opsional, `/api/regions`-dan dropdown).
- **Status** (opsional, dropdown: Gözləyir/Təsdiqlənib/Rədd edilib/Bayraqlanıb).

### "Yüklə" düyməsi

İl/Rüb doldurulmadan düymə **deaktiv** olsun (backend-in `400`-ünü gözləməyin, frontend-də əvvəlcədən yoxlayın — daha yaxşı UX).

Klikləndə **birbaşa brauzer naviqasiyası** ilə (`window.location.href = "...?periodYear=...&periodQuarter=..."` və ya bir `<a>` linki, `fetch`+`blob` YOX) endpoint-ə gedin — brauzer `Content-Disposition: attachment` başlığını görüb faylı avtomatik endirəcək, əlavə JS kod lazım deyil. **Diqqət — auth:** bu endpoint də digərləri kimi `Authorization: Bearer` başlığı tələb edir; sadə `<a href>`/naviqasiya bunu göndərməz. Mövcud fayl-yükləmə axınınızda (`/api/documents/{id}/download` üçün nə edirsinizsə, eyni yanaşmanı buraya da tətbiq edin) — adətən ya `fetch` ilə `blob` alıb `URL.createObjectURL` ilə süni bir `<a download>` klikləməkdir, ya da müvəqqəti bir token-li URL sxemi. Mövcud sənəd-yükləmə kodunuz varsa onu birbaşa reuse edin, yenidən yazmayın.

Nəticə boş ola bilər (seçilmiş rübdə heç bir təqdimat yoxdursa) — bu halda backend boş (yalnız başlıq sətri olan) bir `.xlsx` qaytarır, xəta yoxdur; istəsəniz düymənin yanında "Nəticə boş ola bilər" qeydi qoya bilərsiniz, məcburi deyil.

---

## Kateqoriya ilə filtr (2026-08-24 əlavəsi)

**Səbəb:** kataloqda eyni ada başlayan onlarla oxşar məhsul var (yalnız atributlarla fərqlənir — məs. eyni boru fərqli diametrlərdə), sadə mətn axtarışı ilə düzgün məhsulu tapmaq çətindir. Ona görə "Məhsul" sahəsi indi iki rejimli olmalıdır:

1. **Konkret məhsul** — mövcud axtarış/autocomplete (dəyişməyib), `productId` göndərir.
2. **Kateqoriya (leaf)** — mövcud kateqoriya-ağacı seçicisini (layihədə onsuz da var, digər ekranlarda istifadə olunur) burada da işlədin, YALNIZ **leaf** (uşaqsız) kateqoriya seçilə bilsin. Seçiləndə `categoryId` göndərilir — nəticə həmin kateqoriyadakı BÜTÜN məhsulların (avtomatik) qiymətlərini əhatə edir.

İkisi **qarşılıqlı istisna** olmalıdır (UI-da bir sahə, radio/tab və ya "Kateqoriya seç" düyməsi ilə "Konkret məhsul axtar" arasında keçid) — istifadəçi ya dəqiq məhsulu bilir, ya da bilmirsə birbaşa kateqoriyanı seçib o kateqoriyadakı hər şeyi görmək istəyir. **Backend tərəfi:** əgər hər ikisi göndərilərsə (frontend normalda göndərməməlidir), `productId` üstünlük təşkil edir və `categoryId` sükutla nəzərə alınmır (səhv birləşmə ilə boş nəticə qaytarmasın deyə) — bu, sizin UI-nızın hər ikisini eyni anda göndərməməsi üçün əlavə bir səbəbdir, arxa-plan qoruması var, amma UI-da да təmiz saxlayın.

Mövcud olmayan/uyğun gəlməyən bir `categoryId` göndərilərsə xəta yoxdur, sadəcə boş nəticə (yalnız başlıq sətri) qayıdır — eyni "nəticə boş ola bilər" davranışı yuxarıdakı kimi.

---

## Xülasə cədvəl

| Nə | Əvvəl | İndi |
|---|---|---|
| `GET /api/reports/submitted-prices` | yox idi | YENİ (`COST_READ`+`VIEW_ALL_ORGANIZATION_RESOURCES`, `.xlsx` axını) |
| `periodYear`/`periodQuarter` | — | MƏCBURİ (digər hesabatlarda opsional idi, burada fərqlidir) |
| Mexanizm | — | Backend-generasiya (digər 3 hesabatdan fərqli, client-side DEYİL) |
| Query params (2026-08-24) | `organizationId,productId,regionId,status` | + **`categoryId`** (leaf kateqoriya, `productId` ilə qarşılıqlı istisna — bax "Kateqoriya ilə filtr") |
| "Məhsul" sahəsi (2026-08-24) | yalnız sadə axtarış | + kateqoriya-ağacı (leaf) rejimi, iki-rejimli sahə |
