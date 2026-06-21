'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, DataTable, Toast } from '@/shared/components';
import { SparklesIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { useLCFCConfiguration, useLCFCAvailableSections } from '../../../hooks';
import { getLCFCSectionCommissions, setLCFCDeadline } from '../../../services';
import type { LCFCCourse, LCFCSectionCommission } from '../../../types';
import { toStr, type CourseGroup } from './lcfcConfigurationHelpers';
import { buildLCFCConfigurationColumns } from './lcfcConfigurationColumns';
import { LCFCDeadlineField } from './LCFCDeadlineField';
import { LCFCGenerateDialog } from './LCFCGenerateDialog';
import { LCFCCloneDialog } from './LCFCCloneDialog';
import { LCFCEditCourseDialog } from './LCFCEditCourseDialog';
import { LCFCDeleteDialog } from './LCFCDeleteDialog';

interface LCFCConfigurationProps {
	readonly programId: number;
}

export function LCFCConfiguration({ programId }: LCFCConfigurationProps) {
	const { t } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();
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

	const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
	const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [selectedSectionIds, setSelectedSectionIds] = useState<Set<number>>(new Set());
	const [editing, setEditing] = useState<LCFCCourse | null>(null);
	const [editActive, setEditActive] = useState(true);
	const [sectionCommissions, setSectionCommissions] = useState<LCFCSectionCommission[]>([]);
	const [loadingCommissions, setLoadingCommissions] = useState(false);
	const [selectedCommissionId, setSelectedCommissionId] = useState<number | null>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [saving, setSaving] = useState(false);
	const [deadlineDate, setDeadlineDate] = useState('');
	const [savingDeadline, setSavingDeadline] = useState(false);
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
		if (generateDialogOpen && academicPeriodId && programId) {
			loadSections(programId);
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

	// Seed the deadline field from the stored config deadline (any course carries it).
	useEffect(() => {
		const stored = courses.find((c) => c.maxRegisterDate)?.maxRegisterDate;
		if (!stored) return;
		const d = new Date(stored);
		if (Number.isNaN(d.getTime())) return;
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		setDeadlineDate(`${yyyy}-${mm}-${dd}`);
	}, [courses]);

	function handleSaveDeadline() {
		if (!academicPeriodId || !programId || !deadlineDate) {
			setToast({ open: true, type: 'error', msg: t('surveys.lcfc.config.deadlineRequired') });
			return;
		}
		setSavingDeadline(true);
		// Anchor to end of the selected day in the user's timezone (see notifications view).
		const iso = new Date(`${deadlineDate}T23:59:59`).toISOString();
		setLCFCDeadline(programId, academicPeriodId, iso)
			.then(() => {
				setToast({ open: true, type: 'success', msg: t('surveys.lcfc.config.deadlineSaved') });
				loadConfig(academicPeriodId, programId);
			})
			.catch((e) => setToast({ open: true, type: 'error', msg: (e as Error).message }))
			.finally(() => setSavingDeadline(false));
	}

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
		if (!academicPeriodId || !programId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		clone(academicPeriodId, programId, (result) => {
			setCloneDialogOpen(false);
			const msg = t('surveys.lcfc.config.toastClonedCounts')
				.replace('{{generated}}', String(result.generated))
				.replace('{{skipped}}', String(result.skipped))
				.replace('{{statusCopied}}', String(result.statusCopied));
			setToast({ open: true, type: 'success', msg });
			loadConfig(academicPeriodId, programId);
		});
	}

	function openEdit(course: LCFCCourse) {
		setEditing(course);
		setEditActive(course.isActive);
		setSelectedCommissionId(course.commissionId ?? null);
		setSectionCommissions([]);
		if (course.courseSectionId) {
			setLoadingCommissions(true);
			getLCFCSectionCommissions(course.courseSectionId, course.programId)
				.then((commissions) => {
					setSectionCommissions(commissions);
					// When several commissions exist, default to EAC (Engineering Accreditation
					// Commission) — matching by commission type first, then code/name — and fall
					// back to the first one.
					const isEac = (c: LCFCSectionCommission) =>
						/eac/i.test(c.typeCode ?? '') ||
						/eac/i.test(c.typeName ?? '') ||
						/eac/i.test(c.code) ||
						/eac/i.test(c.name);
					const preferred = commissions.find(isEac) ?? commissions[0];
					if (!course.commissionId && commissions.length > 0)
						setSelectedCommissionId(preferred.commissionId);
					else if (commissions.length === 1) setSelectedCommissionId(commissions[0].commissionId);
				})
				.catch(() => setSectionCommissions([]))
				.finally(() => setLoadingCommissions(false));
		}
	}

	function handleSaveEdit() {
		if (!editing) return;
		setSaving(true);
		update(
			editing.id,
			{
				isActive: editActive,
				...(selectedCommissionId ? { commissionId: selectedCommissionId } : {}),
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

	const columns = buildLCFCConfigurationColumns({ t, onEdit: openEdit, onDelete: setDeleteId });

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

			<LCFCDeadlineField
				deadlineDate={deadlineDate}
				savingDeadline={savingDeadline}
				onDeadlineDateChange={setDeadlineDate}
				onSave={handleSaveDeadline}
			/>

			<DataTable
				columns={columns}
				data={courses}
				title={t('surveys.lcfc.config.coursesTitle').replace('{{count}}', String(courses.length))}
			/>

			{/* Generate dialog — section picker */}
			<LCFCGenerateDialog
				open={generateDialogOpen}
				onOpenChange={(open) => {
					if (!generating) setGenerateDialogOpen(open);
				}}
				loadingSections={loadingSections}
				courseGroups={courseGroups}
				selectedSectionIds={selectedSectionIds}
				allSectionsSelected={allSectionsSelected}
				someSectionsSelected={someSectionsSelected}
				generating={generating}
				onToggleAll={toggleAll}
				onToggleCourse={toggleCourse}
				onToggleSection={toggleSection}
				onConfirm={handleGenerateConfirm}
			/>

			{/* Clone dialog — auto-resolves previous period, no selection needed */}
			<LCFCCloneDialog
				open={cloneDialogOpen}
				onOpenChange={setCloneDialogOpen}
				loading={loading}
				onConfirm={handleClone}
			/>

			{/* Edit dialog */}
			<LCFCEditCourseDialog
				editing={editing}
				onOpenChange={() => setEditing(null)}
				editActive={editActive}
				onEditActiveChange={setEditActive}
				loadingCommissions={loadingCommissions}
				sectionCommissions={sectionCommissions}
				selectedCommissionId={selectedCommissionId}
				onSelectedCommissionChange={setSelectedCommissionId}
				saving={saving}
				onSave={handleSaveEdit}
			/>

			{/* Delete dialog */}
			<LCFCDeleteDialog
				deleteId={deleteId}
				onOpenChange={() => setDeleteId(null)}
				onConfirm={() => deleteId !== null && handleDelete(deleteId)}
			/>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
