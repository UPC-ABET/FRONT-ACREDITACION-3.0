'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/providers';
import type {
	AcademicPeriod,
	DashboardResponse,
	LCFCCourse,
	LCFCConfigStatus,
	LCFCConfigUpdateRequest,
	LCFCEmailParam,
	LCFCNotificationSendRequest,
} from '../types';
import {
	getAcademicPeriods,
	listLCFCCourses,
	generateLCFCConfiguration,
	cloneLCFCConfiguration,
	changeLCFCConfigStatus,
	updateLCFCConfig,
	deleteLCFCConfig,
	getLCFCEmailParams,
	sendLCFCNotification,
	generateLCFCPerceptionReport,
} from '../services';

export function useLCFCCycles() {
	const { periods, loading, error, load: _load } = useLCFCPeriods();
	const load = useCallback(
		(_modalityId?: unknown) => {
			_load();
		},
		[_load],
	);
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
			setError((e as Error).message);
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
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	const generate = useCallback(
		async (
			modalityTypeId: number,
			academicPeriodId: number,
			programId: number,
			onSuccess?: () => void,
		) => {
			try {
				await generateLCFCConfiguration(modalityTypeId, academicPeriodId, programId);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			}
		},
		[],
	);

	const clone = useCallback(
		async (
			sourcePeriodId: number,
			targetPeriodId: number,
			programId?: number,
			onSuccess?: () => void,
		) => {
			try {
				await cloneLCFCConfiguration(sourcePeriodId, targetPeriodId, programId ?? 0);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
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
				setError((e as Error).message);
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
				setError((e as Error).message);
			}
		},
		[],
	);

	const remove = useCallback(async (id: number, onSuccess?: () => void) => {
		try {
			await deleteLCFCConfig(id);
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
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

	const loadParams = useCallback(async () => {
		setLoading(true);
		try {
			setParams(await getLCFCEmailParams());
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	const send = useCallback(
		async (request: LCFCNotificationSendRequest, onSuccess?: () => void) => {
			setSending(true);
			setError(null);
			try {
				await sendLCFCNotification(request, locale);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setSending(false);
			}
		},
		[locale],
	);

	return { params, loading, sending, error, loadParams, send };
}

export function useLCFCReports() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reportData, setReportData] = useState<DashboardResponse | null>(null);

	const generate = useCallback(
		async (params: { academicPeriodId?: number; school?: string; programId?: number }) => {
			setLoading(true);
			setError(null);
			try {
				setReportData(
					await generateLCFCPerceptionReport({
						academicPeriodId: params.academicPeriodId,
						programId: params.programId,
					}),
				);
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
