import { TYPE_CODES } from '@/modules/core';
import type { IFCRow, ScopeOption, ScopeTree, SelectionValue } from '../types';

/**
 * Cascading-dropdown helper.
 *
 * Returns the options visible at `level_num`, given the user's current
 * selections at higher levels. Used by both `ScopeDropdowns` (rendering)
 * and `IFCDashboard` (auto-select + ALL-expansion).
 */
export function optionsForLevel(
	scope: ScopeTree,
	level_num: number,
	selections: Record<number, SelectionValue>,
): ScopeOption[] {
	const lvl = scope.levels.find((l) => l.level_num === level_num);
	if (!lvl) return [];

	const firstLevelNum = scope.levels[0]?.level_num ?? 0;
	if (level_num === firstLevelNum) return lvl.options;

	const parent = selections[level_num - 1] ?? null;
	if (parent === null) return [];

	if (parent === 'ALL') {
		const parentOpts = optionsForLevel(scope, level_num - 1, selections);
		const parentIds = new Set(parentOpts.map((o) => o.id));
		return lvl.options.filter((o) => o.parent_id !== null && parentIds.has(o.parent_id));
	}

	return lvl.options.filter((o) => o.parent_id === parent);
}

/**
 * Resolve the IFC status code for a row.
 * A null `ifc` becomes the UNREGISTERED type code (frontend-only label).
 */
export function effectiveStatus(row: IFCRow): string {
	if (row.ifc === null) return TYPE_CODES.IFC_STATUS.UNREGISTERED;
	return row.ifc.status_code ?? TYPE_CODES.IFC_STATUS.SAVED;
}
