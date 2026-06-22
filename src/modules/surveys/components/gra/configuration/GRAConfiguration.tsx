'use client';

import React, { useEffect } from 'react';
import { useABET } from '@/providers';
import { useGRACompetences } from '../../../hooks';
import { CompetenceCRUD } from '../../shared/CompetenceCRUD';

interface GRAConfigurationProps {
	programId?: number;
}

export function GRAConfiguration({ programId }: GRAConfigurationProps) {
	const { academicPeriodId } = useABET();
	const {
		competences,
		loading: compLoading,
		error: compError,
		load: loadComp,
		save: saveComp,
		remove: removeComp,
	} = useGRACompetences();

	useEffect(() => {
		if (!academicPeriodId) return;
		loadComp(academicPeriodId, programId);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- loadComp is an unstable service binding; refetch only when period/program changes
	}, [academicPeriodId, programId]);

	if (!academicPeriodId) {
		return null;
	}

	return (
		<div className="space-y-8">
			{/* Specific competences */}
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

			{/* General competences */}
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
		</div>
	);
}
