'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getErrorMessage } from '@/shared/lib';
import { useI18n } from '@/providers';
import type {
	AcademicPeriod,
	LCFCCourse,
	LCFCConfigStatus,
	LCFCConfigUpdateRequest,
	LCFCEmailParam,
	LCFCNotificationJobStatus,
	LCFCNotificationSendRequest,
} from '../types';
import {
	getAcademicPeriods,
	listLCFCCourses,
	generateLCFCConfiguration,
	getAvailableSections,
	cloneLCFCConfiguration,
	changeLCFCConfigStatus,
	updateLCFCConfig,
	deleteLCFCConfig,
	getLCFCEmailParams,
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

export function useLCFCNotification() {
	const { locale } = useI18n();
	const [params, setParams] = useState<LCFCEmailParam[]>([]);
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [status, setStatus] = useState<LCFCNotificationJobStatus | null>(null);
	const onSuccessRef = useRef<(() => void) | undefined>(undefined);
	const onErrorRef = useRef<(() => void) | undefined>(undefined);

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

	const send = useCallback(
		async (request: LCFCNotificationSendRequest, onSuccess?: () => void, onError?: () => void) => {
			setSending(true);
			setError(null);
			setStatus({ progressPct: 0, emailsSent: 0, emailsFailed: 0 });
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
				setJobId(null);
				onSuccessRef.current = undefined;
				onErrorRef.current?.();
				onErrorRef.current = undefined;
				setSending(false);
			}
		},
		[locale],
	);

	useEffect(() => {
		if (!jobId || !sending) return;

		const activeJobId = jobId;
		let cancelled = false;

		async function pollStatus() {
			try {
				const nextStatus = await getLCFCNotificationStatus(activeJobId);
				if (cancelled) return;
				setStatus(nextStatus);
				if (nextStatus.progressPct >= 100) {
					setSending(false);
					setJobId(null);
					onSuccessRef.current?.();
					onSuccessRef.current = undefined;
				}
			} catch (e) {
				if (cancelled) return;
				setError(getErrorMessage(e));
				setSending(false);
				setJobId(null);
				onSuccessRef.current = undefined;
				onErrorRef.current?.();
				onErrorRef.current = undefined;
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
	}, [jobId, sending]);

	return { params, loading, sending, error, status, jobId, loadParams, send };
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
