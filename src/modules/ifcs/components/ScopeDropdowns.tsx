'use client';

import { Fragment, useMemo } from 'react';
import { Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { LEVEL_LABELS } from '../constants';
import { optionsForLevel } from '../services/scope';
import type { ScopeTree, SelectionValue } from '../types';

type Props = {
	scope: ScopeTree;
	selections: Record<number, SelectionValue>;
	onSelect: (levelNum: number, value: SelectionValue) => void;
};

type DropdownOption = { value: number | 'ALL'; label: string };

export function ScopeDropdowns({ scope, selections, onSelect }: Props) {
	const { locale: lang } = useI18n();

	const allLabel = lang === 'en' ? 'All' : 'Todos';

	const renderedLevels = useMemo(() => {
		return scope.levels.map((level, index) => {
			const opts = optionsForLevel(scope, level.levelNum, selections);
			const parentLevelNum = index > 0 ? scope.levels[index - 1].levelNum : null;
			const parentMissing =
				parentLevelNum !== null && (selections[parentLevelNum] ?? null) === null;

			const dropdownOptions: DropdownOption[] = [
				{ value: 'ALL', label: allLabel },
				...opts.map((o) => ({
					value: o.id,
					label: o.label[lang] ?? o.label.es ?? '',
				})),
			];

			const current = selections[level.levelNum] ?? null;
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
	}, [scope, selections, lang, allLabel]);

	return (
		<>
			{renderedLevels.map(({ level, dropdownOptions, selectedOpt, disabled, empty }) => {
				if (empty) return null;
				return (
					<Fragment key={level.levelNum}>
						<Select
							label={LEVEL_LABELS[level.typeCode]?.[lang] ?? level.typeCode}
							isDisabled={disabled}
							value={selectedOpt}
							onChange={(_, opt) => {
								const next = (opt as { value?: number | 'ALL' } | null)?.value ?? null;
								onSelect(level.levelNum, next);
							}}
							options={dropdownOptions}
						/>
					</Fragment>
				);
			})}
		</>
	);
}
