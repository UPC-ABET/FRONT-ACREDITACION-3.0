# Reportes de Control (RC) y Verificación (RV) — Guía de integración Frontend

> Módulo backend: `src/modules/evaluation/semaphore-reports` (nombre técnico interno).
> Consumidor: Next.js (App Router) + TanStack **React Query** + Axios.
> Stack de errores/respuestas: idéntico al resto del proyecto (envelope `{ code, message, data }`, claves i18n).

> ⚠️ **Terminología de cara al usuario**: en la UI **no** uses las palabras "semáforo", "rojo", "amarillo" ni "verde". Todo se presenta en términos de **niveles de desempeño** (`performance_levels`): muestra el **nombre** del nivel (`legend[i].name`, p. ej. "Necesita mejora / Esperado / Sobresaliente") como etiqueta, y usa el `legend[i].color` únicamente como color de relleno/estilo, nunca como texto. Los identificadores `studentsRed/Yellow/Green` del JSON son solo nombres de campo internos que mapean a los niveles 1/2/3 (= `legend[0]/[1]/[2]`); tradúcelos a nombres de nivel al pintarlos.

---

## 1. Qué es este reporte

El reporte clasifica el desempeño de los alumnos por **outcome** y por **curso** en los **niveles de desempeño** (`academic.performance_levels`) configurados para el periodo académico (habitualmente 3: p. ej. 0–12.9 / 13–15.9 / 16–20). Existen dos instrumentos:

| Instrumento           | Código tipo  | Fuente de la nota                                                                                           | Escala                            |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **RC** (Control)      | `TG206-T003` | `academic.student_course_grades` → **promedio ponderado** del curso (`Σ grade × grade_type_percentage/100`) | Ya está en base **/20**           |
| **RV** (Verificación) | `TG206-T004` | `evidence.student_course_outcome_grades.grade` → nota **cruda por outcome** (suma de scores de criterios)   | Se **escala a /20** en el reporte |

### 1.1. El escalado del RV (importante)

La nota por outcome se guarda **cruda** (no en base 20). El denominador para escalar vive en el campo JSON `extra.max_outcome` de cada fila de `student_course_outcome_grades`:

- Notas provenientes de **rúbrica**: `max_outcome = nº_criterios × valor_del_nivel_de_desempeño_más_alto`.
- Notas provenientes de **carga masiva (bulk RV)**: `max_outcome = 2` (fijo). La carga masiva ahora crea la cascada completa (rúbrica → evaluación → notas), así que estas notas **también tienen rúbrica** y se pueden filtrar con `rubricIds`.

El reporte RV escala cada nota antes de clasificarla contra los `performance_levels`:

```
nota_escalada = ROUND( grade × 20 / max_outcome , 2 )
```

Luego agrupa por `(sede, curso, outcome)` y cuenta cuántos alumnos caen en cada **nivel de desempeño** para calcular el **% de alumnos** por nivel. Si `max_outcome` está ausente o es 0, la nota queda **sin nivel** (no se cuenta en ningún nivel, pero sí en el total).

> El frontend **no** hace este cálculo: el backend ya devuelve los conteos y porcentajes listos. Esta sección es solo contexto de negocio.

### 1.2. Curso "crítico" y nivel agregado

El endpoint JSON marca un curso como **crítico** (`isCritical = true`) cuando el `% de alumnos en el nivel más bajo ≥ 23%`. El backend además entrega, por fila, un `color` agregado del curso (tomado de `performance_levels.extra.color`) resuelto así:

1. Si es crítico → color del **nivel más bajo**.
2. Si no, y `studentsGreen ≥ studentsYellow` (nivel más alto ≥ nivel intermedio) → color del **nivel más alto**.
3. Si no → color del **nivel intermedio**.

`color` es solo un atributo de estilo del nivel; en la UI muestra el **nombre** del nivel, no el color como texto.

---

## 2. Endpoints

Prefijo global: `/api`. Controller: `evaluation/semaphore-reports`.

