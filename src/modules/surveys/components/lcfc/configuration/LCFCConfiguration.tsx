'use client';

import React, { useEffect, useState } from 'react';
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
} from '@/shared/components';
import {
	SparklesIcon,
	DocumentDuplicateIcon,
	PencilSquareIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { useLCFCConfiguration, useLCFCCycles } from '../../../hooks';
import type { LCFCCourse } from '../../../types';

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

export function LCFCConfiguration({ programId }: LCFCConfigurationProps) {
	const { t } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();
	// useLCFCCycles is kept only to populate the source-period selector in the clone dialog
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

	const [originCycle, setOriginCycle] = useState<{ label: string; value: number } | null>(null);
	const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
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

	// Load the period list only when the clone dialog opens
	useEffect(() => {
		if (cloneDialogOpen) loadCycles(null);
	}, [cloneDialogOpen, loadCycles]);

	useEffect(() => {
		if (error) setToast({ open: true, type: 'error', msg: tryTranslate(t, error) });
	}, [error, t]);

	function handleGenerate() {
		if (!academicPeriodId || !modalityTypeId) return;
		if (!programId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectProgram') });
			return;
		}
		generate(modalityTypeId, academicPeriodId, programId, () => {
			setToast({ open: true, type: 'success', msg: t('surveys.lcfc.config.toastGenerated') });
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
		.map((c) => ({ label: c.name, value: c.id }))
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

	return (
		<div className="space-y-6">
			<div className="flex gap-2">
				<Button size="sm" onClick={handleGenerate} disabled={loading}>
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
