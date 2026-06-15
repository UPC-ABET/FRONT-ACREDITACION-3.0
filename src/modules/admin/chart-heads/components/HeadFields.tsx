'use client';

import { useMemo } from 'react';
import { I18nTextField, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import type { HeadFormErrors, HeadFormValue, LinkedUserRef, UserOption } from '../types';
import { LinkedTeacherSelect } from './LinkedTeacherSelect';

interface Props {
	value: HeadFormValue;
	onChange: (next: HeadFormValue) => void;
	errors?: HeadFormErrors;
	userOptions: UserOption[];
	usersLoading: boolean;
	disabled?: boolean;
}

function linkedUserLabel(user: LinkedUserRef): string {
	const fullName = `${user.firstName} ${user.lastName}`.trim();
	return fullName && user.email ? `${fullName} — ${user.email}` : fullName || user.email || '';
}

export function HeadFields({
	value,
	onChange,
	errors,
	userOptions,
	usersLoading,
	disabled,
}: Props) {
	const { t } = useI18n();

	const lockedUser = value.teacher?.user ?? null;
	const userLocked = lockedUser !== null;

	const userSelectOptions = useMemo(
		() => userOptions.map((user) => ({ value: user.id, label: user.label })),
		[userOptions],
	);

	const userValue = userLocked
		? { value: lockedUser.id, label: linkedUserLabel(lockedUser) }
		: value.user
			? { value: value.user.id, label: value.user.label }
			: null;

	return (
		<div className="space-y-4">
			<LinkedTeacherSelect
				value={value.teacher}
				disabled={disabled}
				error={errors?.teacher ? tryTranslate(t, errors.teacher) : undefined}
				onChange={(teacher) =>
					onChange({ ...value, teacher, user: teacher?.user ? null : value.user })
				}
			/>

			<Select
				label={t('admin.chartHeads.field.user')}
				placeholder={
					userLocked
						? t('admin.chartHeads.field.userLockedPlaceholder')
						: usersLoading
							? t('loading.default')
							: t('admin.chartHeads.field.userPlaceholder')
				}
				isDisabled={disabled || usersLoading || userLocked}
				isSearchable
				isClearable
				value={userValue}
				options={userSelectOptions}
				onChange={(_, option) => {
					const picked = (option as { value?: number } | null)?.value;
					if (picked == null) {
						onChange({ ...value, user: null });
						return;
					}
					const selected = userOptions.find((user) => user.id === Number(picked));
					if (!selected) {
						onChange({ ...value, user: null });
						return;
					}
					const teacherFromUser = selected.staff
						? {
								staffId: selected.staff.id,
								code: selected.staff.code,
								firstName: selected.staff.firstName,
								lastName: selected.staff.lastName,
								user: {
									id: selected.id,
									firstName: selected.firstName,
									lastName: selected.lastName,
									email: selected.email,
								},
							}
						: null;
					onChange({
						...value,
						teacher: teacherFromUser ?? value.teacher,
						user: teacherFromUser ? null : { id: selected.id, label: selected.label },
					});
				}}
			/>

			<I18nTextField
				as="input"
				layout="row"
				label={t('admin.chartHeads.field.title')}
				required
				value={value.title}
				disabled={disabled}
				error={errors?.title ? tryTranslate(t, errors.title) : undefined}
				onChange={(title) => onChange({ ...value, title })}
			/>
		</div>
	);
}
