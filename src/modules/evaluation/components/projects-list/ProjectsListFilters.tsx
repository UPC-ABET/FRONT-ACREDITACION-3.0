'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { Card } from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/Select';
import { buttonVariants } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';

type SelectOption = { label: string; value: number };
type AnyOption = { label: string; value: string | number };
type SelectChangeHandler = (value: string | undefined, opt: AnyOption | AnyOption[] | null) => void;

interface ProjectsListFiltersProps {
	programOptions: SelectOption[];
	courseOptions: SelectOption[];
	selectedProgram: SelectOption | null;
	selectedCourse: SelectOption | null;
	selectedPeriodId: number | null;
	onProgramChange: SelectChangeHandler;
	onCourseChange: SelectChangeHandler;
	onClearFilters: () => void;
}

export function ProjectsListFilters({
	programOptions,
	courseOptions,
	selectedProgram,
	selectedCourse,
	selectedPeriodId,
	onProgramChange,
	onCourseChange,
	onClearFilters,
}: ProjectsListFiltersProps) {
	const { t } = useI18n();

	return (
		<Card>
			<div className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Select
						label={t('projects.list.filters.program')}
						options={programOptions}
						value={selectedProgram}
						isClearable
						isDisabled={!selectedPeriodId}
						onChange={onProgramChange}
					/>
					<Select
						label={t('projects.list.filters.course')}
						options={courseOptions}
						value={selectedCourse}
						isClearable
						isDisabled={!selectedProgram}
						onChange={onCourseChange}
					/>
				</div>

				{(selectedProgram || selectedCourse) && (
					<div className="flex justify-end">
						<button
							type="button"
							onClick={onClearFilters}
							className={cn(
								buttonVariants({ variant: 'warning', size: 'md' }),
								'inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-red-100 hover:text-red-500',
							)}>
							<TrashIcon className="h-4 w-4" />
							{t('projects.list.clearFilters')}
						</button>
					</div>
				)}
			</div>
		</Card>
	);
}
