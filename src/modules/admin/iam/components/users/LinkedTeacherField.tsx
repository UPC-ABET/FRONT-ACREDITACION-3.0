'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select } from '@/shared/components';
import { professorsService, type ProfessorSearchResponse } from '@/modules/academic';
import { useI18n } from '@/providers';

export type TeacherOption = {
	staffId: number;
	code: string | null;
	firstName: string;
	lastName: string;
};

export function teacherLabel(teacher: TeacherOption): string {
	const fullName = `${teacher.firstName} ${teacher.lastName}`.trim();
	return teacher.code ? `${teacher.code} — ${fullName}` : fullName;
}

function toTeacher(professor: ProfessorSearchResponse): TeacherOption {
	return {
		staffId: professor.staff.id,
		code: professor.code ?? null,
		firstName: professor.staff.firstName ?? '',
		lastName: professor.staff.lastName ?? '',
	};
}

type Props = {
	selected: TeacherOption | null;
	onChange: (teacher: TeacherOption | null) => void;
	disabled?: boolean;
};

export function LinkedTeacherField({ selected, onChange, disabled }: Props) {
	const { t } = useI18n();
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [results, setResults] = useState<ProfessorSearchResponse[]>([]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		let active = true;
		professorsService
			.getByFilters({ unassigned: true, search: debouncedSearch.trim() || undefined })
			.then((response) => {
				if (active) setResults(response.data ?? []);
			})
			.catch(() => {
				if (active) setResults([]);
			});
		return () => {
			active = false;
		};
	}, [debouncedSearch]);

	// Keep the currently linked teacher visible even when it is not in the
	// unassigned search results (an already-linked teacher is "assigned").
	const teachers = useMemo<TeacherOption[]>(() => {
		const mapped = results.map(toTeacher);
		if (selected && !mapped.some((teacher) => teacher.staffId === selected.staffId)) {
			return [selected, ...mapped];
		}
		return mapped;
	}, [results, selected]);

	const options = useMemo(
		() => teachers.map((teacher) => ({ value: teacher.staffId, label: teacherLabel(teacher) })),
		[teachers],
	);

	const value = selected ? { value: selected.staffId, label: teacherLabel(selected) } : null;

	return (
		<Select
			name="linkedTeacher"
			label={t('admin.iam.users.form.linkedTeacher')}
			placeholder={t('admin.iam.users.form.linkedTeacherPlaceholder')}
			isClearable
			isSearchable
			isDisabled={disabled}
			options={options}
			value={value}
			onChange={(_name, option) => {
				if (!option || Array.isArray(option)) {
					onChange(null);
					return;
				}
				onChange(teachers.find((teacher) => teacher.staffId === option.value) ?? null);
			}}
			onInputChange={setSearch}
		/>
	);
}
