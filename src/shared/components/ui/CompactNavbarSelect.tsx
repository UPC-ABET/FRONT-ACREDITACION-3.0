'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/shared/lib/utils';

type CompactNavbarSelectOption = {
	value: string;
	label: string;
};

type CompactNavbarSelectProps = {
	label: string;
	value: string;
	options: CompactNavbarSelectOption[];
	placeholder?: string;
	disabled?: boolean;
	onChange: (value: string) => void;
};

export function CompactNavbarSelect({
	label,
	value,
	options,
	placeholder,
	disabled = false,
	onChange,
}: CompactNavbarSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const selectedOption = options.find((option) => option.value === value) ?? null;
	const displayValue = selectedOption?.label ?? placeholder ?? '';

	useEffect(() => {
		if (!isOpen) return;

		function handleClickOutside(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen]);

	return (
		<div ref={containerRef} className="relative w-full min-w-0">
			<button
				type="button"
				disabled={disabled}
				onClick={() => setIsOpen((current) => !current)}
				className={cn(
					'flex h-10 w-full min-w-0 items-center rounded-md border bg-white px-3 text-left shadow-sm transition-colors',
					'border-zinc-200 hover:border-zinc-300 focus-visible:border-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-100',
					disabled && 'cursor-not-allowed bg-zinc-50 text-zinc-400',
				)}>
				<span className="mr-1.5 flex-none whitespace-nowrap text-[13px] font-semibold text-zinc-700">
					{label}:
				</span>
				<span
					className={cn(
						'min-w-0 flex-1 truncate text-[13px] font-bold text-zinc-950',
						!selectedOption && 'font-medium text-zinc-400',
					)}>
					{displayValue}
				</span>
				<span className="ml-3 h-5 w-px flex-none bg-zinc-200" />
				<ChevronDownIcon
					className={cn(
						'ml-2 h-4 w-4 flex-none text-zinc-400 transition-transform',
						isOpen && 'rotate-180 text-zinc-600',
					)}
				/>
			</button>

			{isOpen && (
				<div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-64 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
					{options.map((option) => {
						const isSelected = option.value === value;
						return (
							<button
								key={option.value}
								type="button"
								onClick={() => {
									onChange(option.value);
									setIsOpen(false);
								}}
								className={cn(
									'w-full truncate px-3 py-2 text-left text-[13px] transition-colors hover:bg-red-100 hover:text-zinc-900',
									isSelected
										? 'bg-red-600 font-semibold text-white hover:bg-red-600 hover:text-white'
										: 'text-zinc-800',
								)}>
								{option.label}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
