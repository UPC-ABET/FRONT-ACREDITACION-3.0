'use client';

import { useState, useCallback } from 'react';
import { getSchoolCookie } from '@/shared/lib';
import type {
	AcademicPeriod,
	DashboardResponse,
	LCFCCourse,
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

	const load = useCallback(async (idEscuela: string, idPeriodo: number, idCarrera?: number) => {
		setLoading(true);
		setError(null);
		try {
			const { cursos } = await listLCFCCourses(idEscuela, idPeriodo, idCarrera);
			setCourses(cursos);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	const generate = useCallback(
		async (
			escuela: string,
			academic_period_id: number,
			program_id?: number,
			campus_id?: number,
			onSuccess?: () => void,
		) => {
			try {
				await generateLCFCConfiguration(escuela, academic_period_id, program_id, campus_id);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			}
		},
		[],
	);

	const clone = useCallback(
		async (idPeriodoOrigen: number, idPeriodoDestino: number, onSuccess?: () => void) => {
			try {
				await cloneLCFCConfiguration(idPeriodoOrigen, idPeriodoDestino);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			}
		},
		[],
	);

	const changeStatus = useCallback(
		async (idConfiguracion: number, nuevoEstado: 'ACTIVO' | 'INACTIVO', onSuccess?: () => void) => {
			try {
				await changeLCFCConfigStatus(idConfiguracion, nuevoEstado);
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

	const downloadTemplate = useCallback(async (idPeriodo: number) => {
		setError(null);
		try {
			await downloadLCFCTemplate(idPeriodo);
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	const upload = useCallback(async (file: File) => {
		setLoading(true);
		setError(null);
		setSuccess(false);
		try {
			const escuelaActual = getSchoolCookie();
			await uploadLCFCMassive(file, escuelaActual ?? undefined);
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
		async (params: {
			idPeriodoAcademico?: number;
			idEscuela?: string;
			idPeriodo?: number;
			idCarrera?: number;
		}) => {
			setLoading(true);
			setError(null);
			try {
				setReportData(await generateLCFCPerceptionReport(params));
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
