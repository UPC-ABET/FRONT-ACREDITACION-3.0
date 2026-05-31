'use client';

import { useMemo, useState } from 'react';
import { Card, Button, LoadingDialog, ErrorDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { useAssociateStudyPlan, useStudyPlanPeriods, useUnassociateStudyPlan } from '../hooks';

interface StudyPlanOption {
	id: number;
	code: string;
	label: string;
}

interface StudyPlanAssociationPanelProps {
	periodId: number | null;
	availableStudyPlans: StudyPlanOption[];
}

export default function StudyPlanAssociationPanel({
	periodId,
	availableStudyPlans,
}: StudyPlanAssociationPanelProps) {
	const { t } = useI18n();
	const { data: associated, isLoading } = useStudyPlanPeriods(periodId);
	const associate = useAssociateStudyPlan(periodId);
	const unassociate = useUnassociateStudyPlan(periodId);
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const associatedIds = useMemo(
		() => new Set((associated ?? []).map((sp) => sp.study_plan_id)),
		[associated],
	);
	const unassociated = useMemo(
		() => availableStudyPlans.filter((sp) => !associatedIds.has(sp.id)),
		[availableStudyPlans, associatedIds],
	);

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>, studyPlanId: number) => {
		e.dataTransfer.setData('text/study-plan-id', String(studyPlanId));
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		setIsDraggingOver(true);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDraggingOver(false);
		if (!periodId) return;
		const raw = e.dataTransfer.getData('text/study-plan-id');
		const studyPlanId = Number(raw);
		if (!Number.isInteger(studyPlanId) || studyPlanId <= 0) return;

		associate.mutate(
			{ periodId, studyPlanId },
			{
				onError: (err) => setErrorMessage(err.message || t('loadsSetup.studyPlan.error.associate')),
			},
		);
	};

	const handleUnassociate = (studyPlanId: number) => {
		if (!periodId) return;
		unassociate.mutate(
			{ periodId, studyPlanId },
			{
				onError: (err) =>
					setErrorMessage(err.message || t('loadsSetup.studyPlan.error.unassociate')),
			},
		);
	};

	if (!periodId) {
		return (
			<Card
				title={t('loadsSetup.studyPlan.title')}
				description={t('loadsSetup.studyPlan.description')}>
				<p className="py-4 text-center text-sm text-gray-500">
					{t('loadsSetup.studyPlan.pickPeriodFirst')}
				</p>
			</Card>
		);
	}

	return (
		<Card
			title={t('loadsSetup.studyPlan.title')}
			description={t('loadsSetup.studyPlan.description')}>
			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<h4 className="mb-2 text-sm font-semibold text-gray-700">
						{t('loadsSetup.studyPlan.unassociatedTitle')} ({unassociated.length})
					</h4>
					<div className="space-y-2">
						{unassociated.length === 0 && (
							<p className="text-xs text-gray-400">{t('loadsSetup.studyPlan.noUnassociated')}</p>
						)}
						{unassociated.map((sp) => (
							<div
								key={sp.id}
								draggable
								onDragStart={(e) => handleDragStart(e, sp.id)}
								className="cursor-move rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:border-red-300">
								<span className="font-medium text-gray-700">{sp.code}</span>
								<span className="ml-2 text-xs text-gray-500">{sp.label}</span>
							</div>
						))}
					</div>
				</div>

				<div>
					<h4 className="mb-2 text-sm font-semibold text-gray-700">
						{t('loadsSetup.studyPlan.associatedTitle')} ({(associated ?? []).length})
					</h4>
					<div
						onDragOver={handleDragOver}
						onDragLeave={() => setIsDraggingOver(false)}
						onDrop={handleDrop}
						className={`min-h-[160px] rounded-lg border-2 border-dashed p-3 transition-colors ${
							isDraggingOver ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'
						}`}>
						{isLoading && (
							<p className="text-xs text-gray-400">{t('loadsSetup.studyPlan.loading')}</p>
						)}
						{!isLoading && (associated ?? []).length === 0 && (
							<p className="py-6 text-center text-xs text-gray-400">
								{t('loadsSetup.studyPlan.dropHint')}
							</p>
						)}
						<div className="space-y-2">
							{(associated ?? []).map((sp) => (
								<div
									key={sp.study_plan_academic_period_id}
									className="flex items-center justify-between rounded-md border border-green-200 bg-white px-3 py-2 text-sm shadow-sm">
									<div>
										<span className="font-medium text-gray-800">{sp.study_plan_code}</span>
										<span className="ml-2 text-xs text-green-700">
											✓ {sp.courses_count} {t('loadsSetup.studyPlan.coursesSuffix')}
										</span>
									</div>
									<Button
										variant="secondary"
										onClick={() => handleUnassociate(sp.study_plan_id)}
										disabled={unassociate.isPending}>
										× {t('loadsSetup.studyPlan.rollback')}
									</Button>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<LoadingDialog isOpen={associate.isPending || unassociate.isPending} />
			<ErrorDialog
				isOpen={errorMessage !== null}
				onClose={() => setErrorMessage(null)}
				title={t('loadsSetup.studyPlan.errorTitle')}
				message={errorMessage ?? ''}
			/>
		</Card>
	);
}
