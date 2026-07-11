'use client';

import React, { useEffect, useState } from 'react';
import { useABET, useI18n } from '@/providers';
import { useGRACompetences } from '../../../hooks';
import { CompetenceCRUD } from '../../shared/CompetenceCRUD';
import { AllProgramsSelect } from '../../shared/AllProgramsSelect';

export function GRAConfiguration() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const [programId, setProgramId] = useState(0);
	const {
		competences,
		loading: compLoading,
		error: compError,
		load: loadComp,
		save: saveComp,
		remove: removeComp,
	} = useGRACompetences();

	useEffect(() => {
		if (!academicPeriodId || !programId) return;
		loadComp(academicPeriodId, programId);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- loadComp is an unstable service binding; refetch only when period/program changes
	}, [academicPeriodId, programId]);

	if (!academicPeriodId) {
		return null;
	}

	return (
		<div className="space-y-8">
			<AllProgramsSelect value={programId} onChange={setProgramId} wrapperClassName="max-w-xs" />

			{!programId && (
				<p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectProgram')}</p>
			)}

			{programId > 0 && (
				<>
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
				</>
			)}
		</div>
	);
}
