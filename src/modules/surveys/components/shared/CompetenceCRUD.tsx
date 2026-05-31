'use client';

import React, { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
	DataTable,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Input,
	TextArea,
	Toast,
} from '@/shared/components';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import type { CompetenceConfig, CompetenceFormData } from '../../types';
import { competenceSchema } from '../../schemas/competenceSchema';
import { MIN_PERFORMANCE_LEVEL, MAX_PERFORMANCE_LEVEL } from '../../constants/competence';

interface CompetenceCRUDProps {
	cycleId: number;
	competences: CompetenceConfig[];
	loading: boolean;
	error: string | null;
	onLoad: (cycleId: number) => void;
	onSave: (data: CompetenceFormData, onSuccess: () => void) => void;
	onDelete: (id: number, onSuccess: () => void) => void;
	onClone?: (
		params: {
			sourceProgramId: number;
			sourcePeriodId: number;
			targetProgramId: number;
			targetPeriodId: number;
		},
		onSuccess: () => void,
	) => void;
	showCloneOption?: boolean;
}

const EMPTY_FORM: Omit<CompetenceFormData, 'academicPeriodId' | 'school'> = {
	id: 0,
	generalCompetence: '',
	specificCompetence: '',
	description: '',
	performanceLevel: 3,
};

export function CompetenceCRUD({
	cycleId,
	competences,
	loading,
	error,
	onLoad,
	onSave,
	onDelete,
}: CompetenceCRUDProps) {
	const { t } = useI18n();
	const [modalOpen, setModalOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [form, setForm] = useState(EMPTY_FORM);
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		if (cycleId) onLoad(cycleId);
	}, [cycleId, onLoad]);

	function openAdd() {
		setForm(EMPTY_FORM);
		setModalOpen(true);
	}

	function openEdit(row: CompetenceConfig) {
		setForm({
			id: row.id,
			generalCompetence: row.generalCompetence,
			specificCompetence: row.specificCompetence,
			description: row.description,
			performanceLevel: row.performanceLevel,
		});
		setModalOpen(true);
	}

	function handleSave() {
		const parsed = competenceSchema.safeParse(form);
		if (!parsed.success) {
			setToast({ open: true, type: 'error', msg: t(parsed.error.issues[0].message) });
			return;
		}
		setSaving(true);
		onSave({ ...form, academicPeriodId: cycleId, school: '1' }, () => {
			setSaving(false);
			setModalOpen(false);
			setToast({ open: true, type: 'success', msg: t('surveys.competence.toast.saved') });
			onLoad(cycleId);
		});
		setSaving(false);
	}

	function handleDelete(id: number) {
		onDelete(id, () => {
			setDeleteId(null);
			setToast({ open: true, type: 'success', msg: t('surveys.competence.toast.deleted') });
			onLoad(cycleId);
		});
	}

	const columns: ColumnDef<CompetenceConfig>[] = [
		{
			accessorKey: 'generalCompetence',
			header: t('surveys.competence.table.general'),
		},
		{
			accessorKey: 'specificCompetence',
			header: t('surveys.competence.table.specific'),
		},
		{
			accessorKey: 'description',
			header: t('surveys.competence.table.description'),
			cell: ({ getValue }) => (
				<span className="max-w-xs block truncate">{getValue() as string}</span>
			),
		},
		{
			accessorKey: 'performanceLevel',
			header: t('surveys.competence.table.level'),
			cell: ({ getValue }) => (
				<span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
					{getValue() as number}
				</span>
			),
		},
		{
			id: 'actions',
			header: t('surveys.competence.table.actions'),
			cell: ({ row }) => (
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="surface"
						onClick={() => openEdit(row.original)}
						aria-label={t('surveys.competence.actions.edit')}>
						<PencilSquareIcon className="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						variant="warning"
						onClick={() => setDeleteId(row.original.id)}
						aria-label={t('surveys.competence.actions.delete')}>
						<TrashIcon className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-4">
			{error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

			<DataTable
				columns={columns}
				data={competences}
				title={t('surveys.competence.table.title')}
				actions={[
					{
						label: t('surveys.competence.add'),
						onClick: openAdd,
						icon: <PlusIcon className="h-4 w-4" />,
					},
				]}
			/>

			{/* Add / Edit modal */}
			<Dialog open={modalOpen} onOpenChange={setModalOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{form.id === 0
								? t('surveys.competence.modal.addTitle')
								: t('surveys.competence.modal.editTitle')}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-3 py-2">
						<Input
							label={t('surveys.competence.modal.generalLabel')}
							value={form.generalCompetence}
							onChange={(e) => setForm({ ...form, generalCompetence: e.target.value })}
							placeholder={t('surveys.competence.modal.generalPlaceholder')}
						/>
						<Input
							label={t('surveys.competence.modal.specificLabel')}
							value={form.specificCompetence}
							onChange={(e) => setForm({ ...form, specificCompetence: e.target.value })}
							placeholder={t('surveys.competence.modal.specificPlaceholder')}
						/>
						<TextArea
							label={t('surveys.competence.modal.descriptionLabel')}
							value={form.description}
							onChange={(e) => setForm({ ...form, description: e.target.value })}
							placeholder={t('surveys.competence.modal.descriptionPlaceholder')}
							rows={3}
						/>
						<div>
							<label className="font-medium text-xs mb-2 text-zinc-700 block">
								{t('surveys.competence.modal.levelLabel')
									.replace('{{min}}', String(MIN_PERFORMANCE_LEVEL))
									.replace('{{max}}', String(MAX_PERFORMANCE_LEVEL))}
							</label>
							<input
								type="number"
								min={MIN_PERFORMANCE_LEVEL}
								max={MAX_PERFORMANCE_LEVEL}
								value={form.performanceLevel}
								onChange={(e) =>
									setForm({
										...form,
										performanceLevel: Math.min(
											MAX_PERFORMANCE_LEVEL,
											Math.max(MIN_PERFORMANCE_LEVEL, Number(e.target.value)),
										),
									})
								}
								className="w-24 h-9 rounded-md border border-zinc-200 px-3 text-sm focus:outline-none focus:border-red-500"
							/>
						</div>
					</div>

					<DialogFooter showCloseButton>
						<Button onClick={handleSave} disabled={saving}>
							{saving ? t('surveys.competence.modal.saving') : t('surveys.competence.modal.save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.competence.modal.deleteTitle')}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-zinc-600 py-2">{t('surveys.competence.modal.deleteBody')}</p>
					<DialogFooter showCloseButton>
						<Button variant="warning" onClick={() => deleteId !== null && handleDelete(deleteId)}>
							{t('surveys.competence.modal.delete')}
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
