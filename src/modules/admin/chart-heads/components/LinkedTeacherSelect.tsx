'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select } from '@/shared/components';
import { professorsService, type ProfessorSearchResponse } from '@/modules/academic';
import { useI18n } from '@/providers';
import type { TeacherOption } from '../types';

export function teacherLabel(teacher: TeacherOption): string {
	const fullName = `${teacher.firstName} ${teacher.lastName}`.trim();
	return teacher.code ? `${teacher.code} — ${fullName}` : fullName;
}

function toTeacherOption(professor: ProfessorSearchResponse): TeacherOption {
	const { staff } = professor;
	return {
		staffId: professor.staffId,
		code: professor.code ?? null,
		firstName: staff.firstName ?? '',
		lastName: staff.lastName ?? '',
		user: staff.user
			? {
					id: staff.user.id,
					firstName: staff.user.firstName,
					lastName: staff.user.lastName,
					email: staff.user.email,
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
			.getByFilters({ search: debouncedSearch.trim() || undefined })
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

	const teachers = useMemo<TeacherOption[]>(() => {
		const mapped = results.map(toTeacherOption);
		if (value && !mapped.some((teacher) => teacher.staffId === value.staffId)) {
			return [value, ...mapped];
		}
		return mapped;
	}, [results, value]);

	const options = useMemo(
		() => teachers.map((teacher) => ({ value: teacher.staffId, label: teacherLabel(teacher) })),
		[teachers],
	);

	const selectedValue = value ? { value: value.staffId, label: teacherLabel(value) } : null;

	return (
		<Select
			name="linkedTeacher"
			label={t('admin.chartHeads.field.teacher')}
			placeholder={t('admin.chartHeads.field.teacherPlaceholder')}
			isClearable
			isSearchable
			isDisabled={disabled}
			options={options}
			value={selectedValue}
			error={error}
			onChange={(_name, option) => {
				const picked = (option as { value?: number } | null)?.value;
				if (picked == null) {
					onChange(null);
					return;
				}
				onChange(teachers.find((teacher) => teacher.staffId === Number(picked)) ?? null);
			}}
			onInputChange={setSearch}
		/>
	);
}
