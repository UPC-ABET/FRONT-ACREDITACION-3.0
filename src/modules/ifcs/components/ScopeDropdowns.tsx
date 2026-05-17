'use client';

import { useMemo } from 'react';
import { Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { LEVEL_LABELS } from '../constants';
import { optionsForLevel } from '../services/scope';
import type { ScopeTree, SelectionValue } from '../services/types';

type Props = {
	scope: ScopeTree;
	selections: Record<number, SelectionValue>;
	onSelect: (level_num: number, value: SelectionValue) => void;
};

type DropdownOption = { value: number | 'ALL'; label: string };

export function ScopeDropdowns({ scope, selections, onSelect }: Props) {
	const { locale: lang } = useI18n();

	const firstLevelNum = scope.levels[0]?.level_num ?? 0;
	const allLabel = lang === 'en' ? 'All' : 'Todos';

	const renderedLevels = useMemo(() => {
		return scope.levels.map((level) => {
			const opts = optionsForLevel(scope, level.level_num, selections);
			const parentMissing =
				level.level_num > firstLevelNum && (selections[level.level_num - 1] ?? null) === null;

			const dropdownOptions: DropdownOption[] = [
				{ value: 'ALL', label: allLabel },
				...opts.map((o) => ({
					value: o.id,
					label: o.label[lang] ?? o.label.es ?? '',
				})),
			];

			const current = selections[level.level_num] ?? null;
			const selectedOpt =
				current === null ? null : (dropdownOptions.find((o) => o.value === current) ?? null);

			return {
				level,
				dropdownOptions,
				selectedOpt,
				disabled: parentMissing,
				empty: opts.length === 0 && !parentMissing,
			};
		});
	}, [scope, selections, firstLevelNum, lang, allLabel]);

	return (
		<div className="flex flex-wrap gap-3">
			{renderedLevels.map(({ level, dropdownOptions, selectedOpt, disabled, empty }) => {
				if (empty) return null;
				return (
					<div key={level.level_num} className="min-w-[200px]">
						<Select
							label={LEVEL_LABELS[level.type_code]?.[lang] ?? level.type_code}
							isDisabled={disabled}
							value={selectedOpt}
							onChange={(_, opt) => {
								const next = (opt as { value?: number | 'ALL' } | null)?.value ?? null;
								onSelect(level.level_num, next);
							}}
							options={dropdownOptions}
						/>
					</div>
				);
			})}
		</div>
	);
}
