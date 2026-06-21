'use client';

import { cn } from '@/shared/lib/utils';

export type PerformanceLevel = {
	id: number;
	name: { en: string; es: string };
	uniqueValue: number;
};

interface PLButtonProps {
	value: number;
	label: string;
	selected: boolean;
	onClick: () => void;
	disabled?: boolean;
}

function PLButton({ label, selected, onClick, disabled }: PLButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'rounded-md border px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap',
				selected
					? 'border-red-600 bg-red-600 text-white'
					: 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50',
				disabled && 'cursor-not-allowed opacity-50',
			)}>
			{label}
		</button>
	);
}

interface PLSelectorProps {
	levels: PerformanceLevel[];
	selected: number | null;
	locale: string;
	onChange: (value: number) => void;
	disabled?: boolean;
}

export function PLSelector({ levels, selected, locale, onChange, disabled }: PLSelectorProps) {
	return (
		<>
			<div className="hidden flex-wrap gap-1.5 md:flex">
				{levels.map((pl) => {
					const label = `${pl.uniqueValue} - ${pl.name[locale as 'es' | 'en'] ?? pl.name.es}`;
					return (
						<PLButton
							key={pl.id}
							value={pl.uniqueValue}
							label={label}
							selected={selected === pl.uniqueValue}
							onClick={() => onChange(pl.uniqueValue)}
							disabled={disabled}
						/>
					);
				})}
			</div>

			<select
				value={selected ?? ''}
				onChange={(e) => {
					if (e.target.value !== '') onChange(Number(e.target.value));
				}}
				disabled={disabled}
				className={cn(
					'w-full rounded-md border px-2 py-1.5 text-xs outline-none md:hidden',
					disabled
						? 'cursor-not-allowed opacity-50 bg-zinc-50 text-zinc-500'
						: 'border-zinc-200 bg-white text-zinc-700 focus:border-red-600',
				)}>
				<option value="">—</option>
				{levels.map((pl) => {
					const label = `${pl.uniqueValue} - ${pl.name[locale as 'es' | 'en'] ?? pl.name.es}`;
					return (
						<option key={pl.id} value={pl.uniqueValue}>
							{label}
						</option>
					);
				})}
			</select>
		</>
	);
}
