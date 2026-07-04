'use client';

import React, { useMemo, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Checkbox,
	Input,
	LoadingState,
} from '@/shared/components';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { toStr, type CourseGroup } from './lcfcConfigurationHelpers';

interface LCFCGenerateDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly loadingSections: boolean;
	readonly courseGroups: CourseGroup[];
	readonly selectedSectionIds: Set<number>;
	readonly allSectionsSelected: boolean;
	readonly someSectionsSelected: boolean;
	readonly generating: boolean;
	readonly onToggleAll: () => void;
	readonly onToggleCourse: (group: CourseGroup) => void;
	readonly onToggleSection: (sectionId: number) => void;
	readonly onConfirm: () => void;
}

export function LCFCGenerateDialog({
	open,
	onOpenChange,
	loadingSections,
	courseGroups,
	selectedSectionIds,
	allSectionsSelected,
	someSectionsSelected,
	generating,
	onToggleAll,
	onToggleCourse,
	onToggleSection,
	onConfirm,
}: LCFCGenerateDialogProps) {
	const { t } = useI18n();
	const [search, setSearch] = useState('');

	const filteredGroups = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return courseGroups;
		return courseGroups.filter(
			(group) =>
				toStr(group.courseName, '').toLowerCase().includes(term) ||
				group.sections.some((s) => toStr(s.sectionCode, '').toLowerCase().includes(term)),
		);
	}, [courseGroups, search]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('surveys.lcfc.config.generateDialogTitle')}</DialogTitle>
				</DialogHeader>
				{!loadingSections && courseGroups.length > 0 && (
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={t('surveys.lcfc.config.searchCoursePlaceholder')}
					/>
				)}
				<div className="space-y-3 py-2 max-h-96 overflow-y-auto">
					{loadingSections ? (
						<LoadingState size="sm" />
					) : courseGroups.length === 0 ? (
						<p className="text-sm text-zinc-500 italic">
							{t('surveys.lcfc.config.noSectionsAvailable')}
						</p>
					) : filteredGroups.length === 0 ? (
						<p className="text-sm text-zinc-500 italic">
							{t('surveys.lcfc.config.noSearchResults')}
						</p>
					) : (
						<>
							{/* Select-all row */}
							<label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-zinc-200">
								<Checkbox
									checked={allSectionsSelected}
									indeterminate={someSectionsSelected}
									onCheckedChange={onToggleAll}
								/>
								<span className="text-sm font-medium">{t('surveys.lcfc.config.selectAll')}</span>
							</label>

							{/* Course groups */}
							{filteredGroups.map((group) => {
								const groupAllSelected = group.sections.every((s) =>
									selectedSectionIds.has(s.courseSectionId),
								);
								const groupSomeSelected =
									group.sections.some((s) => selectedSectionIds.has(s.courseSectionId)) &&
									!groupAllSelected;
								return (
									<div key={group.courseId} className="space-y-1.5">
										<label className="flex items-center gap-2 cursor-pointer">
											<Checkbox
												checked={groupAllSelected}
												indeterminate={groupSomeSelected}
												onCheckedChange={() => onToggleCourse(group)}
											/>
											<span className="text-sm font-semibold">{group.courseName}</span>
										</label>
										<div className="ml-6 flex flex-wrap gap-x-4 gap-y-1.5">
											{group.sections.map((section) => (
												<label
													key={section.courseSectionId}
													className="flex items-center gap-1.5 cursor-pointer">
													<Checkbox
														checked={selectedSectionIds.has(section.courseSectionId)}
														onCheckedChange={() => onToggleSection(section.courseSectionId)}
													/>
													<span className="text-sm text-zinc-600">
														{toStr(section.sectionCode, '—')}
													</span>
												</label>
											))}
										</div>
									</div>
								);
							})}
						</>
					)}
				</div>
				<DialogFooter showCloseButton>
					<Button
						onClick={onConfirm}
						disabled={
							loadingSections ||
							selectedSectionIds.size === 0 ||
							generating ||
							courseGroups.length === 0
						}
						loading={generating}>
						<SparklesIcon className="h-4 w-4 mr-1" />
						{t('surveys.lcfc.config.generateConfirm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
