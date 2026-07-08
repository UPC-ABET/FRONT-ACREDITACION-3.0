'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card } from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/Select';
import { useI18n } from '@/providers';

type SelectOption = { label: string; value: number };
type AnyOption = { label: string; value: string | number };
type SelectChangeHandler = (value: string | undefined, opt: AnyOption | AnyOption[] | null) => void;

interface ProjectsListFiltersProps {
	programOptions: SelectOption[];
	courseOptions: SelectOption[];
	groupOptions: SelectOption[];
	selectedProgram: SelectOption | null;
	selectedCourse: SelectOption | null;
	selectedGroup: SelectOption | null;
	selectedPeriodId: number | null;
	onProgramChange: SelectChangeHandler;
	onCourseChange: SelectChangeHandler;
	onGroupChange: SelectChangeHandler;
	onClearFilters: () => void;
}

export function ProjectsListFilters({
	programOptions,
	courseOptions,
	groupOptions,
	selectedProgram,
	selectedCourse,
	selectedGroup,
	selectedPeriodId,
	onProgramChange,
	onCourseChange,
	onGroupChange,
	onClearFilters,
}: ProjectsListFiltersProps) {
	const { t } = useI18n();

	return (
		<Card>
			<div className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
					<Select
						label={t('projects.list.filters.group')}
						options={groupOptions}
						value={selectedGroup}
						isClearable
						isSearchable
						isDisabled={!selectedProgram}
						onChange={onGroupChange}
					/>
				</div>

				{(selectedProgram || selectedCourse || selectedGroup) && (
					<div className="flex justify-end">
						<Button variant="secondary" onClick={onClearFilters}>
							<TrashIcon className="h-4 w-4" />
							{t('projects.list.clearFilters')}
						</Button>
					</div>
				)}
			</div>
		</Card>
	);
}
