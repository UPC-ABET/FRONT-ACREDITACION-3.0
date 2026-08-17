'use client';

import { useState, useCallback, useRef } from 'react';
import { getErrorMessage } from '@/shared/lib';
import { useI18n } from '@/providers';
import { useJobPolling } from './useJobPolling';
import type {
	AcademicPeriod,
	LCFCCourse,
	LCFCConfigStatus,
	LCFCConfigUpdateRequest,
	LCFCEmailParam,
	LCFCNotificationJobStatus,
	LCFCNotificationSendRequest,
	LCFCSectionSummary,
	GRASendSummary,
} from '../types';
import {
	getAcademicPeriods,
	listLCFCCourses,
	listLCFCSectionSummaries,
	generateLCFCConfiguration,
	getAvailableSections,
	cloneLCFCConfiguration,
	changeLCFCConfigStatus,
	updateLCFCConfig,
	deleteLCFCConfig,
	getLCFCEmailParams,
	getLCFCSendSummary,
	getLCFCNotificationStatus,
	sendLCFCNotification,
} from '../services';
import type { AvailableSection, GenerateConfigResult, CloneConfigResult } from '../types';

export function useLCFCCycles() {
	const { periods, loading, error, load: _load } = useLCFCPeriods();
	const load = useCallback(() => {
		_load();
	}, [_load]);
	return { cycles: periods, loading, error, load };
}

export function useLCFCPeriods() {
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

export function useLCFCConfiguration() {
	const [courses, setCourses] = useState<LCFCCourse[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (periodId: number, programId?: number) => {
		setLoading(true);
		setError(null);
		try {
			const { courses } = await listLCFCCourses(periodId, programId);
			setCourses(courses);
		} catch (e) {
			setError(getErrorMessage(e));
		} finally {
			setLoading(false);
		}
	}, []);

	const generate = useCallback(
		async (
			modalityTypeId: number,
			academicPeriodId: number,
			programId: number,
			courseSectionIds?: number[],
			onSuccess?: (result: GenerateConfigResult) => void,
		) => {
			try {
				const result = await generateLCFCConfiguration(
					modalityTypeId,
					academicPeriodId,
					programId,
					courseSectionIds,
				);
				onSuccess?.(result);
			} catch (e) {
				setError(getErrorMessage(e));
			}
		},
		[],
	);

	const clone = useCallback(
		async (
			targetPeriodId: number,
			programId: number,
			onSuccess?: (result: CloneConfigResult) => void,
			sourcePeriodId?: number,
		) => {
			setLoading(true);
			setError(null);
			try {
				const result = await cloneLCFCConfiguration(targetPeriodId, programId, sourcePeriodId);
				onSuccess?.(result);
			} catch (e) {
				setError(getErrorMessage(e));
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const changeStatus = useCallback(
		async (configId: number, newStatus: LCFCConfigStatus, onSuccess?: () => void) => {
			try {
				await changeLCFCConfigStatus(configId, newStatus);
				onSuccess?.();
			} catch (e) {
				setError(getErrorMessage(e));
			}
		},
		[],
	);

	const update = useCallback(
		async (id: number, data: LCFCConfigUpdateRequest, onSuccess?: () => void) => {
			try {
				await updateLCFCConfig(id, data);
				onSuccess?.();
			} catch (e) {
				setError(getErrorMessage(e));
			}
		},
		[],
	);

	const remove = useCallback(async (id: number, onSuccess?: () => void) => {
		try {
			await deleteLCFCConfig(id);
			onSuccess?.();
		} catch (e) {
			setError(getErrorMessage(e));
		}
	}, []);

	return { courses, loading, error, load, generate, clone, changeStatus, update, remove };
}

/** Lean, server-paginated section list for the notifications view — much lighter than
 *  useLCFCConfiguration (the backend sends one page instead of every config row). */
export function useLCFCSections() {
	const [sections, setSections] = useState<LCFCSectionSummary[]>([]);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(
		async (params: { programId?: number; search?: string; page?: number; pageSize?: number }) => {
			setLoading(true);
			setError(null);
			try {
				const result = await listLCFCSectionSummaries(params);
				setSections(result.items);
				setTotal(result.total);
				setTotalPages(result.totalPages);
			} catch (e) {
				setError(getErrorMessage(e));
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return { sections, total, totalPages, loading, error, load };
}

const LCFC_SEND_JOB_SCOPE = ['lcfc', 'notification-status'] as const;
const LCFC_PENDING_STATUS: LCFCNotificationJobStatus = {
	progressPct: 0,
	emailsSent: 0,
	emailsFailed: 0,
};

export function useLCFCNotification() {
	const { locale } = useI18n();
	const [params, setParams] = useState<LCFCEmailParam[]>([]);
	const [loading, setLoading] = useState(false);
	const [starting, setStarting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [summary, setSummary] = useState<GRASendSummary | null>(null);
	const [loadingSummary, setLoadingSummary] = useState(false);
	const onSuccessRef = useRef<(() => void) | undefined>(undefined);
	const onErrorRef = useRef<(() => void) | undefined>(undefined);

	const {
		status,
		running,
		error: pollError,
	} = useJobPolling<LCFCNotificationJobStatus>({
		scope: LCFC_SEND_JOB_SCOPE,
		jobId,
		fetchStatus: getLCFCNotificationStatus,
		isDone: (jobStatus) => jobStatus.progressPct >= 100,
		pendingStatus: LCFC_PENDING_STATUS,
		onSettled: ({ error: settledError }) => {
			if (settledError) onErrorRef.current?.();
			else onSuccessRef.current?.();
			onSuccessRef.current = undefined;
			onErrorRef.current = undefined;
		},
	});

	const loadParams = useCallback(async () => {
		setLoading(true);
		try {
			setParams(await getLCFCEmailParams());
		} catch (e) {
			setError(getErrorMessage(e));
		} finally {
			setLoading(false);
		}
	}, []);

	const loadSummary = useCallback(
		async (
			request: Pick<
				LCFCNotificationSendRequest,
				'programId' | 'campusId' | 'courseSectionId' | 'resend'
			>,
		) => {
			setLoadingSummary(true);
			setError(null);
			try {
				setSummary(await getLCFCSendSummary(request, locale));
			} catch (e) {
				setError(getErrorMessage(e));
			} finally {
				setLoadingSummary(false);
			}
		},
		[locale],
	);

	const send = useCallback(
		async (request: LCFCNotificationSendRequest, onSuccess?: () => void, onError?: () => void) => {
			setStarting(true);
			setError(null);
			setJobId(null);
			onSuccessRef.current = onSuccess;
			onErrorRef.current = onError;
			try {
				const result = await sendLCFCNotification(request, locale);
				if (!result.jobId) {
					throw new Error('error.survey.lcfc.notificationJobNotFound');
				}
				setJobId(result.jobId);
			} catch (e) {
				setError(getErrorMessage(e));
				onSuccessRef.current = undefined;
				onErrorRef.current?.();
				onErrorRef.current = undefined;
			} finally {
				setStarting(false);
			}
		},
		[locale],
	);

	return {
		params,
		loading,
		sending: starting || running,
		error: error ?? pollError,
		status,
		jobId,
		summary,
		loadingSummary,
		loadParams,
		loadSummary,
		send,
	};
}

export function useLCFCAvailableSections() {
	const [sections, setSections] = useState<AvailableSection[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (programId: number) => {
		setLoading(true);
		setError(null);
		try {
			setSections(await getAvailableSections(programId));
		} catch (e) {
			setError(getErrorMessage(e));
		} finally {
			setLoading(false);
		}
	}, []);

	return { sections, loading, error, load };
}
