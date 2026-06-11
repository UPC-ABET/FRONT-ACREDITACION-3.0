'use client';

import { useState, useCallback } from 'react';
import { getSchoolCookie } from '@/shared/lib';
import type {
	AcademicPeriod,
	DashboardResponse,
	LCFCCourse,
	LCFCConfigStatus,
	LCFCEmailParam,
	LCFCNotificationSendRequest,
} from '../types';
import {
	getAcademicPeriods,
	listLCFCCourses,
	generateLCFCConfiguration,
	cloneLCFCConfiguration,
	changeLCFCConfigStatus,
	getLCFCEmailParams,
	sendLCFCNotification,
	downloadLCFCTemplate,
	uploadLCFCMassive,
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

	const load = useCallback(async (school: string, periodId: number, programId?: number) => {
		setLoading(true);
		setError(null);
		try {
			const { courses } = await listLCFCCourses(school, periodId, programId);
			setCourses(courses);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	const generate = useCallback(
		async (
			school: string,
			academicPeriodId: number,
			programId?: number,
			campusId?: number,
			onSuccess?: () => void,
		) => {
			try {
				await generateLCFCConfiguration(school, academicPeriodId, programId, campusId);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			}
		},
		[],
	);

	const clone = useCallback(
		async (sourcePeriodId: number, targetPeriodId: number, onSuccess?: () => void) => {
			try {
				await cloneLCFCConfiguration(sourcePeriodId, targetPeriodId);
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

	return { courses, loading, error, load, generate, clone, changeStatus };
}

export function useLCFCNotification() {
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

	const send = useCallback(async (request: LCFCNotificationSendRequest, onSuccess?: () => void) => {
		setSending(true);
		setError(null);
		try {
			await sendLCFCNotification(request);
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setSending(false);
		}
	}, []);

	return { params, loading, sending, error, loadParams, send };
}

export function useLCFCUpload() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const downloadTemplate = useCallback(async (periodId: number) => {
		setError(null);
		try {
			await downloadLCFCTemplate(periodId);
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	const upload = useCallback(async (file: File) => {
		setLoading(true);
		setError(null);
		setSuccess(false);
		try {
			const school = getSchoolCookie();
			await uploadLCFCMassive(file, school ?? undefined);
			setSuccess(true);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	return { loading, error, success, downloadTemplate, upload };
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
