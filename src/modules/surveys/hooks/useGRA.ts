'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/shared/lib';
import { useI18n } from '@/providers';
import { surveyQueryKeys } from './useSurveyQueries';
import type {
	AcademicPeriod,
	CompetenceConfig,
	CompetenceFormData,
	GRAStudent,
	StudentSearchResult,
	EmailTemplate,
	GRAEmailSendRequest,
	GRANotificationJobStatus,
	GRASendSummary,
	MassiveUploadResult,
} from '../types';
import {
	getAcademicPeriods,
	listGRACompetences,
	saveGRACompetence,
	deleteGRACompetence,
	cloneGRAConfiguration,
	searchStudentsByPrefix,
	addStudentToNotification,
	deleteStudentNotification,
	listGRAStudents,
	getGRAEmailTemplate,
	saveGRAEmailTemplate,
	getGRASendSummary,
	sendGRAEmail,
	getGRASendStatus,
	downloadGRATemplate,
	uploadGRAMassive,
} from '../services';

export function useGRACycles() {
	const { periods, loading, error, load: _load } = useGRAPeriods();
	const load = useCallback(() => {
		_load();
	}, [_load]);
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
			setError(getErrorMessage(e));
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
			setError(getErrorMessage(e));
		} finally {
			setLoading(false);
		}
	}, []);

	const save = useCallback(async (data: CompetenceFormData, onSuccess?: () => void) => {
		try {
			await saveGRACompetence(data);
			onSuccess?.();
		} catch (e) {
			setError(getErrorMessage(e));
		}
	}, []);

	const remove = useCallback(async (id: number, onSuccess?: () => void) => {
		try {
			await deleteGRACompetence(id);
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
				await cloneGRAConfiguration(params);
				onSuccess?.();
			} catch (e) {
				setError(getErrorMessage(e));
			}
		},
		[],
	);

	return { competences, loading, error, load, save, remove, clone, setError };
}

export function useGRAStudents() {
	const [students, setStudents] = useState<GRAStudent[]>([]);
	const [, setLoading] = useState(false);
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
				setError(getErrorMessage(e));
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
			setError(getErrorMessage(e));
		}
	}, []);

	return { students, error, load, remove };
}

export function useGRAStudentSearch() {
	const [codePrefix, setCodePrefix] = useState('');
	const [result, setResult] = useState<StudentSearchResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const trimmedPrefix = codePrefix.trim();
	const suggestionsQuery = useQuery({
		queryKey: surveyQueryKeys.graStudentSuggestions(trimmedPrefix),
		queryFn: () => searchStudentsByPrefix(trimmedPrefix),
		enabled: trimmedPrefix.length > 0 && !result,
	});

	const searchPrefix = useCallback((value: string) => {
		setResult(null);
		setError(null);
		setCodePrefix(value);
	}, []);

	const selectSuggestion = useCallback((student: StudentSearchResult) => {
		setResult(student);
		setCodePrefix('');
		setError(null);
	}, []);

	const add = useCallback(
		async (
			params: {
				studentId: number;
				programId: number;
				campusId?: number;
				maxRegisterDate?: string;
			},
			onSuccess?: () => void,
		) => {
			try {
				await addStudentToNotification(params);
				setResult(null);
				onSuccess?.();
			} catch (caughtError) {
				setError(getErrorMessage(caughtError));
			}
		},
		[],
	);

	const reset = useCallback(() => {
		setResult(null);
		setCodePrefix('');
		setError(null);
	}, []);

	return {
		result,
		suggestions: result ? [] : (suggestionsQuery.data ?? []),
		loading: suggestionsQuery.isFetching,
		error,
		searchPrefix,
		selectSuggestion,
		add,
		reset,
	};
}

export function useGRAEmail() {
	const { locale } = useI18n();
	const [template, setTemplate] = useState<EmailTemplate>({ subject: '', body: '' });
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setTemplate(await getGRAEmailTemplate(locale));
		} catch (e) {
			setError(getErrorMessage(e));
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
			setError(getErrorMessage(e));
		} finally {
			setSaving(false);
		}
	}, []);

	return { template, setTemplate, loading, saving, error, load, save };
}

export function useGRASendNotifications() {
	const { locale } = useI18n();
	const [summary, setSummary] = useState<GRASendSummary | null>(null);
	const [loadingSummary, setLoadingSummary] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [status, setStatus] = useState<GRANotificationJobStatus | null>(null);
	const onSuccessRef = useRef<(() => void) | undefined>(undefined);

	const loadSummary = useCallback(
		async (programId?: number) => {
			setLoadingSummary(true);
			setError(null);
			try {
				setSummary(await getGRASendSummary(programId, locale));
			} catch (e) {
				setError(getErrorMessage(e));
			} finally {
				setLoadingSummary(false);
			}
		},
		[locale],
	);

	const send = useCallback(
		async (req: GRAEmailSendRequest, onSuccess?: () => void) => {
			setSending(true);
			setError(null);
			setStatus({ progressPct: 0, totalStudents: 0, emailsSent: 0, emailsFailed: 0, errors: [] });
			onSuccessRef.current = onSuccess;
			try {
				const result = await sendGRAEmail(req, locale);
				if (!result.jobId) {
					throw new Error('error.survey.gra.notificationJobNotFound');
				}
				setJobId(result.jobId);
			} catch (e) {
				setError(getErrorMessage(e));
				setJobId(null);
				onSuccessRef.current = undefined;
				setSending(false);
			}
		},
		[locale],
	);

	const reset = useCallback(() => {
		setSummary(null);
		setStatus(null);
		setJobId(null);
		setError(null);
		setSending(false);
	}, []);

	useEffect(() => {
		if (!jobId || !sending) return;

		const activeJobId = jobId;
		let cancelled = false;

		async function pollStatus() {
			try {
				const nextStatus = await getGRASendStatus(activeJobId);
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

	return { summary, loadingSummary, loadSummary, sending, status, error, send, reset };
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
			setError(getErrorMessage(e));
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
			setError(getErrorMessage(e));
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
