'use client';

import { Badge } from '@/shared/components';
import { useI18n } from '@/providers';
import { SEMAPHORE_COLOR_STYLES } from '../../constants/semaphore';
import type { SemaphoreColor } from '../../types';

interface SemaphoreColorBadgeProps {
	readonly color: SemaphoreColor;
}

export function SemaphoreColorBadge({ color }: SemaphoreColorBadgeProps) {
	const { t } = useI18n();
	return (
		<Badge color={SEMAPHORE_COLOR_STYLES[color].dotHex}>
			{t(`semaphoreReports.color.${color}`)}
		</Badge>
	);
}
