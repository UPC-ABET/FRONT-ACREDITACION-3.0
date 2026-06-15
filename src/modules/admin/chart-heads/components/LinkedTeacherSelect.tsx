'use client';

import { useCallback } from 'react';
import { LazySelect, type LazyPageResult } from '@/shared/components';
import { professorsService, type ProfessorLookupItem } from '@/modules/academic';
import { useI18n } from '@/providers';
import type { TeacherOption } from '../types';

const PAGE_SIZE = 20;

export function teacherLabel(teacher: TeacherOption): string {
	const fullName = `${teacher.firstName} ${teacher.lastName}`.trim();
	return teacher.code ? `${teacher.code} — ${fullName}` : fullName;
}

function toTeacherOption(professor: ProfessorLookupItem): TeacherOption {
	return {
		staffId: professor.staffId,
		code: professor.code ?? null,
		firstName: professor.firstName ?? '',
		lastName: professor.lastName ?? '',
		user: professor.user
			? {
					id: professor.user.id,
					firstName: professor.user.firstName,
					lastName: professor.user.lastName,
					email: professor.user.email,
				}
			: null,
	};
}

interface Props {
	value: TeacherOption | null;
	onChange: (teacher: TeacherOption | null) => void;
	error?: string;
	disabled?: boolean;
}

export function LinkedTeacherSelect({ value, onChange, error, disabled }: Props) {
	const { t } = useI18n();

	const loadPage = useCallback(
		({
			search,
			page,
		}: {
			search: string;
			page: number;
		}): Promise<LazyPageResult<ProfessorLookupItem>> =>
			professorsService.lookup({ search, page, pageSize: PAGE_SIZE }).then((response) => ({
				items: response.data.items,
				totalPages: response.data.totalPages,
			})),
		[],
	);

	return (
		<LazySelect<ProfessorLookupItem>
			label={t('admin.chartHeads.field.teacher')}
			placeholder={t('admin.chartHeads.field.teacherPlaceholder')}
			value={value ? { id: value.staffId, label: teacherLabel(value) } : null}
			onChange={(professor) => onChange(professor ? toTeacherOption(professor) : null)}
			loadPage={loadPage}
			getId={(professor) => professor.staffId}
			getLabel={(professor) => teacherLabel(toTeacherOption(professor))}
			isDisabled={disabled}
			error={error}
		/>
	);
}
