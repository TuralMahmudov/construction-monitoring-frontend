# CCMS Frontend — Hesabatlar Modulu: Təqdim Edilmiş Qiymətlər (hesabat #4)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`** və **`FRONTEND_AI_PROMPT_REPORTS.md`**-nin **davamıdır** — konvensiyalar təkrarlanmır. **Diqqət:** bu hesabat digərlərindən (#1/#2/#3) fərqlidir — o birilər client-side (SheetJS) generasiya olunurdu, bu isə **backend birbaşa `.xlsx` fayl qaytarır** (aşağıya bax, səbəb izah olunub). `exportToExcel()` utility-si bu fayl üçün **lazım deyil**.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Kontekst

Bu hesabat "bu rübdə hansı təşkilat hansı məhsula, hansı regionda, hansı qiymət təqdim edib" sualını cavablandırır — sənədlərin/resursların DEYİL, **fərdi qiymət qeydlərinin** (təqdimatların) siyahısıdır. Digər 3 hesabatdan (aqreqat statistika) fərqli olaraq bu, xam məlumatdır — sətir sayı zamanla böyüyür (hər təqdimat = 1 sətir, silinmir), ona görə **backend-də generasiya olunur**, brauzerə göndərilmədən əvvəl.

---

## `GET /api/reports/submitted-prices` — yeni endpoint

**İcazə:** `COST_READ` + `VIEW_ALL_ORGANIZATION_RESOURCES` (mərkəz-yalnız).

**Query params:**
- **`periodYear`, `periodQuarter` — MƏCBURİDİR.** Göndərilməsə `400` ("Missing required parameter"). `periodQuarter` `1`-`4` xaricindəsə `400`.
- `organizationId`, `productId`, `regionId`, `status` — opsional, əlavə daraltma üçün.

**Cavab:** JSON DEYİL — birbaşa `.xlsx` fayl (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="Teqdim_Edilmis_Qiymetler_{il}_Q{rüb}.xlsx"`).

**Sütunlar (backend-də hazırdır, dəyişməyə ehtiyac yoxdur):** Təşkilat, Məhsul kodu, Məhsul adı, Kateqoriya, Ölçü vahidi, Region, İl, Rüb, Qiymət, ƏDV, Valyuta, Effektiv tarix, Status (mətnə çevrilmiş: Gözləyir / Təsdiqlənib / Rədd edilib / Bayraqlanıb (kənar dəyər)).

---

## Ekran: Hesabatlar → "Təqdim Edilmiş Qiymətlər"

Bu, digər hesabat ekranlarından fərqli olaraq **cədvəl göstərmir** — sadəcə bir filtr forması + "Yüklə" düyməsidir (nəticəni əvvəlcədən ekranda göstərmirik, birbaşa fayl kimi enir).

### Forma

- **İl** (say seçici, məcburi, defolt: hazırkı il) + **Rüb** (Q1-Q4 dropdown, məcburi, defolt: hazırkı rüb).
- **Təşkilat** (opsional, `/api/organizations`-dan dropdown).
- **Məhsul** (opsional, axtarış/autocomplete — kateqoriya ağacını YOX, sadə axtarış istifadə edin, digər hesabatlardakı eyni qərara görə).
- **Region** (opsional, `/api/regions`-dan dropdown).
- **Status** (opsional, dropdown: Gözləyir/Təsdiqlənib/Rədd edilib/Bayraqlanıb).

### "Yüklə" düyməsi

İl/Rüb doldurulmadan düymə **deaktiv** olsun (backend-in `400`-ünü gözləməyin, frontend-də əvvəlcədən yoxlayın — daha yaxşı UX).

Klikləndə **birbaşa brauzer naviqasiyası** ilə (`window.location.href = "...?periodYear=...&periodQuarter=..."` və ya bir `<a>` linki, `fetch`+`blob` YOX) endpoint-ə gedin — brauzer `Content-Disposition: attachment` başlığını görüb faylı avtomatik endirəcək, əlavə JS kod lazım deyil. **Diqqət — auth:** bu endpoint də digərləri kimi `Authorization: Bearer` başlığı tələb edir; sadə `<a href>`/naviqasiya bunu göndərməz. Mövcud fayl-yükləmə axınınızda (`/api/documents/{id}/download` üçün nə edirsinizsə, eyni yanaşmanı buraya da tətbiq edin) — adətən ya `fetch` ilə `blob` alıb `URL.createObjectURL` ilə süni bir `<a download>` klikləməkdir, ya da müvəqqəti bir token-li URL sxemi. Mövcud sənəd-yükləmə kodunuz varsa onu birbaşa reuse edin, yenidən yazmayın.

Nəticə boş ola bilər (seçilmiş rübdə heç bir təqdimat yoxdursa) — bu halda backend boş (yalnız başlıq sətri olan) bir `.xlsx` qaytarır, xəta yoxdur; istəsəniz düymənin yanında "Nəticə boş ola bilər" qeydi qoya bilərsiniz, məcburi deyil.

---

## Xülasə cədvəl

| Nə | Əvvəl | İndi |
|---|---|---|
| `GET /api/reports/submitted-prices` | yox idi | YENİ (`COST_READ`+`VIEW_ALL_ORGANIZATION_RESOURCES`, `.xlsx` axını) |
| `periodYear`/`periodQuarter` | — | MƏCBURİ (digər hesabatlarda opsional idi, burada fərqlidir) |
| Mexanizm | — | Backend-generasiya (digər 3 hesabatdan fərqli, client-side DEYİL) |
