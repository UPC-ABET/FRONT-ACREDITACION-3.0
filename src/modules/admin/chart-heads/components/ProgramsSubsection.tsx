'use client';

import { useMemo } from 'react';
import { AcademicCapIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { usedProgramIds } from '../schemas';
import type {
	DirectorFormValue,
	ProgramFormErrors,
	ProgramFormValue,
	ProgramOption,
	UserOption,
} from '../types';
import { HeadFields } from './HeadFields';

interface Props {
	directors: DirectorFormValue[];
	directorKey: string;
	programs: ProgramFormValue[];
	onChange: (key: string, next: ProgramFormValue) => void;
	onAdd: () => void;
	onRemove: (key: string) => void;
	errors: Record<string, ProgramFormErrors>;
	programOptions: ProgramOption[];
	programsLoading: boolean;
	userOptions: UserOption[];
	usersLoading: boolean;
	disabled?: boolean;
}

export function ProgramsSubsection({
	directors,
	directorKey,
	programs,
	onChange,
	onAdd,
	onRemove,
	errors,
	programOptions,
	programsLoading,
	userOptions,
	usersLoading,
	disabled,
}: Props) {
	const { t } = useI18n();

	const selectOptions = useMemo(
		() =>
			programOptions.map((program) => ({
				value: program.id,
				label: `${program.code} — ${program.name}`,
			})),
		[programOptions],
	);

	return (
		<div className="space-y-3 rounded-md border border-zinc-100 bg-zinc-50/60 p-4">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<AcademicCapIcon className="h-4 w-4 text-red-700" />
					<span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
						{t('admin.chartHeads.directors.programs.title')}
					</span>
				</div>
				<Button variant="secondary" size="sm" disabled={disabled} onClick={onAdd}>
					<PlusIcon className="h-4 w-4" />
					{t('admin.chartHeads.directors.programs.add')}
				</Button>
			</header>

			{programs.length === 0 ? (
				<p className="rounded-md border border-dashed border-zinc-200 bg-white py-6 text-center text-xs italic text-zinc-500">
					{t('admin.chartHeads.directors.programs.empty')}
				</p>
			) : (
				<div className="space-y-3">
					{programs.map((program, index) => {
						const rowErrors = errors[program.key];
						const selectedProgram =
							selectOptions.find((option) => option.value === program.programId) ?? null;
						const excludedProgramIds = usedProgramIds(directors, directorKey, program.key);
						const rowSelectOptions = selectOptions.filter(
							(option) => !excludedProgramIds.has(option.value),
						);

						return (
							<div
								key={program.key}
								className="space-y-3 rounded-md border border-zinc-200 bg-white p-4">
								<div className="flex items-center justify-between gap-3">
									<span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
										{t('admin.chartHeads.directors.programs.rowLabel').replace(
											'{number}',
											String(index + 1),
										)}
									</span>
									<Button
										variant="ghost"
										size="sm"
										disabled={disabled}
										onClick={() => onRemove(program.key)}
										className="text-red-700 hover:bg-red-50">
										<TrashIcon className="h-4 w-4" />
										{t('admin.chartHeads.directors.programs.remove')}
									</Button>
								</div>

								<Select
									label={t('admin.chartHeads.field.program')}
									placeholder={
										programsLoading
											? t('loading.default')
											: t('admin.chartHeads.field.programPlaceholder')
									}
									isDisabled={disabled || programsLoading}
									isSearchable
									value={selectedProgram}
									options={rowSelectOptions}
									error={rowErrors?.programId ? tryTranslate(t, rowErrors.programId) : undefined}
									onChange={(_, option) => {
										const next = (option as { value?: number } | null)?.value;
										onChange(program.key, {
											...program,
											programId: next != null ? Number(next) : null,
										});
									}}
								/>

								<HeadFields
									value={program}
									onChange={(next) => onChange(program.key, { ...program, ...next })}
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
		</div>
	);
}
