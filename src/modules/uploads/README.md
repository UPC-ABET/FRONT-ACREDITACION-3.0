# uploads (front)

Módulo de cargas del front, siguiendo `../../../../CLAUDE.md` (feature-sliced, TanStack Query, apiClient, i18n).
Destino al migrar: `New_ABET/FRONT-ACREDITACION-3.0/src/modules/uploads/`.

## Estado

| Pieza | Estado |
|---|---|
| `types/` (UploadResult + 11 payloads) | ✅ |
| `constants/` (UPLOAD_TYPE codes — 12 códigos) | ✅ |
| `services/` (upload + rollback para los 12 flujos) | ✅ |
| `hooks/` (use*Upload + useRollback* para los 12 flujos + downloadErrorExcel) | ✅ |
| `components/*UploadForm` (12 formularios — dropzone + upload + Excel-con-errores + diálogos) | ✅ |
| `pages/*UploadPage` (12 páginas — selector de período + form) | ✅ |
| `i18n.keys.json` (claves es/en para los 12 flujos) | ✅ |

## Rutas (app/) al integrar — todas las páginas

```
src/app/(protected)/uploads/
  sections/page.tsx            → SectionsUploadPage
  enrolled-students/page.tsx   → EnrolledStudentsUploadPage
  professors/page.tsx          → ProfessorsUploadPage
  grades-rc/page.tsx           → GradesRcUploadPage
  student-sections/page.tsx    → StudentSectionsUploadPage
  ppp/page.tsx                 → PppUploadPage
  scraping-banner/page.tsx     → ScrapingBannerUploadPage
  grades-banner/page.tsx       → GradesBannerUploadPage
  study-plans/page.tsx         → StudyPlansUploadPage
  charts/page.tsx              → ChartsUploadPage
  outcomes/page.tsx            → OutcomesUploadPage
  delegates/page.tsx           → DelegatesUploadPage
```

Patrón de cada `page.tsx`:
```tsx
import { <Flow>UploadPage } from '@/modules/uploads'
export default function Page() { return <<Flow>UploadPage /> }
```

## Dependencias al integrar

- `@/shared/lib/apiClient` (apiGet/apiPost/...) aún NO existe en el front nuevo (hoy usa `fetch` crudo).
  Es un util compartido documentado en `CLAUDE.md`; debe existir al integrar. `apiPost` debe aceptar `FormData`
  (multipart) además de JSON para el upload.
- Fusionar `i18n.keys.json` (es/en) en `src/languaje/locales/{es,en}.json`.
- Selector de período: hoy `SectionsUploadPage` recibe `periodOptions` por prop; reemplazar por
  `<AcademicPeriodSelect />` de `@/modules/academic/components` cuando exista.
- Plantilla descargable ("Descargar plantilla" del legacy): pendiente — requiere endpoint de plantilla (fuera del scope del piloto).
