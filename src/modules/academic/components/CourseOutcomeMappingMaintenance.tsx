'use client';

import { useState } from 'react';
import { CourseOutcomeMappingGrid } from './CourseOutcomeMappingGrid';
import { CourseOutcomeMappingList } from './CourseOutcomeMappingList';

export function CourseOutcomeMappingMaintenance() {
	const [selectedProgramCommissionId, setSelectedProgramCommissionId] = useState<number | null>(
		null,
	);

	if (selectedProgramCommissionId != null) {
		return (
			<CourseOutcomeMappingGrid
				programCommissionId={selectedProgramCommissionId}
				onBack={() => setSelectedProgramCommissionId(null)}
			/>
		);
	}

	return <CourseOutcomeMappingList onView={setSelectedProgramCommissionId} />;
}
