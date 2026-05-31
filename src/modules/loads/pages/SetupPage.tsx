'use client';

import { useState } from 'react';
import { useI18n } from '@/providers';
import {
	NewPeriodDialog,
	PeriodSelector,
	ProgramCommissionPanel,
	StudyPlanAssociationPanel,
} from '../components';

interface ProgramOption {
	id: number;
	code: string;
	label: string;
}
interface CommissionOption {
	id: number;
	code: string;
	label: string;
}
interface StudyPlanOption {
	id: number;
	code: string;
	label: string;
}

interface SetupPageProps {
	// Catalog props are injected so this page stays decoupled from the academic/accreditation
	// modules. The container that mounts this page resolves them via the proper hooks.
	availableStudyPlans: StudyPlanOption[];
	programs: ProgramOption[];
	commissions: CommissionOption[];
}

export default function SetupPage({ availableStudyPlans, programs, commissions }: SetupPageProps) {
	const { t } = useI18n();
	const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
	const [newPeriodOpen, setNewPeriodOpen] = useState(false);

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl font-semibold text-gray-900">{t('loadsSetup.canvas.title')}</h1>
				<p className="mt-1 text-sm text-gray-500">{t('loadsSetup.canvas.subtitle')}</p>
			</header>

			<section>
				<PeriodSelector
					selectedPeriodId={selectedPeriodId}
					onChange={setSelectedPeriodId}
					onCreate={() => setNewPeriodOpen(true)}
				/>
			</section>

			<section>
				<StudyPlanAssociationPanel
					periodId={selectedPeriodId}
					availableStudyPlans={availableStudyPlans}
				/>
			</section>

			<section>
				<ProgramCommissionPanel
					periodId={selectedPeriodId}
					programs={programs}
					commissions={commissions}
				/>
			</section>

			<NewPeriodDialog
				open={newPeriodOpen}
				onClose={() => setNewPeriodOpen(false)}
				onCreated={(periodId) => setSelectedPeriodId(periodId)}
			/>
		</div>
	);
}
