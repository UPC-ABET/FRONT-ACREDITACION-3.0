'use client';

import { useState, useCallback, useEffect } from 'react';
import { getErrorMessage } from '@/shared/lib';
import { useI18n } from '@/providers';
import type {
	AcademicPeriod,
	CompetenceConfig,
	CompetenceFormData,
	PPPUploadJobStatus,
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
	startPPPUpload,
	getPPPUploadStatus,
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

/** PPP bulk upload: kicks off a background job and polls its status every second so the
 *  UI can show real progress (rows actually validated/saved server-side, never simulated). */
export function usePPPUpload() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [status, setStatus] = useState<PPPUploadJobStatus | null>(null);

	const upload = useCallback(async (file: File, programId = 0, campusId = 0) => {
		setLoading(true);
		setError(null);
		setStatus(null);
		try {
			const started = await startPPPUpload(file, programId, campusId);
			if (!started.jobId) {
				throw new Error('error.survey.ppp.uploadJobNotFound');
			}
			setStatus({
				progressPct: 0,
				totalRows: started.totalRows,
				processedRows: 0,
				done: false,
				result: null,
			});
			setJobId(started.jobId);
		} catch (e) {
			setError(getErrorMessage(e));
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!jobId || !loading) return;

		const activeJobId = jobId;
		let cancelled = false;

		async function pollStatus() {
			try {
				const nextStatus = await getPPPUploadStatus(activeJobId);
				if (cancelled) return;
				setStatus(nextStatus);
				if (nextStatus.done) {
					setLoading(false);
					setJobId(null);
				}
			} catch (e) {
				if (cancelled) return;
				setError(getErrorMessage(e));
				setLoading(false);
				setJobId(null);
			}
		}

		void pollStatus();
		const intervalId = setInterval(() => {
			void pollStatus();
		}, 1000);

		return () => {
			cancelled = true;
			clearInterval(intervalId);
		};
	}, [jobId, loading]);

	return {
		loading,
		error,
		status,
		result: status?.result ?? null,
		upload,
		reset: () => {
			setStatus(null);
			setJobId(null);
			setError(null);
			setLoading(false);
		},
	};
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
