'use client';

import { cn } from '@/shared/lib/utils';
import type { CourseOutcomeMappingOutcomeType } from '../types';

interface CourseOutcomeMappingGlyphProps {
	type: CourseOutcomeMappingOutcomeType;
	label?: string;
	className?: string;
}

export function CourseOutcomeMappingGlyph({
	type,
	label,
	className,
}: CourseOutcomeMappingGlyphProps) {
	return (
		<span
			role="img"
			aria-label={label}
			title={label}
			className={cn('inline-flex items-center justify-center text-lg leading-none', className)}
			style={{ color: type.color }}>
			{type.glyph}
		</span>
	);
}