| #   | Método | Ruta                                         | Propósito                    | Content-Type respuesta |
| --- | ------ | -------------------------------------------- | ---------------------------- | ---------------------- |
| 1   | `POST` | `/api/evaluation/semaphore-reports/rc`       | Data JSON RC (para pantalla) | `application/json`     |
| 2   | `POST` | `/api/evaluation/semaphore-reports/rc/pdf`   | Descarga PDF RC              | `application/pdf`      |
| 3   | `POST` | `/api/evaluation/semaphore-reports/rc/excel` | Descarga Excel RC            | `.xlsx`                |
| 4   | `POST` | `/api/evaluation/semaphore-reports/rv`       | Data JSON RV (para pantalla) | `application/json`     |
| 5   | `POST` | `/api/evaluation/semaphore-reports/rv/pdf`   | Descarga PDF RV              | `application/pdf`      |
| 6   | `POST` | `/api/evaluation/semaphore-reports/rv/excel` | Descarga Excel RV            | `.xlsx`                |

Todos son `POST` (el body lleva los filtros).

### 2.1. Autenticación y scope

Cada request requiere:

- **JWT** válido (header `Authorization: Bearer <token>`, como el resto del sistema).
- Permiso **`EVALUATION` : `POST`** (decorador `@RequirePermission`). Sin él → `403`.
- Header **`X-Academic-Period-Id: <id>`** (obligatorio). Sin él o inválido → `400` (`error.academicPeriodRequired`).

El periodo académico se toma **del header**, no del body (aunque el DTO lo acepte).

### 2.2. Body — `SemaphoreFilterDto`

Todos los campos son **opcionales**. Omitir un filtro = "todos".

```ts
interface SemaphoreFilterDto {
	programCommissionId?: number; // filtra outcomes por comisión de programa
	outcomeId?: number; // un solo outcome
	campusId?: number; // una sola sede
	modalityTypeId?: number; // reservado (no aplicado aún en SQL)
	gradeTypeIds?: number[]; // SOLO RV: tipos de nota a incluir (multi-select). Omitir = todos.
	rubricIds?: number[]; // SOLO RV: DEPRECADO — filtra por rúbrica. Prefiere gradeTypeIds.
	lang?: 'es' | 'en'; // idioma de nombres/labels; default 'es'
	// academicPeriodId?: number; // IGNORAR: el backend usa el header X-Academic-Period-Id
}
```

> Nota: `academicPeriodId` existe en el DTO por compatibilidad pero **el valor efectivo es el del header**. No lo mandes desde el front para evitar confusión.

### 2.3. Selección por **tipo de nota** (solo RV)

> ⚠️ **Cambio importante**: el selector ya **no** es de rúbricas por ID. Una rúbrica no tiene nombre ni ningún atributo legible (solo su `id`), así que mostrar IDs en un `<select>` no aporta nada al usuario. En su lugar el filtro es por **tipo de nota** (`gradeTypeIds`), que **sí** tiene nombre (p. ej. `PA`, `TA`, `EA1`, `TB2`).

En RV, cada nota de outcome proviene de una **evaluación de rúbrica**, y **cada rúbrica pertenece a un tipo de nota** (`evaluation.rubrics.grade_type_id`). La cadena es:

```
student_course_outcome_grades.evaluation_id
  → evidence.evaluations.rubric_id
    → evaluation.rubrics.grade_type_id   (= "tipo de nota")
```

El filtro `gradeTypeIds` limita el reporte a las notas cuyo tipo de nota (vía su rúbrica) esté en la lista:

- **`gradeTypeIds` omitido o `[]`** → incluye **todos** los tipos de nota (comportamiento por defecto).
- **`gradeTypeIds: [12, 15]`** → solo notas cuyas rúbricas tengan `grade_type_id ∈ {12,15}`.

Es **multi-select**: el usuario puede elegir uno o varios tipos de nota. Aplica **únicamente a los endpoints RV** (`/rv`, `/rv/pdf`, `/rv/excel`). En RC se ignora (la nota RC es el promedio ponderado del curso, no una rúbrica puntual).

**¿De dónde saca el front la lista de tipos de nota seleccionables?** Del módulo de tipos (`core.types`), grupo **`TG205`** (los tipos de nota):

- `GET /api/types/by-group-code/TG205` — lista los tipos activos del grupo, cada uno con `{ id, code, name }` (p. ej. `EA1`, `EB1`, `PA`, `TA`, `TB1`, `TB2`, `DD1`, `PC1`, `PC2`).

