'use client';

import { useState, useCallback } from 'react';
import { getSchoolCookie } from '@/shared/lib';
import type {
	AcademicPeriod,
	CompetenceConfig,
	CompetenceFormData,
	DashboardResponse,
	GRAStudent,
	StudentSearchResult,
	EmailTemplate,
	GRAEmailSendRequest,
} from '../types';
import {
	getAcademicPeriods,
	listGRACompetences,
	saveGRACompetence,
	deleteGRACompetence,
	cloneGRAConfiguration,
	searchStudentByCode,
	addStudentToNotification,
	deleteStudentNotification,
	listGRAStudents,
	getGRAEmailTemplate,
	saveGRAEmailTemplate,
	sendGRAEmail,
	downloadGRATemplate,
	uploadGRAMassive,
	generateGRAPerceptionReport,
} from '../services';

export function useGRACycles() {
	const { periods, loading, error, load: _load } = useGRAPeriods();
	const load = useCallback(
		(_modalityId?: unknown) => {
			_load();
		},
		[_load],
	);
	return { cycles: periods, loading, error, load };
}

export function useGRAPeriods() {
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

export function useGRACompetences() {
	const [competences, setCompetences] = useState<CompetenceConfig[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (idPeriodo: number, idCarrera = 0) => {
		setLoading(true);
		setError(null);
		try {
			setCompetences(await listGRACompetences(idPeriodo, idCarrera));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	const save = useCallback(async (data: CompetenceFormData, onSuccess?: () => void) => {
		try {
			await saveGRACompetence(data);
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	const remove = useCallback(async (id: number, onSuccess?: () => void) => {
		try {
			await deleteGRACompetence(id);
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	const clone = useCallback(
		async (
			params: {
				idCarreraOrigen: number;
				idPeriodoOrigen: number;
				idCarreraDestino: number;
				idPeriodoDestino: number;
			},
			onSuccess?: () => void,
		) => {
			try {
				await cloneGRAConfiguration(params);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			}
		},
		[],
	);

	return { competences, loading, error, load, save, remove, clone, setError };
}

export function useGRAStudents() {
	const [students, setStudents] = useState<GRAStudent[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(
		async (params: {
			programId?: number;
			academicPeriodId?: number;
			campusId?: number;
			studentCode?: string;
		}) => {
			setLoading(true);
			setError(null);
			try {
				const { students: data } = await listGRAStudents(params);
				setStudents(data);
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const remove = useCallback(async (idNotificacion: number, onSuccess?: () => void) => {
		try {
			await deleteStudentNotification(idNotificacion);
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	return { students, loading, error, load, remove };
}

export function useGRAStudentSearch() {
	const [result, setResult] = useState<StudentSearchResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const search = useCallback(async (codigo: string, idCarrera: number) => {
		setLoading(true);
		setError(null);
		setResult(null);
		try {
			setResult(await searchStudentByCode(codigo, idCarrera));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	const add = useCallback(
		async (
			params: {
				studentId: number;
				programId: number;
				academicPeriodId: number;
				campusId?: number;
				maxRegisterDate?: string;
			},
			onSuccess?: () => void,
		) => {
			try {
				await addStudentToNotification(params);
				setResult(null);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			}
		},
		[],
	);

	return { result, loading, error, search, add, reset: () => setResult(null) };
}

export function useGRAEmail(idEncuesta: number) {
	const [template, setTemplate] = useState<EmailTemplate>({ asunto: '', cuerpo: '' });
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setTemplate(await getGRAEmailTemplate(idEncuesta));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, [idEncuesta]);

	const save = useCallback(
		async (tmpl: EmailTemplate, onSuccess?: () => void) => {
			setSaving(true);
			try {
				await saveGRAEmailTemplate({ ...tmpl, idEncuesta });
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setSaving(false);
			}
		},
		[idEncuesta],
	);

	const send = useCallback(async (req: GRAEmailSendRequest, onSuccess?: () => void) => {
		setSending(true);
		try {
			await sendGRAEmail(req);
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setSending(false);
		}
	}, []);

	return { template, setTemplate, loading, saving, sending, error, load, save, send };
}

export function useGRAUpload() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const downloadTemplate = useCallback(async (idPeriodo: number) => {
		setError(null);
		try {
			await downloadGRATemplate(idPeriodo);
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
			await uploadGRAMassive(file, escuelaActual ?? undefined);
			setSuccess(true);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	return { loading, error, success, downloadTemplate, upload, reset: () => setSuccess(false) };
}

export function useGRAReports() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reportData, setReportData] = useState<DashboardResponse | null>(null);

	const generate = useCallback(
		async (params: { idPeriodoAcademico?: number; idCarrera?: number; idComision?: number }) => {
			setLoading(true);
			setError(null);
			try {
				setReportData(await generateGRAPerceptionReport(params));
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
