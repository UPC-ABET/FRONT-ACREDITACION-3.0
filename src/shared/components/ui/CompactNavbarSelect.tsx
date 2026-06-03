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
	labelPlacement?: 'inline' | 'stacked';
	density?: 'normal' | 'compact';
	noOptionsMessage: string;
	onChange: (value: string) => void;
};

export function CompactNavbarSelect({
	label,
	value,
	options,
	placeholder,
	disabled = false,
	labelPlacement = 'inline',
	density = 'normal',
	noOptionsMessage,
	onChange,
}: CompactNavbarSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const selectedOption = options.find((option) => option.value === value) ?? null;
	const displayValue = selectedOption?.label ?? placeholder ?? '';
	const isCompact = density === 'compact';

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
			{labelPlacement === 'stacked' && (
				<div className="mb-2 truncate text-[14px] font-semibold leading-none text-zinc-700">
					{label}
				</div>
			)}
			<button
				type="button"
				disabled={disabled}
				onClick={() => setIsOpen((current) => !current)}
				className={cn(
					'flex w-full min-w-0 items-center rounded-md border bg-white text-left shadow-sm transition-colors',
					isCompact ? 'h-8 px-2' : 'h-10 px-3 max-xl:h-8 max-xl:px-2',
					'border-zinc-200 hover:border-zinc-300 focus-visible:border-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-100',
					disabled && 'cursor-not-allowed bg-zinc-50 text-zinc-400',
				)}>
				{labelPlacement === 'inline' && (
					<span
						className={cn(
							'mr-1.5 flex-none whitespace-nowrap font-semibold text-zinc-700 max-lg:hidden',
							isCompact ? 'text-[10px]' : 'text-[13px] max-xl:text-[10px]',
						)}>
						{label}:
					</span>
				)}
				<span
					className={cn(
						'min-w-0 flex-1 truncate font-bold text-zinc-950',
						isCompact ? 'text-[10px]' : 'text-[13px] max-xl:text-[10px]',
						!selectedOption && 'font-medium text-zinc-400',
					)}>
					{labelPlacement === 'inline' ? (
						<>
							<span className="max-lg:hidden">{displayValue}</span>
							<span className="hidden max-lg:inline font-bold text-zinc-950">
								{selectedOption?.label ?? label}
							</span>
						</>
					) : (
						displayValue
					)}
				</span>
				<span className={cn('w-px flex-none bg-zinc-200', isCompact ? 'ml-2 h-4' : 'ml-3 h-5 max-xl:ml-2 max-xl:h-4')} />
				<ChevronDownIcon
					className={cn(
						'ml-2 flex-none text-zinc-400 transition-transform',
						isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4 max-xl:h-3.5 max-xl:w-3.5',
						isOpen && 'rotate-180 text-zinc-600',
					)}
				/>
			</button>

			{isOpen && (
				<div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-64 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
					{options.length === 0 ? (
						<div className="px-3 py-3 text-center text-[13px] font-medium text-zinc-400">
							{noOptionsMessage}
						</div>
					) : options.map((option) => {
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
