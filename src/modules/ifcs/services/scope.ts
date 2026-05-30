import { TYPE_CODES } from '@/modules/core';
import type { IFCRow, ScopeOption, ScopeTree, SelectionValue } from '../types';

/**
 * Cascading-dropdown helper.
 *
 * Returns the options visible at `levelNum`, given the user's current
 * selections at higher levels. Used by both `ScopeDropdowns` (rendering)
 * and `IFCDashboard` (auto-select + ALL-expansion).
 */
export function optionsForLevel(
	scope: ScopeTree,
	levelNum: number,
	selections: Record<number, SelectionValue>,
): ScopeOption[] {
	const lvl = scope.levels.find((l) => l.levelNum === levelNum);
	if (!lvl) return [];

	const firstLevelNum = scope.levels[0]?.levelNum ?? 0;
	if (levelNum === firstLevelNum) return lvl.options;

	const parent = selections[levelNum - 1] ?? null;
	if (parent === null) return [];

	if (parent === 'ALL') {
		const parentOpts = optionsForLevel(scope, levelNum - 1, selections);
		const parentIds = new Set(parentOpts.map((o) => o.id));
		return lvl.options.filter((o) => o.parentId !== null && parentIds.has(o.parentId));
	}

	return lvl.options.filter((o) => o.parentId === parent);
}

/**
 * Resolve the IFC status code for a row.
 * A null `ifc` becomes the UNREGISTERED type code (frontend-only label).
 */
export function effectiveStatus(row: IFCRow): string {
	if (row.ifc === null) return TYPE_CODES.IFC_STATUS.UNREGISTERED;
	return row.ifc.statusCode ?? TYPE_CODES.IFC_STATUS.SAVED;
}
