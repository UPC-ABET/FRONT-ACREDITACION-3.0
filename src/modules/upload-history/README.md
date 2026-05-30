# upload-history (front) — Vista 4.3 del blueprint

Bandeja interactiva de errores e historial de rollbacks. Consume el endpoint
`GET /uploads/upload-logs` (back) agregado en esta misma sesión.

Destino al migrar: `New_ABET/FRONT-ACREDITACION-3.0/src/modules/upload-history/`.

## Estructura

```
upload-history/
  components/
    UploadHistoryTable.tsx       tabla cronológica con badge de estado + acciones
    ErrorsDrawer.tsx             drawer derecho con errores por fila + edición in-place
    RollbackConfirmDialog.tsx    modal de confirmación de impacto irreversible
  hooks/
    useUploadHistory.ts          listLogs + findLog (TanStack)
    useParseErrorExcel.ts        parsea el Excel anotado base64 → ParsedErrorRow[]
  services/
    uploadHistoryService.ts      apiGet /uploads/upload-logs[?...] y /:id
  pages/
    UploadHistoryPage.tsx        vista 4.3 orquestadora
  types/                         UploadLog, UploadLogFilters, ParsedErrorRow
  i18n.keys.json                 es/en
```

## Ruta (app/) al integrar

```tsx
// src/app/(protected)/uploads/history/page.tsx
import { UploadHistoryPage } from '@/modules/upload-history'
import {
  rollbackSectionsUpload, rollbackEnrolledStudentsUpload /* ...los 12 */
} from '@/modules/uploads'

const rollbackByUploadType = {
  SECCION:               rollbackSectionsUpload,
  ALUMNOS_MATRICULADOS:  rollbackEnrolledStudentsUpload,
  // ... resto de los 12 uploadType codes
}

export default function Page() {
  return <UploadHistoryPage rollbackByUploadType={rollbackByUploadType} />
}
```

## Reuso del `ErrorsDrawer` desde la canvas (vista 4.2)

El drawer está exportado por separado. Cuando una carga falla en la canvas
(success=false con `excelWithErrors: string`), la canvas puede abrir el drawer
pasándole ese base64 — convierte la descarga ciega en edición interactiva:

```tsx
import { ErrorsDrawer } from '@/modules/upload-history'

<ErrorsDrawer
  open={!!result?.excelWithErrors && !result.success}
  onClose={...}
  excelBase64={result.excelWithErrors}
  onResubmitRow={async (row) => { /* reconstruir Excel de 1 fila y re-enviar al flow */ }}
/>
```

## Dependencias al integrar

- `exceljs` en el front (ya requerido por cargas-canvas).
- `@/shared/components`: `Card`, `Button`, `Dialog`.
- `@/providers`: `useI18n`.
- Fusionar `i18n.keys.json` en `src/languaje/locales/{es,en}.json`.

## Notas de diseño

- **Re-envío de fila editada** — el `onResubmitRow` se deja como callback opcional
  porque cada flow tiene una firma de payload distinta. La lógica de reconstruir
  un Excel de 1 fila + llamar al service del flow va en la página que usa el drawer.
- **El back no persiste el Excel anotado** — el `excelWithErrors` solo existe
  en memoria al momento de la carga fallida. La vista 4.3 (historial) muestra
  solo loads exitosos/revertidos; el drawer cobra utilidad cuando se invoca
  desde la canvas con el resultado recién recibido.
- **Dispatch de rollback desacoplado** — `UploadHistoryPage` recibe un mapping
  `uploadType → rollbackFn` y elige el correcto según el log. Evita acoplar este
  módulo a los 12 services.
