import type {
	ChartHeadsConfig,
	ChartHeadsFormErrors,
	ChartHeadsFormValue,
	ConfigureChartHeadsPayload,
	DeanConfig,
	DirectorConfig,
	HeadFormErrors,
	HeadFormValue,
} from '../types';

const VALIDATION_KEYS = {
	firstNameRequired: 'admin.chartHeads.error.firstNameRequired',
	lastNameRequired: 'admin.chartHeads.error.lastNameRequired',
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

function headToFormValue(head: DeanConfig | DirectorConfig, languages: string[]): HeadFormValue {
	return {
		lastName: head.lastName,
		firstName: head.firstName,
		userId: head.userId,
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
			: { lastName: '', firstName: '', userId: null, title: emptyTitle(languages) },
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
		lastName: '',
		firstName: '',
		userId: null,
		title: emptyTitle(languages),
	};
}

function isTitleComplete(title: Record<string, string>, languages: string[]): boolean {
	return languages.every((code) => (title[code] ?? '').trim().length > 0);
}

function validateHead(head: HeadFormValue, languages: string[]): HeadFormErrors {
	const errors: HeadFormErrors = {};
	if (head.firstName.trim().length === 0) errors.firstName = VALIDATION_KEYS.firstNameRequired;
	if (head.lastName.trim().length === 0) errors.lastName = VALIDATION_KEYS.lastNameRequired;
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

export function formToPayload(
	academicPeriodId: number,
	form: ChartHeadsFormValue,
): ConfigureChartHeadsPayload {
	return {
		academicPeriodId,
		dean: {
			lastName: form.dean.lastName.trim(),
			firstName: form.dean.firstName.trim(),
			userId: form.dean.userId,
			title: form.dean.title,
		},
		directors: form.directors.map((director) => ({
			schoolId: director.schoolId as number,
			lastName: director.lastName.trim(),
			firstName: director.firstName.trim(),
			userId: director.userId,
			title: director.title,
		})),
	};
}
