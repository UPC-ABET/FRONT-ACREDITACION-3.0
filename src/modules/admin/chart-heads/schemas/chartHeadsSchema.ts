import type {
	ChartHeadsConfig,
	ChartHeadsFormErrors,
	ChartHeadsFormValue,
	ConfigureChartHeadsPayload,
	DirectorConfig,
	DirectorPayload,
	HeadConfig,
	HeadFormErrors,
	HeadFormValue,
	HeadPayload,
} from '../types';

const VALIDATION_KEYS = {
	teacherRequired: 'admin.chartHeads.error.teacherRequired',
	titleRequired: 'admin.chartHeads.error.titleRequired',
	schoolRequired: 'admin.chartHeads.error.schoolRequired',
	duplicateSchool: 'admin.chartHeads.error.duplicateSchool',
} as const;

function emptyTitle(languages: string[]): Record<string, string> {
	return languages.reduce<Record<string, string>>((acc, code) => {
		acc[code] = '';
		return acc;
	}, {});
}

function headToFormValue(head: HeadConfig | DirectorConfig, languages: string[]): HeadFormValue {
	return {
		teacher: {
			staffId: head.staffId,
			code: head.code,
			firstName: head.firstName,
			lastName: head.lastName,
			user: head.user,
		},
		user: null,
		title: { ...emptyTitle(languages), ...head.title },
	};
}

export function configToFormValue(
	config: ChartHeadsConfig | null,
	languages: string[],
): ChartHeadsFormValue {
	return {
		dean: config?.dean
			? headToFormValue(config.dean, languages)
			: { teacher: null, user: null, title: emptyTitle(languages) },
		directors: (config?.directors ?? []).map((director) => ({
			key: `chart-${director.chartId}`,
			schoolId: director.schoolId,
			...headToFormValue(director, languages),
		})),
	};
}

export function emptyDirector(
	key: string,
	languages: string[],
): ChartHeadsFormValue['directors'][number] {
	return {
		key,
		schoolId: null,
		teacher: null,
		user: null,
		title: emptyTitle(languages),
	};
}

function isTitleComplete(title: Record<string, string>, languages: string[]): boolean {
	return languages.every((code) => (title[code] ?? '').trim().length > 0);
}

function validateHead(head: HeadFormValue, languages: string[]): HeadFormErrors {
	const errors: HeadFormErrors = {};
	if (!head.teacher) errors.teacher = VALIDATION_KEYS.teacherRequired;
	if (!isTitleComplete(head.title, languages)) errors.title = VALIDATION_KEYS.titleRequired;
	return errors;
}

export function validateChartHeadsForm(
	form: ChartHeadsFormValue,
	languages: string[],
): { errors: ChartHeadsFormErrors; isValid: boolean } {
	const deanErrors = validateHead(form.dean, languages);

	const directorErrors: ChartHeadsFormErrors['directors'] = {};
	const seenSchoolIds = new Map<number, string[]>();

	for (const director of form.directors) {
		const errors = {
			...validateHead(director, languages),
		} as ChartHeadsFormErrors['directors'][string];
		if (director.schoolId === null) {
			errors.schoolId = VALIDATION_KEYS.schoolRequired;
		} else {
			const keys = seenSchoolIds.get(director.schoolId) ?? [];
			keys.push(director.key);
			seenSchoolIds.set(director.schoolId, keys);
		}
		directorErrors[director.key] = errors;
	}

	for (const keys of seenSchoolIds.values()) {
		if (keys.length > 1) {
			for (const key of keys) {
				directorErrors[key] = {
					...directorErrors[key],
					schoolId: VALIDATION_KEYS.duplicateSchool,
				};
			}
		}
	}

	const deanHasError = Object.keys(deanErrors).length > 0;
	const directorsHaveError = Object.values(directorErrors).some(
		(errors) => Object.keys(errors).length > 0,
	);

	return {
		errors: { dean: deanErrors, directors: directorErrors },
		isValid: !deanHasError && !directorsHaveError,
	};
}

function resolveUserId(head: HeadFormValue): number | null {
	if (head.teacher?.user) return head.teacher.user.id;
	return head.user?.id ?? null;
}

function headToPayload(head: HeadFormValue): HeadPayload {
	return {
		staffId: head.teacher!.staffId,
		userId: resolveUserId(head),
		title: head.title,
	};
}

export function formToPayload(
	academicPeriodId: number,
	form: ChartHeadsFormValue,
): ConfigureChartHeadsPayload {
	return {
		academicPeriodId,
		dean: headToPayload(form.dean),
		directors: form.directors.map<DirectorPayload>((director) => ({
			...headToPayload(director),
			schoolId: director.schoolId as number,
		})),
	};
}
