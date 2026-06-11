'use client';

import { useMemo } from 'react';
import { I18nTextField, Input, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import type { HeadFormErrors, HeadFormValue, UserOption } from '../types';

interface Props {
	value: HeadFormValue;
	onChange: (next: HeadFormValue) => void;
	errors?: HeadFormErrors;
	userOptions: UserOption[];
	usersLoading: boolean;
	disabled?: boolean;
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

	const selectOptions = useMemo(
		() => userOptions.map((user) => ({ value: user.id, label: user.label })),
		[userOptions],
	);

	const selectedUser = selectOptions.find((option) => option.value === value.userId) ?? null;

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Input
					label={t('admin.chartHeads.field.firstName')}
					required
					value={value.firstName}
					disabled={disabled}
					error={errors?.firstName ? tryTranslate(t, errors.firstName) : undefined}
					onChange={(event) => onChange({ ...value, firstName: event.target.value })}
				/>
				<Input
					label={t('admin.chartHeads.field.lastName')}
					required
					value={value.lastName}
					disabled={disabled}
					error={errors?.lastName ? tryTranslate(t, errors.lastName) : undefined}
					onChange={(event) => onChange({ ...value, lastName: event.target.value })}
				/>
			</div>

			<Select
				label={t('admin.chartHeads.field.user')}
				placeholder={
					usersLoading ? t('loading.default') : t('admin.chartHeads.field.userPlaceholder')
				}
				isDisabled={disabled || usersLoading}
				isSearchable
				isClearable
				value={selectedUser}
				options={selectOptions}
				onChange={(_, option) => {
					const next = (option as { value?: number } | null)?.value;
					onChange({ ...value, userId: next != null ? Number(next) : null });
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
