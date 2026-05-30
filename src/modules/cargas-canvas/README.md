# cargas-canvas (front) — Vista 4.2 del blueprint

Panel unificado de carga masiva con stepper de hitos, selector de flow por hito,
pre-validation de cabecera Excel en memoria, y botón "Jalar de Banner" para los
flows automatizables (Secciones, Matriculados, Alumno×Sección, Notas RC, Notas Banner,
Scraping Banner).

Destino al migrar: `New_ABET/FRONT-ACREDITACION-3.0/src/modules/cargas-canvas/`.

## Estructura

```
cargas-canvas/
  components/
    StageStepper.tsx         3 hitos del ciclo (PRE_ENROLL / START_TERM / END_TERM)
    FlowRadialSelector.tsx   chips de flows habilitados por hito
    UploadCanvas.tsx         dropzone con pre-validation + botón Banner condicional
    BannerScrapingDialog.tsx modal credenciales + animación + logs en tiempo real
  hooks/
    useExcelHeaderValidator.ts  lee header del Excel en memoria con ExcelJS
  constants/
    flowRegistry.ts          registro central de los 12 flows + headers esperados + flag canBannerScrap
  types/
    stage.ts                 StageCode + FlowDescriptor
  pages/
    CargasCanvasPage.tsx     vista 4.2 — orquesta stepper + selector + canvas
  i18n.keys.json             es/en
```

## Ruta (app/) al integrar

```tsx
// src/app/(protected)/uploads/canvas/page.tsx
import { CargasCanvasPage } from '@/modules/cargas-canvas'
import { uploadSections, uploadEnrolledStudents /* ... */ } from '@/modules/uploads'

const dispatchUpload = async (flow, file) => {
  switch (flow.code) {
    case 'sections':          return uploadSections({ file, academicPeriodId })
    case 'enrolled-students': return uploadEnrolledStudents({ file, academicPeriodId })
    // ... resto de los 12
  }
}

export default function Page() {
  return <CargasCanvasPage onSubmit={dispatchUpload} />
}
```

## Dependencias al integrar

- **`exceljs`** en el front — el `useExcelHeaderValidator` lo usa para leer la cabecera del .xlsx
  en memoria. Es la única dep nueva del front respecto a uploads/.
- `@/shared/components`: `Card`, `Button`, `Input`, `Dialog`.
- `@/providers`: `useI18n`.
- Fusionar `i18n.keys.json` en `src/languaje/locales/{es,en}.json`.

## Notas de diseño

- **Pre-validation case-insensitive y sin tildes**: el matcher normaliza ambas
  cabeceras (esperada vs real) con `normalize('NFD')` antes de comparar — evita
  falsos negativos por "Sección" vs "Seccion".
- **Banner scraping es stub**: el modal muestra UI completa (credenciales + logs)
  pero el `onTrigger` recibido por prop es el que conecta con el back real. En
  esta sesión no hay back de scraping API — solo el flow `scraping-banner` que
  recibe el Excel ya extraído. El stub está listo para conectar a WebSocket/SSE
  cuando exista.
- **Catálogo de flows desacoplado**: `flowRegistry.ts` es la fuente de verdad de
  qué flow vive en qué hito y qué cabeceras espera. Editar acá si cambia el
  contrato Excel de un flow.
