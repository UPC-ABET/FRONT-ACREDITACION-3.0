'use client';

import { useMemo } from 'react';
import {
	InformationCircleIcon,
	PlusIcon,
	TrashIcon,
	UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Button, Select, Title } from '@/shared/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import type { ChartHeadsFormErrors, DirectorFormValue, SchoolOption, UserOption } from '../types';
import { HeadFields } from './HeadFields';

interface Props {
	directors: DirectorFormValue[];
	onChange: (key: string, next: DirectorFormValue) => void;
	onAdd: () => void;
	onRemove: (key: string) => void;
	errors: ChartHeadsFormErrors['directors'];
	schoolOptions: SchoolOption[];
	schoolsLoading: boolean;
	userOptions: UserOption[];
	usersLoading: boolean;
	disabled?: boolean;
}

export function DirectorsSection({
	directors,
	onChange,
	onAdd,
	onRemove,
	errors,
	schoolOptions,
	schoolsLoading,
	userOptions,
	usersLoading,
	disabled,
}: Props) {
	const { t } = useI18n();

	const selectOptions = useMemo(
		() =>
			schoolOptions.map((school) => ({
				value: school.id,
				label: `${school.code} — ${school.name}`,
			})),
		[schoolOptions],
	);

	return (
		<section className="space-y-4">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<UserGroupIcon className="h-5 w-5 text-red-700" />
					<Title
						title={t('admin.chartHeads.directors.title')}
						className="[&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-zinc-900"
					/>
				</div>
				<Button variant="secondary" size="md" disabled={disabled} onClick={onAdd}>
					<PlusIcon className="h-5 w-5" />
					{t('admin.chartHeads.directors.add')}
				</Button>
			</header>

			<p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
				<InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
				{t('admin.chartHeads.directors.removeNote')}
			</p>

			{directors.length === 0 ? (
				<p className="rounded-lg border border-dashed border-zinc-200 bg-white py-10 text-center text-sm italic text-zinc-500">
					{t('admin.chartHeads.directors.empty')}
				</p>
			) : (
				<div className="space-y-4">
					{directors.map((director, index) => {
						const rowErrors = errors[director.key];
						const selectedSchool =
							selectOptions.find((option) => option.value === director.schoolId) ?? null;

						return (
							<div
								key={director.key}
								className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 sm:p-6">
								<div className="flex items-center justify-between gap-3">
									<span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
										{t('admin.chartHeads.directors.rowLabel').replace(
											'{number}',
											String(index + 1),
										)}
									</span>
									<Button
										variant="ghost"
										size="md"
										disabled={disabled}
										onClick={() => onRemove(director.key)}
										className="text-red-700 hover:bg-red-50">
										<TrashIcon className="h-5 w-5" />
										{t('admin.chartHeads.directors.remove')}
									</Button>
								</div>

								<Select
									label={t('admin.chartHeads.field.school')}
									placeholder={
										schoolsLoading
											? t('loading.default')
											: t('admin.chartHeads.field.schoolPlaceholder')
									}
									isDisabled={disabled || schoolsLoading}
									isSearchable
									value={selectedSchool}
									options={selectOptions}
									error={rowErrors?.schoolId ? tryTranslate(t, rowErrors.schoolId) : undefined}
									onChange={(_, option) => {
										const next = (option as { value?: number } | null)?.value;
										onChange(director.key, {
											...director,
											schoolId: next != null ? Number(next) : null,
										});
									}}
								/>

								<HeadFields
									value={director}
									onChange={(next) => onChange(director.key, { ...director, ...next })}
									errors={rowErrors}
									userOptions={userOptions}
									usersLoading={usersLoading}
									disabled={disabled}
								/>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
