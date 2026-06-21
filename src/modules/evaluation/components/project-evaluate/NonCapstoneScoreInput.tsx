'use client';

import { JSX } from 'react';
import { cn } from '@/shared/lib/utils';

interface ScoreInputProps {
	value: string;
	min: number;
	max: number;
	error: string | undefined;
	onChange: (val: string) => void;
	disabled?: boolean;
}

export function NonCapstoneScoreInput({
	value,
	min,
	max,
	error,
	onChange,
	disabled,
}: ScoreInputProps): JSX.Element {
	return (
		<input
			type="number"
			inputMode="decimal"
			min={min}
			max={max}
			step="any"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder="—"
			disabled={disabled}
			className={cn(
				'w-16 rounded-md border px-2 py-1.5 text-center text-sm tabular-nums outline-none transition-all',
				'bg-white text-zinc-900 placeholder:text-zinc-300',
				disabled && 'cursor-not-allowed opacity-50 bg-zinc-50',
				error
					? 'border-red-400 ring-1 ring-red-400/30 focus:border-red-500'
					: 'border-zinc-200 focus:border-red-600 focus:ring-1 focus:ring-red-600/20',
			)}
		/>
	);
}