El front muestra un multi-select con el **`name`** de cada tipo de nota (nunca el `id`), el usuario marca uno o varios, y esos `id` se mandan en `gradeTypeIds`.

> **Compatibilidad**: `rubricIds` sigue funcionando (filtra por `evaluations.rubric_id`) por si algún flujo ya lo usaba, pero está **deprecado** para la UI. Si mandas ambos, se aplican como **AND** (la nota debe cumplir los dos filtros). Para el selector nuevo usa **solo** `gradeTypeIds`.

---

## 3. Formato de respuesta (JSON)

### 3.1. Envelope estándar

Éxito (`200`):

```jsonc
{
	"code": 200,
	"message": "success.s200", // clave i18n
	"data": {
		/* SemaphoreReportDto */
	},
}
```

Error (ejemplo "sin datos", `404`):

```jsonc
{
	"code": 404,
	"message": "error.semaphoreReport.generateFailed", // clave i18n principal
	"data": ["error.semaphoreReport.noData"], // detalle(s) i18n
}
```

> El envelope de error es producido por `AllExceptionsFilter`. `message` y los items de `data` son **claves i18n** que el front debe traducir con su diccionario.

### 3.2. `SemaphoreReportDto` (payload de `/rc` y `/rv`)

```ts
interface SemaphoreLevelLegend {
	name: string; // p.ej. "Sobresaliente"
	minScore: number; // en escala /20
	maxScore: number;
	color: string; // hex, p.ej. "#22c55e"
}

interface SemaphoreCourseOutcomeSummary {
	sede: string;
	cicloAcademico: string;
	courseCode: string;
	courseName: string;
	outcomeCode: string;
	outcomeName: string;
	totalStudents: number;
	// Nombres de campo internos. Mapean a los niveles 1/2/3 = legend[0]/[1]/[2]
	// (más bajo / intermedio / más alto). Preséntalos con legend[i].name.
	studentsRed: number; // conteo en el nivel más bajo   (legend[0])
	studentsYellow: number; // conteo en el nivel intermedio (legend[1])
	studentsGreen: number; // conteo en el nivel más alto   (legend[2])
	percentageRed: number; // 0–100, 2 decimales
	percentageYellow: number;
	percentageGreen: number;
	isCritical: boolean; // true si percentageRed (nivel más bajo) >= 23
	color: string; // color agregado del curso (hex), solo para estilo
}

interface SemaphoreMetadata {
	programName: string;
	commissionName: string;
	academicPeriodCode: string;
	accreditorCode: string;
}

interface SemaphoreReportDto {
	legend: SemaphoreLevelLegend[]; // niveles ordenados por minScore ASC
	summary: SemaphoreCourseOutcomeSummary[]; // una fila por (sede, curso, outcome)
	metadata: SemaphoreMetadata;
}
```

**Helper recomendado** — convierte cada fila a una lista por nivel usando `legend`, para que la UI nunca hable de colores:

```ts
interface LevelCell {
	name: string;
	color: string;
	count: number;
	percentage: number;
}

function toLevels(row: SemaphoreCourseOutcomeSummary, legend: SemaphoreLevelLegend[]): LevelCell[] {
	const counts = [row.studentsRed, row.studentsYellow, row.studentsGreen];
	const pcts = [row.percentageRed, row.percentageYellow, row.percentageGreen];
	return legend.map((lv, i) => ({
		name: lv.name,
		color: lv.color,
		count: counts[i] ?? 0,
		percentage: pcts[i] ?? 0,
	}));
}
```

> El endpoint JSON (`summary`) es la fuente para la **tabla** y el **gráfico** en pantalla. Devuelve el desglose **completo** por `(sede, curso, outcome)` (todas las filas, con su bandera `isCritical`). El PDF/Excel usan **otra** vista (resumen por outcome + listados de cursos por nivel de desempeño, con el filtrado "crítico/representativo" del reporte oficial) que se renderiza dentro del archivo; el front solo la descarga. El PDF ya incluye un gráfico de barras agrupadas (una barra por nivel, por outcome) equivalente al de la sección 5.6.

#### 3.2.1. Estructura de tablas del PDF/Excel (RC y RV)

El documento oficial trae, en este orden:

