import type { ScopeOption, ScopeTree, SelectionValue } from '../types';

export function optionsForLevel(
	scope: ScopeTree,
	levelNum: number,
	selections: Record<number, SelectionValue>,
): ScopeOption[] {
	const index = scope.levels.findIndex((l) => l.levelNum === levelNum);
	if (index === -1) return [];

	const lvl = scope.levels[index];
	if (index === 0) return lvl.options;

	const parentLevelNum = scope.levels[index - 1].levelNum;
	const parent = selections[parentLevelNum] ?? null;
	if (parent === null) return [];

	if (parent === 'ALL') {
		const parentOpts = optionsForLevel(scope, parentLevelNum, selections);
		const parentIds = new Set(parentOpts.map((o) => o.id));
		return lvl.options.filter((o) => o.parentId !== null && parentIds.has(o.parentId));
	}

	return lvl.options.filter((o) => o.parentId === parent);
}
