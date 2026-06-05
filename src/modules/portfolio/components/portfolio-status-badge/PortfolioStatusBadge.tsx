'use client';

import { Badge } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { PORTFOLIO_STATUS, type PortfolioStatus } from '../../types';

const STATUS_COLOR: Record<PortfolioStatus, string> = {
	[PORTFOLIO_STATUS.APPROVED]: '#22c55e',
	[PORTFOLIO_STATUS.PRE_APPROVED]: '#86efac',
	[PORTFOLIO_STATUS.REVIEWED]: '#3b82f6',
	[PORTFOLIO_STATUS.PENDING]: '#f59e0b',
	[PORTFOLIO_STATUS.DISAPPROVED]: '#ef4444',
};

type Props = { status: PortfolioStatus };

export function PortfolioStatusBadge({ status }: Props) {
	const { t } = useI18n();
	const labelMap: Record<PortfolioStatus, string> = {
		[PORTFOLIO_STATUS.APPROVED]: t('portfolio.status.approved'),
		[PORTFOLIO_STATUS.PRE_APPROVED]: t('portfolio.status.preApproved'),
		[PORTFOLIO_STATUS.REVIEWED]: t('portfolio.status.reviewed'),
		[PORTFOLIO_STATUS.PENDING]: t('portfolio.status.pending'),
		[PORTFOLIO_STATUS.DISAPPROVED]: t('portfolio.status.disapproved'),
	};
	return <Badge color={STATUS_COLOR[status]}>{labelMap[status] ?? String(status)}</Badge>;
}
