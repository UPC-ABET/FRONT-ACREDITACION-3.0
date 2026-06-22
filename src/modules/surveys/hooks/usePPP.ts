'use client';

import { useState, useCallback } from 'react';
import { getErrorMessage } from '@/shared/lib';
import { useI18n } from '@/providers';
import type {
	AcademicPeriod,
	CompetenceConfig,
	CompetenceFormData,
	DashboardResponse,
	MassiveUploadResult,
	PPPNotificationSendRequest,
} from '../types';
import {
	getAcademicPeriods,
	listPPPCompetences,
	savePPPCompetence,
	deletePPPCompetence,
	clonePPPConfiguration,
	generatePPPConfigFromOutcomes,
	downloadPPPTemplate,
	uploadPPPMassive,
	generatePPPPerceptionReport,
	sendPPPNotification,
} from '../services';

// Backward-compat alias: components that import usePPPCycles still work.
export function usePPPCycles() {
	const { periods, loading, error, load: _load } = usePPPPeriods();
	const load = useCallback(() => {
		_load();
	}, [_load]);
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
			setError(getErrorMessage(e));
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
			setError(getErrorMessage(e));
		} finally {
			setLoading(false);
		}
	}, []);

	const save = useCallback(async (data: CompetenceFormData, onSuccess?: () => void) => {
		try {
			await savePPPCompetence(data);
			onSuccess?.();
		} catch (e) {
			setError(getErrorMessage(e));
		}
	}, []);

	const remove = useCallback(async (id: number, onSuccess?: () => void) => {
		try {
			await deletePPPCompetence(id);
			onSuccess?.();
		} catch (e) {
			setError(getErrorMessage(e));
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
				setError(getErrorMessage(e));
			}
		},
		[],
	);

	const generate = useCallback(
		async (
			programId: number,
			academicPeriodId: number,
			onSuccess?: (result: { created: number; skipped: number; total: number }) => void,
		) => {
			setLoading(true);
			setError(null);
			try {
				const result = await generatePPPConfigFromOutcomes(programId, academicPeriodId);
				onSuccess?.(result);
			} catch (e) {
				setError(getErrorMessage(e));
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return { competences, loading, error, load, save, remove, clone, generate, setError };
}

export function usePPPDownload() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const download = useCallback(async (academicPeriodId: number, programId = 0) => {
		setLoading(true);
		setError(null);
		try {
			await downloadPPPTemplate(programId);
		} catch (e) {
			setError(getErrorMessage(e));
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
	const [result, setResult] = useState<MassiveUploadResult | null>(null);

	const upload = useCallback(
		async (file: File, academicPeriodId: number, programId = 0, campusId = 0) => {
			setLoading(true);
			setError(null);
			setSuccess(false);
			setResult(null);
			try {
				const uploadResult = await uploadPPPMassive(file, academicPeriodId, programId, campusId);
				setResult(uploadResult);
				setSuccess(true);
			} catch (e) {
				setError(getErrorMessage(e));
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return {
		loading,
		error,
		success,
		result,
		upload,
		reset: () => {
			setSuccess(false);
			setResult(null);
		},
	};
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
				setError(getErrorMessage(e));
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return { loading, error, reportData, generate };
}

export function usePPPNotification() {
	const { locale } = useI18n();
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const send = useCallback(
		async (request: PPPNotificationSendRequest, onSuccess?: () => void) => {
			setSending(true);
			setError(null);
			try {
				await sendPPPNotification(request, locale);
				onSuccess?.();
			} catch (e) {
				setError(getErrorMessage(e));
			} finally {
				setSending(false);
			}
		},
		[locale],
	);

	return { sending, error, send };
}
