'use client';

import { cn } from '@/shared/lib/utils';

interface LastColumnSumIndicatorProps {
	sum: number;
	target: number;
	label: string;
}

export function LastColumnSumIndicator({ sum, target, label }: LastColumnSumIndicatorProps) {
	const valid = Math.abs(sum - target) < 0.0001;

	return (
		<p
			className={cn('text-sm font-medium', valid ? 'text-emerald-600' : 'text-red-600')}
			role="status">
			{label.replace('{{sum}}', sum.toFixed(1)).replace('{{target}}', String(target))}
		</p>
	);
}
