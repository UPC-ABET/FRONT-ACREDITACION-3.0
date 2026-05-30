# configuration (front) — Fase 0 / Vista 4.1 "The Bridge Canvas"

Módulo de configuración inicial del front, antes de cualquier carga masiva. Réplica de los 3 nodos de la
FASE_0 del blueprint (§2 + §4.1):

1. **Apertura de ciclo** — `POST /configuration/periods`
2. **Asociación malla × ciclo** — `POST/DELETE /configuration/periods/:periodId/study-plans/:studyPlanId`
   (auto-instancia los cursos del período clonando del SPAP previo del mismo `study_plan`)
3. **Asociación carrera × comisión** — `POST/DELETE /configuration/periods/:periodId/program-commissions`

Destino al migrar: `New_ABET/FRONT-ACREDITACION-3.0/src/modules/configuration/`.

## Estructura

```
configuration/
  components/
    PeriodSelector.tsx              dropdown + botón "Nuevo Ciclo"
    NewPeriodDialog.tsx             modal con máscara YYYY-01/02/00 + datepickers + radio Regular/EPE
    StudyPlanAssociationPanel.tsx   listas izq/der + dropzone (HTML5 drag&drop nativo)
    ProgramCommissionPanel.tsx      grid de cards × multichip con autosave (debounce 500ms)
  hooks/                            usePeriods / useStudyPlanPeriods / useProgramCommissions (TanStack)
  services/                         configurationService.ts (apiGet/apiPost/apiDelete)
  pages/
    BridgeCanvasPage.tsx            orquesta los 3 paneles — entry de la vista 4.1
  types/                            espejo de los DTOs/responses del back
  constants/                        MODALITY_LABEL_KEYS + CONFIG_QUERY_KEYS
  i18n.keys.json                    claves es/en a fusionar en los locales globales
```

## Ruta (app/) al integrar

```tsx
// src/app/(protected)/configuration/page.tsx
import { BridgeCanvasPage } from '@/modules/configuration'

export default function Page() {
  return <BridgeCanvasPage availableStudyPlans={...} programs={...} commissions={...} />
}
```

`availableStudyPlans / programs / commissions` se pasan por prop para mantener el módulo desacoplado;
en New_ABET deberían venir de hooks `useStudyPlans()`, `usePrograms()`, `useCommissions()` de los
módulos `academic` y `accreditation`.

## Dependencias al integrar

- `@/shared/lib/apiClient` con `apiGet / apiPost / apiDelete` (mismo del módulo `uploads`).
- `@/shared/components`: `Card`, `Button`, `Input`, `Select`, `Dialog`, `LoadingDialog`, `ErrorDialog`.
- `@/providers`: `useI18n` con función `t()`.
- Fusionar `i18n.keys.json` (es/en) en `src/languaje/locales/{es,en}.json`.
- TanStack Query — el `QueryClientProvider` debe estar montado en el árbol raíz.

## Notas de diseño

- **Drag & drop** del panel de mallas usa la API nativa HTML5 (`draggable`, `onDragOver`, `onDrop`). No
  agrega deps. El payload viaja como `text/study-plan-id`.
- **Autosave con debounce** en el panel de comisiones: cada toggle de chip pospone la llamada 500ms;
  si el usuario alterna el mismo chip dos veces, se cancela el timer anterior y nada se envía.
- **Estado optimista** en `ProgramCommissionPanel`: la UI muestra el cambio antes de que el servidor
  confirme. Si la llamada falla, el siguiente refetch reconcilia el estado (server wins).
- **Rollback bloqueado** por el back si hay dependencias (course_sections / outcomes). El front
  muestra el error tal cual lo devuelve `HttpException.errors`.
