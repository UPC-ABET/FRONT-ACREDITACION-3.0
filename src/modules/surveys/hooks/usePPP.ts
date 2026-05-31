'use client';

import { useState, useCallback } from 'react';
import type {
	AcademicPeriod,
	CompetenceConfig,
	PerformanceLevel,
	CompetenceFormData,
	DashboardResponse,
} from '../types';
import {
	getAcademicPeriods,
	listPPPCompetences,
	savePPPCompetence,
	deletePPPCompetence,
	clonePPPConfiguration,
	listPPPPerformanceLevels,
	updatePPPPerformanceLevels,
	downloadPPPTemplate,
	uploadPPPMassive,
	generatePPPPerceptionReport,
} from '../services';

// Backward-compat alias: components that import usePPPCycles still work.
export function usePPPCycles() {
	const { periods, loading, error, load: _load } = usePPPPeriods();
	const load = useCallback(
		(_modalityId?: unknown) => {
			_load();
		},
		[_load],
	);
	return { cycles: periods, loading, error, load };
}

export function usePPPPeriods() {
	const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setPeriods(await getAcademicPeriods());
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	return { periods, loading, error, load };
}

export function usePPPCompetences() {
	const [competences, setCompetences] = useState<CompetenceConfig[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (periodId: number, programId = 0) => {
		setLoading(true);
		setError(null);
		try {
			setCompetences(await listPPPCompetences(periodId, programId));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	const save = useCallback(async (data: CompetenceFormData, onSuccess?: () => void) => {
		try {
			await savePPPCompetence(data);
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	const remove = useCallback(async (id: number, onSuccess?: () => void) => {
		try {
			await deletePPPCompetence(id);
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	const clone = useCallback(
		async (
			params: {
				sourceProgramId: number;
				sourcePeriodId: number;
				targetProgramId: number;
				targetPeriodId: number;
			},
			onSuccess?: () => void,
		) => {
			try {
				await clonePPPConfiguration(params);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			}
		},
		[],
	);

	return { competences, loading, error, load, save, remove, clone, setError };
}

export function usePPPPerformanceLevels() {
	const [levels, setLevels] = useState<PerformanceLevel[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (periodId: number) => {
		setLoading(true);
		setError(null);
		try {
			setLevels(await listPPPPerformanceLevels(periodId));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	const save = useCallback(
		async (periodId: number, levels: PerformanceLevel[], onSuccess?: () => void) => {
			try {
				await updatePPPPerformanceLevels(periodId, levels);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			}
		},
		[],
	);

	return { levels, setLevels, loading, error, load, save };
}

export function usePPPDownload() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const download = useCallback(async (periodId: number) => {
		setLoading(true);
		setError(null);
		try {
			await downloadPPPTemplate(periodId);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	return { loading, error, download };
}

export function usePPPUpload() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const upload = useCallback(
		async (file: File, academicPeriodId: number, programId = 0, campusId = 0) => {
			setLoading(true);
			setError(null);
			setSuccess(false);
			try {
				await uploadPPPMassive(file, academicPeriodId, programId, campusId);
				setSuccess(true);
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return { loading, error, success, upload, reset: () => setSuccess(false) };
}

export function usePPPReports() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reportData, setReportData] = useState<DashboardResponse | null>(null);

	const generate = useCallback(
		async (params: { academicPeriodId?: number; programId?: number; commissionId?: number }) => {
			setLoading(true);
			setError(null);
			try {
				setReportData(await generatePPPPerceptionReport(params));
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return { loading, error, reportData, generate };
}
