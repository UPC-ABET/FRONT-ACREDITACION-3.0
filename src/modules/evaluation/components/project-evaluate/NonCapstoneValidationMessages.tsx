'use client';

import { JSX } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/shared/lib/utils';

export function NonCapstoneValidationMessages({
	items,
}: {
	items: { message: string; type: 'error' | 'warning' }[];
}): JSX.Element | null {
	if (!items.length) return null;
	return (
		<ul className="space-y-1 text-sm">
			{items.map((item, i) => (
				<li
					key={i}
					className={cn(
						'flex items-center gap-2 rounded-lg px-3 py-2',
						item.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800',
					)}>
					<ExclamationTriangleIcon
						className={cn(
							'h-4 w-4 shrink-0',
							item.type === 'error' ? 'text-red-500' : 'text-amber-500',
						)}
					/>
					{item.message}
				</li>
			))}
		</ul>
	);
}
