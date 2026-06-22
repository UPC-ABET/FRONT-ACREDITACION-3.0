'use client';

import React, { useEffect, useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Button, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { usePPPCompetences } from '../../../hooks';
import { CompetenceCRUD } from '../../shared/CompetenceCRUD';

interface PPPConfigurationProps {
	readonly programId: number;
}

export function PPPConfiguration({ programId }: PPPConfigurationProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const {
		competences,
		loading: compLoading,
		error: compError,
		load: loadComp,
		save: saveComp,
		remove: removeComp,
		generate: generateComp,
	} = usePPPCompetences();

	const [toast, setToast] = useState<{
		open: boolean;
		type: 'success' | 'error' | 'info';
		msg: string;
	}>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		if (!academicPeriodId) return;
		loadComp(academicPeriodId, programId);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- loadComp is an unstable service binding; refetch only when period/program changes
	}, [academicPeriodId, programId]);

	function handleGenerate() {
		if (!academicPeriodId) return;
		if (!programId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectProgram') });
			return;
		}
		generateComp(programId, academicPeriodId, (result) => {
			loadComp(academicPeriodId, programId);
			if (result.total === 0) {
				setToast({ open: true, type: 'error', msg: t('surveys.shared.noOutcomesForProgram') });
			} else {
				setToast({
					open: true,
					type: 'success',
					msg: t('surveys.shared.configGenerated')
						.replace('{{created}}', String(result.created))
						.replace('{{total}}', String(result.total)),
				});
			}
		});
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
				<p className="text-xs text-zinc-600">{t('surveys.shared.generateConfigHint')}</p>
				<Button size="sm" onClick={handleGenerate} disabled={compLoading || !programId}>
					<SparklesIcon className="h-4 w-4 mr-1" />
					{t('surveys.shared.generateConfig')}
				</Button>
			</div>

			<div className="space-y-8">
				{/* Specific competences */}
				<CompetenceCRUD
					cycleId={academicPeriodId}
					programId={programId}
					competenceType="specific"
					showExternalToggle
					competences={competences}
					loading={compLoading}
					error={compError}
					onLoad={loadComp}
					onSave={saveComp}
					onDelete={removeComp}
				/>

				{/* General competences */}
				<CompetenceCRUD
					cycleId={academicPeriodId}
					programId={programId}
					competenceType="general"
					showExternalToggle
					competences={competences}
					loading={compLoading}
					error={compError}
					onLoad={loadComp}
					onSave={saveComp}
					onDelete={removeComp}
				/>
			</div>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
