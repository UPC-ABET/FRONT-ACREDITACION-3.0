'use client';

import { Badge } from '@/shared/components';
import { TYPE_CODES } from '../constants';

type BadgeVariant = 'default' | 'danger' | 'success' | 'outline';

const FALLBACK_VARIANT: Record<string, BadgeVariant> = {
	[TYPE_CODES.IFC_STATUS.UNREGISTERED]: 'outline',
	[TYPE_CODES.IFC_STATUS.SAVED]: 'default',
	[TYPE_CODES.IFC_STATUS.SUBMITTED]: 'default',
	[TYPE_CODES.IFC_STATUS.OBSERVED]: 'danger',
	[TYPE_CODES.IFC_STATUS.APPROVED]: 'success',
};

type Props = { status: string; label: string; color?: string };

export function StatusBadge({ status, label, color }: Props) {
	if (color) {
		return <Badge color={color}>{label}</Badge>;
	}
	return <Badge variant={FALLBACK_VARIANT[status] ?? 'default'}>{label}</Badge>;
}