1. **Resumen por Outcome** (primera tabla) → lista **solo los outcomes críticos** (`% del nivel más bajo ≥ 23%`), una fila por `(sede, outcome)` con su total de alumnos, la cantidad y el **% en el nivel más bajo**. Si **ningún** outcome es crítico, esta tabla sale **vacía** (es el comportamiento esperado: no hay nada que atender). El resto del documento (gráfico y listados) se genera igual.
2. **Listados de cursos por nivel de desempeño** (las "otras" tablas: nivel más bajo / intermedio / más alto) → cada fila es un curso con su **Cantidad**, su **%** de alumnos en ese nivel y el **Total de alumnos por Outcome**. El **%** se agregó para que se lea igual que en pantalla.

> En **pantalla** (JSON) el front decide cómo presentarlo. Si quieres reproducir la "primera tabla = solo críticos" del PDF, filtra `summary` por `row.isCritical`. El resto de tablas/gráfico usan `summary` completo. Los `%` por nivel ya vienen en cada fila (`percentageRed/Yellow/Green`).

### 3.3. Diseño de dos endpoints (recordatorio)

Hay dos "sabores" por instrumento, a propósito:

- **`/rc` y `/rv` (JSON)** → resumen liviano para mostrar **bonito** en el front (tabla + gráfico interactivo). No genera archivos.
- **`/rc/pdf`, `/rc/excel`, `/rv/pdf`, `/rv/excel`** → generan el **documento oficial** (mismo motor `ReportGeneratorService` que los reportes de `survey`), con su propio gráfico embebido y los listados de cursos por nivel de desempeño.

---

## 4. Errores — claves i18n

| Situación                               | HTTP  | `message`                               | `data[]`                           |
| --------------------------------------- | ----- | --------------------------------------- | ---------------------------------- |
| No hay datos para los filtros           | `404` | `error.semaphoreReport.generateFailed`  | `["error.semaphoreReport.noData"]` |
| Falta / inválido `X-Academic-Period-Id` | `400` | `error.academicPeriodRequired` (aprox.) | `null`                             |
| Sin permiso `EVALUATION:POST`           | `403` | `error.forbidden`                       | `null`                             |
| Sin/expirado JWT                        | `401` | `error.unauthorized`                    | `null`                             |
| Body inválido (class-validator)         | `400` | `error.validation`                      | `["<mensajes>"]`                   |

Claves disponibles del módulo (`semaphore-reports.validation.ts`):

```
error.semaphoreReport.notFound
error.semaphoreReport.noData
error.semaphoreReport.invalidFilter
error.semaphoreReport.thresholdNotFound
error.semaphoreReport.generateFailed
error.semaphoreReport.pdfFailed
error.semaphoreReport.excelFailed
```

Asegúrate de tener estas keys en el diccionario i18n del front.

---

## 5. Integración Next.js + React Query

### 5.1. Cliente Axios base

Reutiliza tu instancia con interceptores (auth + periodo). Ejemplo mínimo:

```ts
// lib/api-client.ts
import axios from 'axios';

export const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL, // .../api
});

api.interceptors.request.use((config) => {
	const token = getToken(); // tu storage
	const periodId = getActiveAcademicPeriodId();
	if (token) config.headers.Authorization = `Bearer ${token}`;
	if (periodId) config.headers['X-Academic-Period-Id'] = String(periodId);
	return config;
});
```

### 5.2. Tipos y helper de errores

```ts
// features/semaphore/types.ts
export type SemaphoreInstrument = 'rc' | 'rv';

export interface SemaphoreFilter {
	programCommissionId?: number;
	outcomeId?: number;
	campusId?: number;
	modalityTypeId?: number;
	gradeTypeIds?: number[]; // solo RV — tipos de nota (grupo TG205)
	rubricIds?: number[]; // solo RV — DEPRECADO, prefiere gradeTypeIds
	lang?: 'es' | 'en';
}

// Tipo de nota para el selector (GET /api/types/by-group-code/TG205)
export interface GradeType {
	id: number;
	code: string; // p. ej. 'TG205-T003'
	name: string; // p. ej. 'PA' — esto es lo que se muestra en el select
}

// ...(SemaphoreReportDto y sub-tipos de la sección 3.2)

export interface ApiEnvelope<T> {
	code: number;
	message: string;
	data: T;
}

export interface ApiError {
	code: number;
	message: string; // clave i18n
	data: string[] | null; // detalle(s) i18n
}
```

