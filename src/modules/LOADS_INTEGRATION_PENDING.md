# Módulo de Cargas (feat/loads) — Pendientes de integración (front)

> Estado al 2026-05-30. El núcleo (12 flujos de upload + History) está ruteado, en el Sidebar,
> con i18n mergeado, y compila (`tsc` 0 / `eslint` 0). Faltan 3 contenedores (smart components)
> que conectan páginas-vista **desacopladas** con datos/servicios de develop.

## Patrón
Las páginas-vista reciben datos/dispatchers por props (presentacionales). Un **contenedor**
hace el data-fetching + wiring y renderiza la página. Ejemplo ya hecho:
`upload-history/pages/UploadHistoryPageContainer.tsx` (mapea `upload_type → rollback service`).

## Pendientes

### 1. Cargas Canvas — vista 4.2 (hub inteligente)
- **Página:** `cargas-canvas/pages/CargasCanvasPage.tsx`
- **Props que faltan inyectar:**
  - `onSubmit(flow, file)` → conector `flow.code → uploadX service` (uploadSections / uploadProfessors / …).
  - `onBannerScrap(flow, credentials)` → opcional (scraping Banner).
- **Decisión abierta:** la canvas hoy NO maneja selección de periodo; `onSubmit` no pasa `academicPeriodId`.
  Definir de dónde toma el periodo (un `<AcademicPeriodSelect>` a nivel de page/contenedor, o contexto).
- **Esfuerzo:** medio.

### 2. Setup / Bridge — vista 4.1 (Fase 0)
- **Página:** `configuration/pages/BridgeCanvasPage.tsx`
- **Props que faltan inyectar (fetch desde develop):**
  - `availableStudyPlans` → servicio/hook de mallas (academic).
  - `programs` → `@/modules/academic` (usePrograms / programsService).
  - `commissions` → módulo accreditation.
- Las acciones (crear periodo, asociar malla×periodo, carrera×comisión) ya están en
  `configuration/services/configurationService.ts` (cableado, con `getApiData`).
- **Esfuerzo:** medio (depende de qué hooks de develop existan para esas 3 listas).

### 3. Capstone — vista 4.4 (NO es cargas)
- **Página:** `capstone/pages/CapstoneConsolePage.tsx`
- **Props:** `professorId` (de auth), `studentsByProject`.
- **Bloqueante:** **no tiene backend** (rúbrica Capstone — equivalente TO-BE en `evaluation.*` sin construir).
- Fuera del alcance "solo cargas".

## Otros pasos de integración (no contenedores)
- Rutas creadas: `src/app/loads/<flow>/page.tsx` (12) + `src/app/loads/history/page.tsx`.
  Faltan: `/loads` (canvas), `/loads/setup` (bridge) cuando se hagan sus contenedores.
- Bug **ajeno** de develop que rompe `next build`: `/survey/lcfc` usa `useSearchParams` sin Suspense
  (preexistente en `origin/develop`, no de cargas). Reportar al equipo.
