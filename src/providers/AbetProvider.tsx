'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ABETContextType } from '@/shared/types';
import { setActiveAcademicPeriodId, setActiveModalityTypeId } from '@/shared/lib';

const ABETContext = createContext<ABETContextType | null>(null);

export function ABETProvider({ children }: { children: React.ReactNode }) {
	const [modalityTypeId, setModalityTypeIdState] = useState<number | null>(null);
	const [academicPeriodId, setAcademicPeriodIdState] = useState<number | null>(null);
	const [schoolId, setSchoolId] = useState<number | null>(null);

	// Sync the API client synchronously; an effect runs after refetches and lags a value behind.
	const setModalityTypeId = useCallback((id: number | null) => {
		setActiveModalityTypeId(id);
		setModalityTypeIdState(id);
	}, []);

	const setAcademicPeriodId = useCallback((id: number | null) => {
		setActiveAcademicPeriodId(id);
		setAcademicPeriodIdState(id);
	}, []);

	const value = useMemo<ABETContextType>(
		() => ({
			modalityTypeId,
			setModalityTypeId,
			academicPeriodId,
			setAcademicPeriodId,
			schoolId,
			setSchoolId,
		}),
		[modalityTypeId, setModalityTypeId, academicPeriodId, setAcademicPeriodId, schoolId],
	);

	return <ABETContext.Provider value={value}>{children}</ABETContext.Provider>;
}

export function useABET() {
	const ctx = useContext(ABETContext);
	if (!ctx) throw new Error('useABET must be used within ABETProvider');
	return ctx;
}

export default ABETContext;
