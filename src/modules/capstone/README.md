# capstone (front) — Vista 4.4 del blueprint

Consola de Evaluación Directa Capstone (Notas RB). Excepción del end-term para las
carreras de **Sistemas, Software y Ciencias** que ingresan sus notas de resultados de
aprendizaje **directamente en la plataforma** en lugar de subir un Excel de notas RC/RV.

> **⚠️ Backend NO implementado.** El servicio asume endpoints `/capstone/projects`,
> `/capstone/projects/:id/rubric` y `/capstone/evaluations` que **aún no existen** en
> el back de ABET-CARGAS — pertenecen al dominio `evaluation.*` (tablas legacy
> `RubricaControl`, `RubricaControlEvaluacion`, `RubricaControlEvaluacionResultadoCapstone`).
> El front está listo para conectar cuando el back se construya.

Destino al migrar: `New_ABET/FRONT-ACREDITACION-3.0/src/modules/capstone/`.

## Estructura

```
capstone/
  components/
    CapstoneProjectCard.tsx     tarjeta con círculo de progreso SVG
    RubricCriterionSlider.tsx   slider por criterio con snap a niveles de desempeño
    RubricEvaluationMatrix.tsx  matriz interactiva + suma live + observación ≥ 50 chars
  hooks/
    useCapstone.ts              useCapstoneProjects / useCapstoneRubric / useSubmitEvaluation
  services/
    capstoneService.ts          apiGet / apiPost stubs (back pendiente)
  constants/
    RUBRIC_TOTAL_SCORE = 20
    MIN_OBSERVATION_CHARS = 50
    RB_EXEMPTED_PROGRAM_CODES = ['ISI', 'ISO', 'CIE']
  types/                        CapstoneProject, CapstoneRubric, StudentEvaluation, ...
  pages/
    CapstoneConsolePage.tsx     orquesta proyectos → alumnos → matriz
  i18n.keys.json                es/en
```

## Reglas de negocio (blueprint §4.4.3)

1. **Suma de `max_score` de los criterios de la rúbrica DEBE equivaler a 20**. Si no,
   el matrix muestra alerta ámbar y deshabilita el guardado — problema de configuración
   de la rúbrica, no del evaluador.
2. **Cada criterio debe tener puntaje seleccionado** (no se puede dejar criterios sin slider movido).
3. **Observación obligatoria ≥ 50 caracteres** — feedback cualitativo para acreditación.
4. Solo se habilita el botón "Guardar" cuando las 3 condiciones se cumplen.

## Endpoints esperados del back (pendientes)

```
GET  /capstone/projects?professor_id=N        → CapstoneProject[]
GET  /capstone/projects/:id/rubric            → CapstoneRubric
POST /capstone/evaluations                    → { id }
  body: { project_id, rubric_id, student_id, scores: [{ criterion_id, score }], observation }
```

Tablas TO-BE que el back tendría que tocar (mapeo desde blueprint §3.4 — `RubricaControlEvaluacion`):
- `evaluation.rubrics` + `evaluation.rubric_question_criterias` (la rúbrica + criterios)
- `evaluation.performance_levels` (los niveles de desempeño por criterio)
- `evidence.evaluations` (la evaluación realizada por el profesor)
- `evaluation.rubric_scores` (el puntaje por criterio por evaluación)
- `evaluation.projects` + `evaluation.project_students` (proyectos Capstone + sus alumnos)

## Dependencias al integrar

- `@/shared/components`: `Card`, `Button`.
- `@/providers`: `useI18n`.
- TanStack Query con `QueryClientProvider` raíz.
- Fusionar `i18n.keys.json` en `src/languaje/locales/{es,en}.json`.
- `studentsByProject` se recibe por prop — en New_ABET vendrá de un hook del dominio
  académico (alumnos de la sección del proyecto Capstone).

## Notas de scope

- **Esta vista NO es parte del dominio "cargas"** — es evaluación directa en
  plataforma. Vive aquí porque el blueprint la lista junto a Vista 4.2 y 4.3,
  pero su back debería construirse como un módulo nuevo `evaluation/capstone/`
  en `New_ABET/BACK-ACREDITACION-3.0/src/modules/`.
- **Sliders hápticos** se implementan con `<input type="range">` nativo + snap visual
  por chip de nivel de desempeño. Si quieres el look "premium" del blueprint
  (gradient sliders animados), reemplazar el `<input>` por una lib como `@radix-ui/react-slider`
  sin alterar la lógica.
