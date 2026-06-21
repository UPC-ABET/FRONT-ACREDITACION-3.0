'use client';

import { useI18n } from '@/providers';
import type { CapstoneRubricCriterion } from '../../types/capstone';

interface RubricCriterionSliderProps {
	criterion: CapstoneRubricCriterion;
	value: number;
	onChange: (value: number) => void;
}

export default function RubricCriterionSlider({
	criterion,
	value,
	onChange,
}: RubricCriterionSliderProps) {
	const { t } = useI18n();
	const maxScore = criterion.maxScore;
	const currentLevel = criterion.levels.find((lv) => value >= lv.minScore && value <= lv.maxScore);

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
			<div className="mb-2 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm font-semibold text-gray-900">{criterion.code}</p>
					<p className="mt-0.5 text-xs text-gray-500">{criterion.description}</p>
					<p className="mt-0.5 text-xs text-gray-400">
						{t('capstone.slider.outcome')}: {criterion.outcomeCode}
					</p>
				</div>
				<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
					{value} / {maxScore}
				</span>
			</div>

			<input
				type="range"
				min={0}
				max={maxScore}
				step={1}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-red-500"
				aria-label={criterion.code}
			/>

			<div className="mt-2 flex flex-wrap gap-1">
				{criterion.levels.map((lv) => {
					const active = currentLevel?.id === lv.id;
					return (
						<span
							key={lv.id}
							className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
								active ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
							}`}>
							{lv.name} ({lv.minScore}–{lv.maxScore})
						</span>
					);
				})}
			</div>
		</div>
	);
}
