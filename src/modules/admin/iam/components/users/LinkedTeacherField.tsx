'use client';

import { useCallback } from 'react';
import { LazySelect, type LazyPageResult } from '@/shared/components';
import { professorsService, type ProfessorLookupItem } from '@/modules/academic';
import { useI18n } from '@/providers';

const PAGE_SIZE = 20;

export type TeacherOption = {
	staffId: number;
	code: string | null;
	firstName: string;
	lastName: string;
	staffEmail: string | null;
};

export function teacherLabel(teacher: TeacherOption): string {
	const fullName = `${teacher.firstName} ${teacher.lastName}`.trim();
	return teacher.code ? `${teacher.code} — ${fullName}` : fullName;
}

function toTeacher(professor: ProfessorLookupItem): TeacherOption {
	return {
		staffId: professor.staffId,
		code: professor.code ?? null,
		firstName: professor.firstName ?? '',
		lastName: professor.lastName ?? '',
		staffEmail: professor.staffEmail ?? null,
	};
}

type Props = {
	selected: TeacherOption | null;
	onChange: (teacher: TeacherOption | null) => void;
	disabled?: boolean;
};

export function LinkedTeacherField({ selected, onChange, disabled }: Props) {
	const { t } = useI18n();

	const loadPage = useCallback(
		({
			search,
			page,
		}: {
			search: string;
			page: number;
		}): Promise<LazyPageResult<ProfessorLookupItem>> =>
			professorsService
				.lookup({ search, page, pageSize: PAGE_SIZE, unassigned: true })
				.then((response) => ({
					items: response.data.items,
					totalPages: response.data.totalPages,
				})),
		[],
	);

	return (
		<LazySelect<ProfessorLookupItem>
			label={t('admin.iam.users.form.linkedTeacher')}
			placeholder={t('admin.iam.users.form.linkedTeacherPlaceholder')}
			value={selected ? { id: selected.staffId, label: teacherLabel(selected) } : null}
			onChange={(professor) => onChange(professor ? toTeacher(professor) : null)}
			loadPage={loadPage}
			getId={(professor) => professor.staffId}
			getLabel={(professor) => teacherLabel(toTeacher(professor))}
			isDisabled={disabled}
		/>
	);
}
