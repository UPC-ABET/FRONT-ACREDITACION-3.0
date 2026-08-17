'use client';

import { useState, useCallback, useMemo } from 'react';
import { getErrorMessage } from '@/shared/lib';
import { useI18n } from '@/providers';
import { useJobPolling } from './useJobPolling';
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
		// Without this the previous career's rows stay on screen for the whole request.
		setCompetences([]);
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

const PPP_UPLOAD_JOB_SCOPE = ['ppp', 'upload-status'] as const;

/** PPP bulk upload: kicks off a background job and polls its status so the UI can show real
 *  progress (rows actually validated/saved server-side, never simulated). */
export function usePPPUpload() {
	const [starting, setStarting] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [totalRows, setTotalRows] = useState(0);

	// Reported until the first poll lands, so the dialog opens showing the row count the
	// start call already told us rather than an empty bar.
	const pendingStatus = useMemo<PPPUploadJobStatus>(
		() => ({ progressPct: 0, totalRows, processedRows: 0, done: false, result: null }),
		[totalRows],
	);

	const {
		status,
		running,
		error: pollError,
	} = useJobPolling<PPPUploadJobStatus>({
		scope: PPP_UPLOAD_JOB_SCOPE,
		jobId,
		fetchStatus: getPPPUploadStatus,
		isDone: (jobStatus) => jobStatus.done,
		pendingStatus,
	});

	const upload = useCallback(async (file: File, programId = 0, campusId = 0) => {
		setStarting(true);
		setStartError(null);
		setJobId(null);
		setTotalRows(0);
		try {
			const started = await startPPPUpload(file, programId, campusId);
			// `accepted: false` means the server did not queue the job, so there is nothing to
			// poll — without this check the dialog would sit on a bar that never advances.
			if (!started.accepted || !started.jobId) {
				throw new Error('error.survey.ppp.uploadJobNotFound');
			}
			setTotalRows(started.totalRows);
			setJobId(started.jobId);
		} catch (e) {
			setStartError(getErrorMessage(e));
		} finally {
			setStarting(false);
		}
	}, []);

	const reset = useCallback(() => {
		setJobId(null);
		setTotalRows(0);
		setStartError(null);
	}, []);

	return {
		loading: starting || running,
		error: startError ?? pollError,
		status,
		jobId,
		result: status?.result ?? null,
		upload,
		reset,
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
