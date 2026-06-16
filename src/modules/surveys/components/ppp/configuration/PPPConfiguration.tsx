'use client';

import React, { useEffect, useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Button, Tabs, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { usePPPCompetences, usePPPPerformanceLevels } from '../../../hooks';
import { CompetenceCRUD } from '../../shared/CompetenceCRUD';
import { PerformanceLevels } from './PerformanceLevels';

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
	const levelsHook = usePPPPerformanceLevels();

	const [activeTab, setActiveTab] = useState('competences');
	const [toast, setToast] = useState<{
		open: boolean;
		type: 'success' | 'error' | 'info';
		msg: string;
	}>({
		open: false,
		type: 'success',
		msg: '',
	});

	const tabs = [
		{ id: 'competences', label: t('surveys.tabs.competences') },
		{ id: 'levels', label: t('surveys.tabs.levels') },
	];

	useEffect(() => {
		if (!academicPeriodId) return;
		loadComp(academicPeriodId, programId);
		levelsHook.load(academicPeriodId);
	}, [academicPeriodId, programId]); // eslint-disable-line react-hooks/exhaustive-deps

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

			<Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2 space-y-8">
				{activeTab === 'competences' && (
					<>
						{/* Competencias Específicas */}
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

						{/* Competencias Generales */}
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
					</>
				)}

				{activeTab === 'levels' && (
					<PerformanceLevels
						cycleId={academicPeriodId}
						levels={levelsHook.levels}
						setLevels={levelsHook.setLevels}
						loading={levelsHook.loading}
						error={levelsHook.error}
						onLoad={levelsHook.load}
						onSave={levelsHook.save}
					/>
				)}
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
