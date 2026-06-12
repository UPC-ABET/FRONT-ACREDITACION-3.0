'use client';

import { useState } from 'react';
import { StudyPlanCoursesView } from './StudyPlanCoursesView';
import { StudyPlanMasterList } from './StudyPlanMasterList';

export function StudyPlansMaintenance() {
	const [viewingPlanId, setViewingPlanId] = useState<number | null>(null);

	if (viewingPlanId != null) {
		return (
			<StudyPlanCoursesView studyPlanId={viewingPlanId} onBack={() => setViewingPlanId(null)} />
		);
	}

	return <StudyPlanMasterList onView={setViewingPlanId} />;
}
