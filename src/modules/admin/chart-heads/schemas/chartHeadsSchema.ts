import type {
	ChartHeadsConfig,
	ChartHeadsFormErrors,
	ChartHeadsFormValue,
	ConfigureChartHeadsPayload,
	DirectorConfig,
	DirectorFormValue,
	DirectorPayload,
	HeadConfig,
	HeadFormErrors,
	HeadFormValue,
	HeadPayload,
	ProgramFormErrors,
	ProgramFormValue,
	ProgramPayload,
} from '../types';

const VALIDATION_KEYS = {
	teacherRequired: 'admin.chartHeads.error.teacherRequired',
	titleRequired: 'admin.chartHeads.error.titleRequired',
	schoolRequired: 'admin.chartHeads.error.schoolRequired',
	duplicateSchool: 'admin.chartHeads.error.duplicateSchool',
	programRequired: 'admin.chartHeads.error.programRequired',
	duplicateProgram: 'admin.chartHeads.error.duplicateProgram',
} as const;

function emptyTitle(languages: string[]): Record<string, string> {
	return languages.reduce<Record<string, string>>((acc, code) => {
		acc[code] = '';
		return acc;
	}, {});
}

function headToFormValue(head: HeadConfig, languages: string[]): HeadFormValue {
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
			programs: (director.programs ?? []).map((program) => ({
				key: `program-${program.chartId}`,
				programId: program.programId,
				...headToFormValue(program, languages),
			})),
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
		programs: [],
	};
}

export function emptyProgram(key: string, languages: string[]): ProgramFormValue {
	return {
		key,
		programId: null,
		teacher: null,
		user: null,
		title: emptyTitle(languages),
	};
}

export function usedSchoolIds(directors: DirectorFormValue[], excludeKey: string): Set<number> {
	const ids = new Set<number>();
	for (const director of directors) {
		if (director.key === excludeKey) continue;
		if (director.schoolId !== null) ids.add(director.schoolId);
	}
	return ids;
}

export function findDirectorForSchool(
	config: ChartHeadsConfig,
	schoolId: number,
): DirectorConfig | undefined {
	return config.directors.find((director) => director.schoolId === schoolId);
}

export function usedProgramIds(
	directors: DirectorFormValue[],
	excludeDirectorKey: string,
	excludeProgramKey: string,
): Set<number> {
	const ids = new Set<number>();
	for (const director of directors) {
		for (const program of director.programs) {
			if (director.key === excludeDirectorKey && program.key === excludeProgramKey) continue;
			if (program.programId !== null) ids.add(program.programId);
		}
	}
	return ids;
}

type DirectorFormErrorsDraft = ChartHeadsFormErrors['directors'][string];

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
	const seenProgramIds = new Map<number, Array<{ directorKey: string; programKey: string }>>();

	for (const director of form.directors) {
		const errors: DirectorFormErrorsDraft = {
			...validateHead(director, languages),
			programs: {},
		};
		if (director.schoolId === null) {
			errors.schoolId = VALIDATION_KEYS.schoolRequired;
		} else {
			const keys = seenSchoolIds.get(director.schoolId) ?? [];
			keys.push(director.key);
			seenSchoolIds.set(director.schoolId, keys);
		}

		for (const program of director.programs) {
			const programErrors: ProgramFormErrors = { ...validateHead(program, languages) };
			if (program.programId === null) {
				programErrors.programId = VALIDATION_KEYS.programRequired;
			} else {
				const seen = seenProgramIds.get(program.programId) ?? [];
				seen.push({ directorKey: director.key, programKey: program.key });
				seenProgramIds.set(program.programId, seen);
			}
			errors.programs[program.key] = programErrors;
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

	for (const occurrences of seenProgramIds.values()) {
		if (occurrences.length > 1) {
			for (const { directorKey, programKey } of occurrences) {
				const director = directorErrors[directorKey];
				director.programs[programKey] = {
					...director.programs[programKey],
					programId: VALIDATION_KEYS.duplicateProgram,
				};
			}
		}
	}

	const directorHasOwnError = (errors: DirectorFormErrorsDraft): boolean =>
		Boolean(errors.teacher || errors.title || errors.schoolId);
	const directorHasProgramError = (errors: DirectorFormErrorsDraft): boolean =>
		Object.values(errors.programs).some((programErrors) => Object.keys(programErrors).length > 0);

	const deanHasError = Object.keys(deanErrors).length > 0;
	const directorsHaveError = Object.values(directorErrors).some(
		(errors) => directorHasOwnError(errors) || directorHasProgramError(errors),
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
			programs: director.programs.map<ProgramPayload>((program) => ({
				...headToPayload(program),
				programId: program.programId as number,
			})),
		})),
	};
}
