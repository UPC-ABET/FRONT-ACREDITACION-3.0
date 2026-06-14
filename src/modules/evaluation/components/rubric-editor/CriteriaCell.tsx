'use client';

import { useEffect, useRef } from 'react';

interface CriteriaCellProps {
	criteriaText: string;
	minValue: number | '';
	maxValue: number | '';
	canEdit: boolean;
	criteriaPlaceholder: string;
	minScoreLabel: string;
	maxScoreLabel: string;
	onTextChange: (text: string) => void;
	onMinChange: (v: number | '') => void;
	onMaxChange: (v: number | '') => void;
}

function parseNumericInput(val: string): number | '' {
	if (val.trim() === '') return '';
	const n = Number(val);
	return Number.isNaN(n) ? '' : n;
}

export function CriteriaCell({
	criteriaText,
	minValue,
	maxValue,
	canEdit,
	criteriaPlaceholder,
	minScoreLabel,
	maxScoreLabel,
	onTextChange,
	onMinChange,
	onMaxChange,
}: CriteriaCellProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	}, [criteriaText]);

	const rangeInvalid =
		minValue !== '' &&
		maxValue !== '' &&
		typeof minValue === 'number' &&
		typeof maxValue === 'number' &&
		minValue > maxValue;

	return (
		<div className="space-y-2 p-3">
			<textarea
				ref={textareaRef}
				value={criteriaText}
				disabled={!canEdit}
				placeholder={criteriaPlaceholder}
				rows={2}
				className="w-full resize-none overflow-hidden rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-50 disabled:text-zinc-500"
				onChange={(e) => onTextChange(e.target.value)}
			/>

			<div className="flex gap-2">
				<div className="flex flex-1 flex-col gap-0.5">
					<span className="text-xs font-medium text-zinc-500">{minScoreLabel}</span>
					<input
						type="number"
						step="1"
						min="0"
						disabled={!canEdit}
						placeholder={'0'}
						value={minValue === '' ? '' : String(minValue)}
						className="h-7 w-full rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-50 disabled:text-zinc-500"
						onChange={(e) => onMinChange(parseNumericInput(e.target.value))}
					/>
				</div>
				<div className="flex flex-1 flex-col gap-0.5">
					<span className="text-xs font-medium text-zinc-500">{maxScoreLabel}</span>
					<input
						type="number"
						step="1"
						min="0"
						placeholder={'0'}
						disabled={!canEdit}
						value={maxValue === '' ? '' : String(maxValue)}
						className={`h-7 w-full rounded border px-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 disabled:bg-zinc-50 disabled:text-zinc-500 ${
							rangeInvalid
								? 'border-red-400 bg-white focus:border-red-500 focus:ring-red-500'
								: 'border-zinc-200 bg-white focus:border-blue-500 focus:ring-blue-500'
						}`}
						onChange={(e) => onMaxChange(parseNumericInput(e.target.value))}
					/>
				</div>
			</div>
		</div>
	);
}
