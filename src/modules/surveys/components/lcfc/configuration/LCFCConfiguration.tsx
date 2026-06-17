'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
	Select,
	Button,
	Badge,
	DataTable,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Input,
	TextArea,
	Toggle,
	Toast,
	Checkbox,
	LoadingState,
} from '@/shared/components';
import {
	SparklesIcon,
	DocumentDuplicateIcon,
	PencilSquareIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { useLCFCConfiguration, useLCFCCycles, useLCFCAvailableSections } from '../../../hooks';
import type { AvailableSection, LCFCCourse } from '../../../types';

interface LCFCConfigurationProps {
	readonly programId: number;
}

interface EditForm {
	nameEs: string;
	nameEn: string;
	descriptionEs: string;
	descriptionEn: string;
	isActive: boolean;
}

interface CourseGroup {
	courseId: number;
	courseName: string;
	sections: AvailableSection[];
}

/** Safely extract a display string from a value that may be I18nText at runtime. */
function toStr(value: unknown, fallback = ''): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		const s = obj.es ?? obj.en ?? '';
		if (typeof s === 'string') return s;
	}
	return fallback;
}

export function LCFCConfiguration({ programId }: LCFCConfigurationProps) {
	const { t } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();
	const { cycles, load: loadCycles } = useLCFCCycles();
	const {
		courses,
		loading,
		error,
		load: loadConfig,
		generate,
		clone,
		update,
		remove,
	} = useLCFCConfiguration();
	const {
		sections: availableSections,
		loading: loadingSections,
		load: loadSections,
	} = useLCFCAvailableSections();

	const [originCycle, setOriginCycle] = useState<{ label: string; value: number } | null>(null);
	const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
	const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [selectedSectionIds, setSelectedSectionIds] = useState<Set<number>>(new Set());
	const [editing, setEditing] = useState<LCFCCourse | null>(null);
	const [editForm, setEditForm] = useState<EditForm>({
		nameEs: '',
		nameEn: '',
		descriptionEs: '',
		descriptionEn: '',
		isActive: true,
	});
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		if (!academicPeriodId) return;
		loadConfig(academicPeriodId, programId);
	}, [academicPeriodId, programId, loadConfig]);

	useEffect(() => {
		if (cloneDialogOpen) loadCycles(null);
	}, [cloneDialogOpen, loadCycles]);

	useEffect(() => {
		if (generateDialogOpen && academicPeriodId && programId) {
			loadSections(programId, academicPeriodId);
		}
	}, [generateDialogOpen, academicPeriodId, programId, loadSections]);

	// Pre-select all sections when the list loads
	useEffect(() => {
		setSelectedSectionIds(new Set(availableSections.map((s) => s.courseSectionId)));
	}, [availableSections]);

	useEffect(() => {
		if (error) {
			setGenerating(false);
			setToast({ open: true, type: 'error', msg: tryTranslate(t, error) });
		}
	}, [error, t]);

	const courseGroups = useMemo<CourseGroup[]>(() => {
		const map = new Map<number, CourseGroup>();
		for (const s of availableSections) {
			if (!map.has(s.courseId)) {
				map.set(s.courseId, {
					courseId: s.courseId,
					courseName: toStr(s.courseName, `Course ${s.courseId}`),
					sections: [],
				});
			}
			map.get(s.courseId)!.sections.push(s);
		}
		return [...map.values()];
	}, [availableSections]);

	function openGenerateDialog() {
		if (!programId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectProgram') });
			return;
		}
		setGenerateDialogOpen(true);
	}

	function toggleSection(sectionId: number) {
		setSelectedSectionIds((prev) => {
			const next = new Set(prev);
			if (next.has(sectionId)) next.delete(sectionId);
			else next.add(sectionId);
			return next;
		});
	}

	function toggleCourse(group: CourseGroup) {
		const allSelected = group.sections.every((s) => selectedSectionIds.has(s.courseSectionId));
		setSelectedSectionIds((prev) => {
			const next = new Set(prev);
			if (allSelected) {
				group.sections.forEach((s) => next.delete(s.courseSectionId));
			} else {
				group.sections.forEach((s) => next.add(s.courseSectionId));
			}
			return next;
		});
	}

	function toggleAll() {
		if (selectedSectionIds.size === availableSections.length) {
			setSelectedSectionIds(new Set());
		} else {
			setSelectedSectionIds(new Set(availableSections.map((s) => s.courseSectionId)));
		}
	}

	function handleGenerateConfirm() {
		if (!academicPeriodId || !modalityTypeId || !programId) return;
		setGenerating(true);
		const ids = [...selectedSectionIds];
		// Omit the array when all sections are selected — backend generates for all
		const courseSectionIds = ids.length === availableSections.length ? undefined : ids;
		generate(modalityTypeId, academicPeriodId, programId, courseSectionIds, (result) => {
			setGenerating(false);
			setGenerateDialogOpen(false);
			const msg = t('surveys.lcfc.config.toastGeneratedCounts')
				.replace('{{created}}', String(result.created))
				.replace('{{skipped}}', String(result.skipped));
			setToast({ open: true, type: 'success', msg });
			loadConfig(academicPeriodId, programId);
		});
	}

	function handleClone() {
		if (!academicPeriodId || !originCycle) return;
		clone(originCycle.value, academicPeriodId, programId, () => {
			setCloneDialogOpen(false);
			setToast({ open: true, type: 'success', msg: t('surveys.lcfc.config.toastCloned') });
			loadConfig(academicPeriodId, programId);
		});
	}

	function openEdit(course: LCFCCourse) {
		setEditing(course);
		setEditForm({
			nameEs: course.name.es ?? '',
			nameEn: course.name.en ?? '',
			descriptionEs: course.description.es ?? '',
			descriptionEn: course.description.en ?? '',
			isActive: course.isActive,
		});
	}

	function handleSaveEdit() {
		if (!editing) return;
		setSaving(true);
		update(
			editing.id,
			{
				userOutcomeName: { es: editForm.nameEs, en: editForm.nameEn || editForm.nameEs },
				userOutcomeDescription: {
					es: editForm.descriptionEs,
					en: editForm.descriptionEn || editForm.descriptionEs,
				},
				isActive: editForm.isActive,
			},
			() => {
				setSaving(false);
				setEditing(null);
				setToast({ open: true, type: 'success', msg: t('surveys.lcfc.config.toastUpdated') });
				if (academicPeriodId) loadConfig(academicPeriodId, programId);
			},
		);
	}

	function handleDelete(id: number) {
		remove(id, () => {
			setDeleteId(null);
			setToast({ open: true, type: 'success', msg: t('surveys.lcfc.config.toastDeleted') });
			if (academicPeriodId) loadConfig(academicPeriodId, programId);
		});
	}

	const originCycleOptions = cycles
		.map((c) => ({ label: toStr(c.name, String(c.id)), value: c.id }))
		.filter((c) => c.value !== academicPeriodId);

	const columns: ColumnDef<LCFCCourse>[] = [
		{ accessorKey: 'code', header: t('surveys.lcfc.config.colCode') },
		{ accessorKey: 'courseName', header: t('surveys.lcfc.config.colCourse') },
		{
			accessorKey: 'isActive',
			header: t('surveys.lcfc.config.colStatus'),
			cell: ({ getValue }) => {
				// NOSONAR — cell renderers are render functions, not React components
				const isActive = getValue() as boolean;
				return (
					<Badge variant={isActive ? 'success' : 'outline'}>
						{isActive
							? t('surveys.lcfc.config.statusActive')
							: t('surveys.lcfc.config.statusInactive')}
					</Badge>
				);
			},
		},
		{
			id: 'actions',
			header: t('surveys.lcfc.config.colActions'),
			cell: ({ row }) => (
				// NOSONAR — cell renderers are render functions, not React components
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="surface"
						onClick={() => openEdit(row.original)}
						aria-label={t('surveys.lcfc.config.actionEdit')}>
						<PencilSquareIcon className="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						variant="warning"
						onClick={() => setDeleteId(row.original.id)}
						aria-label={t('surveys.lcfc.config.actionDelete')}>
						<TrashIcon className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	];

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	const allSectionsSelected =
		availableSections.length > 0 && selectedSectionIds.size === availableSections.length;
	const someSectionsSelected = selectedSectionIds.size > 0 && !allSectionsSelected;

	return (
		<div className="space-y-6">
			<div className="flex gap-2">
				<Button size="sm" onClick={openGenerateDialog} disabled={loading}>
					<SparklesIcon className="h-4 w-4 mr-1" />
					{t('surveys.lcfc.config.generateButton')}
				</Button>
				<Button size="sm" variant="surface" onClick={() => setCloneDialogOpen(true)}>
					<DocumentDuplicateIcon className="h-4 w-4 mr-1" />
					{t('surveys.lcfc.config.cloneButton')}
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={courses}
				title={t('surveys.lcfc.config.coursesTitle').replace('{{count}}', String(courses.length))}
			/>

			{/* Generate dialog — section picker */}
			<Dialog
				open={generateDialogOpen}
				onOpenChange={(open) => {
					if (!generating) setGenerateDialogOpen(open);
				}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.lcfc.config.generateDialogTitle')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 py-2 max-h-96 overflow-y-auto">
						{loadingSections ? (
							<LoadingState size="sm" />
						) : courseGroups.length === 0 ? (
							<p className="text-sm text-zinc-500 italic">
								{t('surveys.lcfc.config.noSectionsAvailable')}
							</p>
						) : (
							<>
								{/* Select-all row */}
								<label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-zinc-200">
									<Checkbox
										checked={allSectionsSelected}
										indeterminate={someSectionsSelected}
										onCheckedChange={toggleAll}
									/>
									<span className="text-sm font-medium">{t('surveys.lcfc.config.selectAll')}</span>
								</label>

								{/* Course groups */}
								{courseGroups.map((group) => {
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
													onCheckedChange={() => toggleCourse(group)}
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
															onCheckedChange={() => toggleSection(section.courseSectionId)}
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
							onClick={handleGenerateConfirm}
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

			{/* Clone dialog */}
			<Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.lcfc.config.cloneDialogTitle')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<p className="text-sm text-zinc-600">{t('surveys.lcfc.config.cloneDialogBody')}</p>
						<Select
							label={t('surveys.lcfc.config.originLabel')}
							options={originCycleOptions}
							value={originCycle}
							onChange={(_, val) => setOriginCycle(val as { label: string; value: number } | null)}
							placeholder={t('surveys.lcfc.config.originPlaceholder')}
						/>
					</div>
					<DialogFooter showCloseButton>
						<Button onClick={handleClone} disabled={!originCycle}>
							{t('surveys.lcfc.config.cloneConfirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit dialog */}
			<Dialog open={editing !== null} onOpenChange={() => setEditing(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.lcfc.config.editDialogTitle')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<Toggle
							label={t('surveys.lcfc.config.activeLabel')}
							checked={editForm.isActive}
							onChange={(checked) => setEditForm((f) => ({ ...f, isActive: checked }))}
						/>
						<Input
							label={t('surveys.lcfc.config.nameEsLabel')}
							value={editForm.nameEs}
							onChange={(e) => setEditForm((f) => ({ ...f, nameEs: e.target.value }))}
						/>
						<Input
							label={t('surveys.lcfc.config.nameEnLabel')}
							value={editForm.nameEn}
							onChange={(e) => setEditForm((f) => ({ ...f, nameEn: e.target.value }))}
						/>
						<TextArea
							label={t('surveys.lcfc.config.descriptionEsLabel')}
							value={editForm.descriptionEs}
							onChange={(e) => setEditForm((f) => ({ ...f, descriptionEs: e.target.value }))}
						/>
						<TextArea
							label={t('surveys.lcfc.config.descriptionEnLabel')}
							value={editForm.descriptionEn}
							onChange={(e) => setEditForm((f) => ({ ...f, descriptionEn: e.target.value }))}
						/>
					</div>
					<DialogFooter showCloseButton>
						<Button onClick={handleSaveEdit} disabled={saving || !editForm.nameEs.trim()}>
							{t('surveys.lcfc.config.save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete dialog */}
			<Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.lcfc.config.deleteDialogTitle')}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-zinc-600 py-2">{t('surveys.lcfc.config.deleteDialogBody')}</p>
					<DialogFooter showCloseButton>
						<Button variant="warning" onClick={() => deleteId !== null && handleDelete(deleteId)}>
							{t('surveys.lcfc.config.deleteConfirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
