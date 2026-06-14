'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/providers';
import type {
	AcademicPeriod,
	CompetenceConfig,
	CompetenceFormData,
	DashboardResponse,
	GRAStudent,
	StudentSearchResult,
	EmailTemplate,
	GRAEmailSendRequest,
	MassiveUploadResult,
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

	const load = useCallback(async (periodId: number, programId = 0) => {
		setLoading(true);
		setError(null);
		try {
			setCompetences(await listGRACompetences(periodId, programId));
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
				sourceProgramId: number;
				sourcePeriodId: number;
				targetProgramId: number;
				targetPeriodId: number;
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

	const remove = useCallback(async (notificationId: number, onSuccess?: () => void) => {
		try {
			await deleteStudentNotification(notificationId);
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	return { students, error, load, remove };
}

export function useGRAStudentSearch() {
	const [result, setResult] = useState<StudentSearchResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const search = useCallback(async (code: string, programId: number) => {
		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const found = await searchStudentByCode(code, programId);
			if (found) {
				setResult(found);
			} else {
				setError('surveys.gra.notifications.studentNotFound');
			}
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

export function useGRAEmail(_surveyId?: number) {
	const { locale } = useI18n();
	const [template, setTemplate] = useState<EmailTemplate>({ subject: '', body: '' });
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setTemplate(await getGRAEmailTemplate(locale));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, [locale]);

	const save = useCallback(async (tmpl: EmailTemplate, onSuccess?: () => void) => {
		setSaving(true);
		try {
			await saveGRAEmailTemplate({ subject: tmpl.subject, body: tmpl.body });
			onSuccess?.();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setSaving(false);
		}
	}, []);

	const send = useCallback(
		async (req: GRAEmailSendRequest, onSuccess?: () => void) => {
			setSending(true);
			try {
				await sendGRAEmail(req, locale);
				onSuccess?.();
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setSending(false);
			}
		},
		[locale],
	);

	return { template, setTemplate, loading, saving, sending, error, load, save, send };
}

interface GRAUploadParams {
	programId: number;
	academicPeriodId: number;
	campusId?: number;
	maxRegisterDate?: string;
}

export function useGRAUpload() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [result, setResult] = useState<MassiveUploadResult | null>(null);

	const downloadTemplate = useCallback(async () => {
		setError(null);
		try {
			await downloadGRATemplate();
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	const upload = useCallback(async (file: File, params: GRAUploadParams) => {
		setLoading(true);
		setError(null);
		setSuccess(false);
		setResult(null);
		try {
			const uploadResult = await uploadGRAMassive(file, params);
			setResult(uploadResult);
			setSuccess(true);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		loading,
		error,
		success,
		result,
		downloadTemplate,
		upload,
		reset: () => {
			setSuccess(false);
			setResult(null);
		},
	};
}

export function useGRAReports() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reportData, setReportData] = useState<DashboardResponse | null>(null);

	const generate = useCallback(
		async (params: { academicPeriodId?: number; programId?: number; commissionId?: number }) => {
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
