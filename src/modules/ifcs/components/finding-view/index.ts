/**
 * IFC FINDINGS — DETAIL VIEW
 *
 * Componentes de la página de detalle de un hallazgo (/ifc-findings/[id]).
 *
 * Aquí sí va:
 * - FindingDetailPage, FindingGeneralInfo, FindingActionsTable, FINDING_VIEW_LABELS
 *
 * Aquí NO va:
 * - llamadas HTTP directas (van en services/)
 * - primitivos UI reutilizables (van en shared/components/ui)
 */

export { default as FindingDetailPage } from './FindingDetailPage';
export * from './FindingGeneralInfo';
export * from './FindingActionsTable';
export * from './findingViewLabels';