```ts
// features/semaphore/errors.ts
import { AxiosError } from 'axios';
import type { ApiError } from './types';

export function toApiError(err: unknown): ApiError {
	const ax = err as AxiosError<ApiError>;
	if (ax?.response?.data) return ax.response.data;
	return { code: 0, message: 'error.network', data: null };
}

// Traducción: usa la key principal + primer detalle si existe.
export function apiErrorToMessage(e: ApiError, t: (k: string) => string): string {
	const detail = e.data?.[0];
	return detail ? t(detail) : t(e.message);
}
```

### 5.3. Hook de datos JSON (pantalla)

```ts
// features/semaphore/useSemaphoreReport.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ApiEnvelope, SemaphoreFilter, SemaphoreInstrument } from './types';
import type { SemaphoreReportDto } from './types';

async function fetchSemaphore(
	instrument: SemaphoreInstrument,
	filter: SemaphoreFilter,
): Promise<SemaphoreReportDto> {
	const { data } = await api.post<ApiEnvelope<SemaphoreReportDto>>(
		`/evaluation/semaphore-reports/${instrument}`,
		filter,
	);
	return data.data;
}

export function useSemaphoreReport(
	instrument: SemaphoreInstrument,
	filter: SemaphoreFilter,
	academicPeriodId: number,
) {
	return useQuery({
		// el periodo va en la key porque cambia el scope aunque viaje por header
		queryKey: ['semaphore', instrument, academicPeriodId, filter],
		queryFn: () => fetchSemaphore(instrument, filter),
		enabled: !!academicPeriodId,
		retry: (count, err: any) => {
			// no reintentar 4xx (404 sin datos, 400, 403…)
			const status = err?.response?.status;
			if (status && status >= 400 && status < 500) return false;
			return count < 2;
		},
	});
}
```

Manejo del caso "sin datos" (404) en el componente:

```tsx
const { data, error, isLoading } = useSemaphoreReport('rv', filter, periodId);
const apiErr = error ? toApiError(error) : null;

if (isLoading) return <Spinner />;
if (apiErr?.data?.includes('error.semaphoreReport.noData'))
	return <EmptyState message={t('error.semaphoreReport.noData')} />;
if (apiErr) return <ErrorState message={apiErrorToMessage(apiErr, t)} />;
```

### 5.4. Descarga de archivos (PDF / Excel)

Los endpoints binarios devuelven el archivo como stream con `Content-Disposition`. Debe pedirse como **blob** y forzar la descarga. Como es una **acción** (no data cacheable), usa `useMutation`.

