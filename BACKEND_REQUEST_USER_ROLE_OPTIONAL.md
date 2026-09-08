# Backend üçün sorğu — `POST /api/users`-də `roleNames` da opsional olsun

Bu fayl frontend tərəfindən 2026-09-07-də hazırlanıb, backend-ə göndərmək üçündür.

## Kontekst

`FRONTEND_AI_PROMPT_CENTRAL_ORG_AND_ROLES.md` § 1 (2026-09-07) `POST /api/organizations`-da `roleNames`-i opsional etdi — göndərilməsə, backend özü `OPERATOR` təyin edir. Bunu tətbiq etdik: "Yeni Təşkilat" formasından rol seçimi sahəsini tamamilə çıxardıq.

Tural eyni sadələşdirməni "Yeni İstifadəçi" (mərkəzi heyət, `POST /api/users`) formasında da istədi ("istifadəçi yaradanda da rol lazım deyil"). Amma `GET /v3/api-docs`-u yoxladıq — `CreateUserRequest` sxemində `roleNames` hələ də **məcburi** sahədir (`required: [email, password, roleNames, username]`). Yəni bu formada sahəni sadəcə göndərməmək 400 ilə nəticələnəcək.

## Müvəqqəti frontend həlli (indi tətbiq olunub)

`UserCreateDialog.tsx`-dən rol seçimi UI-si çıxarıldı, amma sahə formda qalır və hər zaman `roleNames: ["VIEWER"]` göndərilir (ən aşağı səlahiyyət — "fail safe": admin sonradan `UserEditDialog`-da bilərəkdən yüksək rol təyin edə bilər, amma default olaraq heç kimə görünmədən əlavə səlahiyyət verilmir).

## Sorğu

`POST /api/users`-də də `roleNames`-i `POST /api/organizations`-dakı kimi opsional edin — göndərilməsə, sizin seçəcəyiniz bir defolt (məs. `VIEWER`, ən aşağı səlahiyyət) avtomatik təyin olunsun. Bu, iki faydası var:
1. Frontend-in hazırkı hardcode edilmiş `["VIEWER"]` sabitini də silib, orqanizasiya formasında olduğu kimi sahəni tamamilə formdan çıxarmağa (heç göndərməməyə) imkan verər.
2. İki endpoint arasında davranış uyğunluğu saxlanar.

Təcililik aşağıdır — hazırkı frontend həlli (`["VIEWER"]` sabit göndərmək) artıq işləyir və təhlükəsizdir, bu sadəcə uzunmüddətli səliqə üçündür.
