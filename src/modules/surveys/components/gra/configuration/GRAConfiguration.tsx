'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { useGRACompetences, usePPPPerformanceLevels } from '../../../hooks';
import { CompetenceCRUD } from '../../shared/CompetenceCRUD';
import { PerformanceLevels } from '../../ppp/configuration/PerformanceLevels';

interface GRAConfigurationProps {
	programId?: number;
}

export function GRAConfiguration({ programId }: GRAConfigurationProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const {
		competences,
		loading: compLoading,
		error: compError,
		load: loadComp,
		save: saveComp,
		remove: removeComp,
	} = useGRACompetences();
	const levelsHook = usePPPPerformanceLevels();

	const [activeTab, setActiveTab] = useState('competences');
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
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

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2 space-y-8">
				{activeTab === 'competences' && (
					<>
						{/* Competencias Específicas */}
						<CompetenceCRUD
							cycleId={academicPeriodId}
							programId={programId}
							competenceType="specific"
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