```ts
// features/semaphore/useSemaphoreDownload.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { SemaphoreFilter, SemaphoreInstrument } from './types';

type Format = 'pdf' | 'excel';

function filenameFromDisposition(header?: string, fallback = 'reporte'): string {
	if (!header) return fallback;
	// filename*=UTF-8''<encoded> tiene prioridad
	const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
	if (star?.[1]) return decodeURIComponent(star[1]);
	const plain = /filename="?([^";]+)"?/i.exec(header);
	return plain?.[1] ?? fallback;
}

async function downloadSemaphore(
	instrument: SemaphoreInstrument,
	format: Format,
	filter: SemaphoreFilter,
) {
	const res = await api.post(`/evaluation/semaphore-reports/${instrument}/${format}`, filter, {
		responseType: 'blob',
	});
	const filename = filenameFromDisposition(
		res.headers['content-disposition'],
		`Reporte_${instrument === 'rc' ? 'Control' : 'Verificacion'}_${instrument.toUpperCase()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
	);
	const url = URL.createObjectURL(res.data as Blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export function useSemaphoreDownload(instrument: SemaphoreInstrument, format: Format) {
	return useMutation({
		mutationFn: (filter: SemaphoreFilter) => downloadSemaphore(instrument, format, filter),
	});
}
```

> **Cuidado con los errores en `responseType: 'blob'`**: si el backend responde `404` con JSON, Axios entrega el body como **Blob**, no como objeto. Para leer la clave i18n del error, parsea el blob:

```ts
export async function readBlobError(err: unknown) {
	const ax = err as any;
	const blob = ax?.response?.data;
	if (blob instanceof Blob && blob.type.includes('json')) {
		try {
			return JSON.parse(await blob.text()); // -> { code, message, data }
		} catch {
			/* ignore */
		}
	}
	return { code: ax?.response?.status ?? 0, message: 'error.unknown', data: null };
}
```

Uso:

```tsx
const pdf = useSemaphoreDownload('rv', 'pdf');

<button
	disabled={pdf.isPending}
	onClick={() =>
		pdf.mutate(filter, {
			onError: async (e) => {
				const apiErr = await readBlobError(e);
				toast.error(t(apiErr.data?.[0] ?? apiErr.message));
			},
		})
	}>
	{pdf.isPending ? t('common.generating') : t('report.downloadPdf')}
</button>;
```

### 5.5. Render de la tabla (pantalla)

Genera las columnas dinámicamente desde `legend` (nombres de nivel) y usa el helper `toLevels` para los conteos por nivel. Nunca escribas "rojo/amarillo/verde" en la UI.

```tsx
// Cabecera de niveles (leyenda)
{report.legend.map((lv) => (
  <span key={lv.name} className="legend-item">
    <span className="dot" style={{ background: lv.color }} />
    {lv.name} [{lv.minScore} – {lv.maxScore}]
  </span>
))}

// Tabla: una columna por nivel de desempeño, con nombre desde legend
<thead>
  <tr>
    <th>Sede</th><th>Curso</th><th>Outcome</th><th>Total</th>
    {report.legend.map((lv) => <th key={lv.name}>{lv.name}</th>)}
    <th>Crítico</th>
  </tr>
</thead>
<tbody>
  {report.summary.map((row) => {
    const levels = toLevels(row, report.legend);
    return (
      <tr key={`${row.sede}-${row.courseCode}-${row.outcomeCode}`}>
        <td>{row.sede}</td>
        <td>{row.courseCode}</td>
        <td>{row.outcomeName}</td>
        <td>{row.totalStudents}</td>
        {levels.map((lv) => (
          <td key={lv.name} style={{ background: lv.color, color: '#fff' }}>
            {lv.count} ({lv.percentage}%)
          </td>
        ))}
        <td>{row.isCritical ? '⚠️' : ''}</td>
      </tr>
    );
  })}
</tbody>
```

### 5.6. Gráfico en pantalla (mismo que el PDF)

El PDF embebe un gráfico de barras agrupadas: por cada **outcome**, una barra por **nivel de desempeño** con el **número de alumnos**. Replícalo agregando `summary` por `outcomeCode`. Las series se generan dinámicamente desde `legend` (una por nivel), así funciona igual con 3 o 4 niveles. Ejemplo con Recharts:

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// data: [{ outcome: 'O1', level0: 3, level1: 5, level2: 12 }, ...]
function buildChartData(report: SemaphoreReportDto) {
	const byOutcome = new Map<string, Record<string, number | string>>();
	for (const r of report.summary) {
		const row = byOutcome.get(r.outcomeCode) ?? { outcome: r.outcomeCode };
		const counts = [r.studentsRed, r.studentsYellow, r.studentsGreen];
		report.legend.forEach((_, i) => {
			const key = `level${i}`;
			row[key] = ((row[key] as number) ?? 0) + (counts[i] ?? 0);
		});
		byOutcome.set(r.outcomeCode, row);
	}
	return [...byOutcome.values()].sort((a, b) =>
		String(a.outcome).localeCompare(String(b.outcome), undefined, { numeric: true }),
	);
}

export function PerformanceLevelChart({ report }: { report: SemaphoreReportDto }) {
	const data = buildChartData(report);
	return (
		<ResponsiveContainer width="100%" height={340}>
			<BarChart data={data}>
				<XAxis dataKey="outcome" />
				<YAxis allowDecimals={false} />
				<Tooltip />
				<Legend />
				{/* Una serie por nivel: etiqueta = nombre del nivel, color = color del nivel */}
				{report.legend.map((lv, i) => (
					<Bar key={lv.name} dataKey={`level${i}`} name={lv.name} fill={lv.color} />
				))}
			</BarChart>
		</ResponsiveContainer>
	);
}
```

> Usa siempre los `color` y `name` de `report.legend` para que la UI coincida con el PDF y con la configuración de `performance_levels` del periodo. Para barras **apiladas**, agrega `stackId="a"` a cada `<Bar>`.

---

## 6. Checklist de integración

- [ ] Header `X-Academic-Period-Id` inyectado en **todas** las requests (interceptor).
- [ ] `Authorization: Bearer` presente; usuario con permiso `EVALUATION:POST`.
- [ ] Claves i18n `error.semaphoreReport.*` y `error.academicPeriodRequired` en el diccionario del front.
- [ ] JSON: `useQuery` con `queryKey` que incluya `instrument`, `periodId` y `filter`; sin retry en 4xx.
- [ ] Descargas: `useMutation` + `responseType: 'blob'` + parseo de blob para errores.
- [ ] Estado vacío distinguido (`error.semaphoreReport.noData`) del estado de error genérico.
- [ ] `lang` enviado según el idioma activo de la UI (`'es' | 'en'`).
- [ ] **Terminología**: la UI no muestra "semáforo/rojo/amarillo/verde"; usa `legend[i].name` como etiqueta y `legend[i].color` solo como estilo.
- [ ] Columnas/series del gráfico y la tabla generadas dinámicamente desde `legend` (soporta 3 o 4 niveles).
- [ ] **RV**: selector por **tipo de nota** (multi-select) alimentado de `GET /api/types/by-group-code/TG205`; se envía `gradeTypeIds` (nunca `id` de rúbricas en la UI).
- [ ] Si reproduces la "primera tabla = solo críticos" del PDF en pantalla, filtra `summary` por `isCritical`.

---

## 7. Notas backend relevantes (para depurar juntos)

- SQL del reporte: `src/modules/evaluation/semaphore-reports/core/semaphore-reports.sql.ts`.
- **RV escala a /20** en la CTE `scaled_grades` antes de clasificar: `CASE WHEN NULLIF(extra->>'max_outcome','')::numeric > 0 THEN ROUND(grade*20/(extra->>'max_outcome')::numeric, 2) ELSE grade END`. Si falta `max_outcome`, usa la nota cruda como fallback.
- **Filtro `gradeTypeIds` (solo RV)**: une `scog.evaluation_id → evidence.evaluations.rubric_id → evaluation.rubrics.grade_type_id` (LEFT JOIN a `rubrics`) y filtra `($7 IS NULL OR r.grade_type_id = ANY($7))`. Los tipos de nota son `core.types` del grupo `TG205`.
- **Filtro `rubricIds` (solo RV, DEPRECADO)**: sigue disponible — filtra `($6 IS NULL OR ev.rubric_id = ANY($6))`. Si se mandan `rubricIds` y `gradeTypeIds` juntos, se aplican como **AND**. La carga masiva RV crea la cascada rúbrica→evaluación (migración `1783060000000-redesign-grades-rv-upload`), por lo que ambas notas son filtrables.
- **RC** ya opera sobre el promedio ponderado `/20` de `student_course_grades` (no re-escala); ignora `rubricIds` y `gradeTypeIds`.
- Los `performance_levels` deben existir para el **periodo** y el **instrumento** (`TG206-T003` RC / `TG206-T004` RV); si no hay niveles configurados, `legend` viene vacía y nada se clasifica.
- Umbral de curso crítico: `% del nivel más bajo ≥ 23%` (constante `CRITICAL_RED_THRESHOLD`), equivalente al `IIF(Color='Red' AND Porcentaje>=23)` del SP legacy.
- **Resumen por Outcome del PDF/Excel**: ahora filtra a **solo outcomes críticos** (`WHERE group_max_peso = 1` en `SEMAPHORE_RC_SUMMARY_SQL` / `SEMAPHORE_RV_SUMMARY_SQL`). El JSON de pantalla (`/rc`, `/rv`) **no** se filtra: sigue devolviendo todo el desglose con `isCritical` por fila.
- **Listados de cursos por nivel (PDF/Excel)**: cada fila ahora incluye el **`porcentaje`** (`cantidad / total_students_del_curso * 100`), además de `count` y `totalStudents`. El DTO `SemaphoreCourseDetailRowDto` ganó el campo `percentage`.
- **Títulos/archivos de cara al usuario** ya no dicen "Semáforo": PDF = "Reporte de Control (RC)" / "Reporte de Verificación (RV)"; archivos = `Reporte_Control_RC` / `Reporte_Verificacion_RV`.
