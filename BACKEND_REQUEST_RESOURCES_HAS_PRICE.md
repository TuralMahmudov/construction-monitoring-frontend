# Backend üçün sorğu — `GET /api/resources`-a `hasPrice` əlavəsi

Bu fayl frontend tərəfindən 2026-08-11-də hazırlanıb, backend-ə göndərmək üçündür.

---

## Kontekst

"Mənim Resurslarım" (`GET /api/my-resources`) cavabında artıq server-hesablanan `hasPrice: boolean`
sahəsi var — cədvəldə qiyməti olan/olmayan resursları rəngli nöqtə ilə fərqləndirmək üçün istifadə
olunur (N+1 sorğunun qarşısını almaq məqsədilə).

Eyni naxışı iki yerdə də istəyirik:

1. **"Resurslar (Elanlar)"** səhifəsi (`ResourceSearchGrid`, mərkəzi/admin baxışı, `GET
   /api/resources`).
2. **"Sənədlərin İdarəsi → Bax"** audit dialoqu (`DocumentResourcesViewDialog`, eyni `GET
   /api/resources` endpoint-i, `documentId` filtri ilə) — bir sənəddən toplu yaradılan resurslardan
   hansının qiyməti daxil edilib, hansının edilmədiyini görmək üçün.

Hər ikisi eyni endpoint-dən qidalandığı üçün (`GET /api/resources`) tək bir dəyişiklik hər ikisinə
kifayət edir.

## Sorğu

- **`ResourceResponse`**-a `hasPrice: boolean` sahəsi əlavə olunsun — `MyResourceResponse`-dakı
  eyni məntiqlə (resursun ən azı bir aktiv/təsdiqlənmiş qiyməti varsa `true`).
- (İstəyə bağlı, nice-to-have) Filtr kimi də: `GET /api/resources?hasPrice=true|false` —
  `MyResourceSearchParams`-dakı eyni parametrlə paralel, admin bu görünüşdə də "qiymətsiz
  resursları" süzgəcləyə bilsin.

## Nəyə görə lazımdır

Hazırda bu iki görünüşdə qiymət məlumatı ümumiyyətlə yoxdur, və onu almaq üçün hər sətir üçün ayrı
sorğu (`GET /api/resource-prices/history?resourceId=...`) lazım olardı — sənəd audit görünüşündə
bir dəfəyə 200 sətrə qədər ola bilər, bu səbəbdən qəbuledilməz (N+1).

---
