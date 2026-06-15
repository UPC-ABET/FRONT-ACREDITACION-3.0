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
		clone: cloneComp,
		generate: generateComp,
	} = usePPPCompetences();
	const levelsHook = usePPPPerformanceLevels();

	const [activeTab, setActiveTab] = useState('competences');
	const [showClone, setShowClone] = useState(false);
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

	useEffect(() => {
		if (academicPeriodId && competences.length === 0 && !compLoading) {
			setShowClone(true);
		} else {
			setShowClone(false);
		}
	}, [competences, compLoading, academicPeriodId]);

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
		return (
			<p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>
		);
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

			{showClone && (
				<div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
					<div className="flex-1">
						<p className="text-sm font-bold text-amber-800">
							{t('surveys.shared.noConfiguration')}
						</p>
						<p className="text-xs text-amber-700 mt-1">{t('surveys.shared.noConfigurationHint')}</p>
					</div>
					<Button
						size="sm"
						variant="warning"
						onClick={() => {
							setToast({
								open: true,
								type: 'info',
								msg: t('surveys.shared.cloneToastHint'),
							});
						}}>
						{t('surveys.shared.cloneConfiguration')}
					</Button>
				</div>
			)}

			<Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'competences' && (
					<CompetenceCRUD
						cycleId={academicPeriodId}
						programId={programId}
						competences={competences}
						loading={compLoading}
						error={compError}
						onLoad={loadComp}
						onSave={saveComp}
						onDelete={removeComp}
						onClone={cloneComp}
						showCloneOption={showClone}
					/>
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
