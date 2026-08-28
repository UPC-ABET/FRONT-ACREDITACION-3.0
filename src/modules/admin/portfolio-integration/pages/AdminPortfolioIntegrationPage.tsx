'use client';

import { PageHeader } from '@/shared';
import { useGlobalAcademicFiltersVisibilityOverride, useI18n } from '@/providers';
import { PortfolioIntegrationForm } from '../components/PortfolioIntegrationForm';

export default function AdminPortfolioIntegrationPage() {
	const { t } = useI18n();

	useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: false, period: false });

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('admin.portfolioIntegration.page.title')}
				description={t('admin.portfolioIntegration.page.subtitle')}
			/>

			<PortfolioIntegrationForm />
		</div>
	);
}
