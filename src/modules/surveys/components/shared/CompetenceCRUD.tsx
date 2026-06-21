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
	Select,
	Toggle,
	Toast,
} from '@/shared/components';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import type { CompetenceConfig, CompetenceFormData } from '../../types';
import { competenceSchema } from '../../schemas/competenceSchema';
import { MIN_PERFORMANCE_LEVEL, MAX_PERFORMANCE_LEVEL } from '../../constants/competence';
import { listGRAOutcomes } from '../../services/graService';

// One entry per commission returned by the outcomes endpoint
interface CommissionGroup {
	commissionId: number;
	commissionName: string;
	outcomes: Array<{ outcomeId: number; outcomeCode: string; outcomeName: string }>;
}

export interface CompetenceCRUDProps {
	cycleId: number;
	programId?: number;
	/** 'general' shows non-linked items; 'specific' shows items linked to a real outcome */
	competenceType: 'general' | 'specific';
	/** Show the "¿Es para carrera ajena?" toggle — typically only PPP */
	showExternalToggle?: boolean;
	competences: CompetenceConfig[];
	loading: boolean;
	error: string | null;
	onLoad: (cycleId: number, programId?: number) => void;
	onSave: (data: CompetenceFormData, onSuccess: () => void) => void;
	onDelete: (id: number, onSuccess: () => void) => void;
}

const EMPTY_FORM: Omit<CompetenceFormData, 'academicPeriodId' | 'school'> = {
	id: 0,
	outcomeId: undefined,
	generalCompetence: '',
	specificCompetence: '',
	description: '',
	descriptionEn: '',
	performanceLevel: 1,
	isVisible: true,
	isExternal: false,
};

/** outcomeId === undefined or 1 means "no real outcome" → general */
function isSpecificItem(item: CompetenceConfig): boolean {
	return item.outcomeId != null && item.outcomeId !== 1;
}

export function CompetenceCRUD({
	cycleId,
	programId,
	competenceType,
	showExternalToggle = false,
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
	const [commissionGroups, setCommissionGroups] = useState<CommissionGroup[]>([]);
	// commissionId → outcomeId selected for that commission
	const [commissionSelections, setCommissionSelections] = useState<Record<number, number>>({});
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		if (cycleId) onLoad(cycleId, programId);
	}, [cycleId, programId, onLoad]);

	// Fetch outcomes grouped by commission whenever program/cycle changes
	useEffect(() => {
		if (!programId || !cycleId) {
			setCommissionGroups([]);
			return;
		}
		listGRAOutcomes({ programId })
			.then((groups) => setCommissionGroups(groups))
			.catch(() => setCommissionGroups([]));
	}, [programId, cycleId]);

	// Filter the list by type
	const filteredItems = competences.filter((item) =>
		competenceType === 'specific' ? isSpecificItem(item) : !isSpecificItem(item),
	);

	function openAdd() {
		setForm(EMPTY_FORM);
		setCommissionSelections({});
		setModalOpen(true);
	}

	function openEdit(row: CompetenceConfig) {
		setForm({
			id: row.id,
			outcomeId: row.outcomeId,
			generalCompetence: row.generalCompetence,
			specificCompetence: row.specificCompetence,
			description: row.description,
			descriptionEn: row.descriptionEn ?? '',
			performanceLevel: row.performanceLevel,
			isVisible: row.isVisible ?? true,
			isExternal: row.isExternal ?? false,
		});
		// Pre-select the outcome in its commission group
		if (row.outcomeId && row.outcomeId !== 1) {
			const group = commissionGroups.find((g) =>
				g.outcomes.some((o) => o.outcomeId === row.outcomeId),
			);
			if (group) {
				setCommissionSelections({ [group.commissionId]: row.outcomeId });
			} else {
				setCommissionSelections({});
			}
		} else {
			setCommissionSelections({});
		}
		setModalOpen(true);
	}

	function handleSave() {
		// Merge commission selection into form for validation
		const firstOutcomeId = Object.values(commissionSelections)[0];
		const formToValidate = {
			...form,
			outcomeId: firstOutcomeId ?? form.outcomeId,
		};

		const parsed = competenceSchema.safeParse(formToValidate);
		if (!parsed.success) {
			setToast({ open: true, type: 'error', msg: t(parsed.error.issues[0].message) });
			return;
		}
		setSaving(true);

		const selectedOutcomeIds = Object.values(commissionSelections).filter(Boolean);
		const baseData: CompetenceFormData = {
			...form,
			academicPeriodId: cycleId,
			school: '1',
			programId,
		};

		if (selectedOutcomeIds.length === 0) {
			// General competency — no outcome link
			onSave({ ...baseData, outcomeId: undefined }, () => {
				setSaving(false);
				setModalOpen(false);
				setToast({ open: true, type: 'success', msg: t('surveys.competence.toast.saved') });
				onLoad(cycleId, programId);
			});
		} else {
			// Save one record per selected commission outcome
			let remaining = selectedOutcomeIds.length;
			let firstDone = false;
			selectedOutcomeIds.forEach((outcomeId) => {
				onSave({ ...baseData, outcomeId }, () => {
					remaining--;
					if (!firstDone) {
						firstDone = true;
						setSaving(false);
						setModalOpen(false);
						setToast({ open: true, type: 'success', msg: t('surveys.competence.toast.saved') });
					}
					if (remaining === 0) {
						onLoad(cycleId, programId);
					}
				});
			});
		}
	}

	function handleDelete(id: number) {
		onDelete(id, () => {
			setDeleteId(null);
			setToast({ open: true, type: 'success', msg: t('surveys.competence.toast.deleted') });
			onLoad(cycleId, programId);
		});
	}

	const isAdding = form.id === 0;
	const modalTitle = isAdding
		? competenceType === 'specific'
			? t('surveys.competence.modal.addSpecificTitle')
			: t('surveys.competence.modal.addTitle')
		: competenceType === 'specific'
			? t('surveys.competence.modal.editSpecificTitle')
			: t('surveys.competence.modal.editTitle');

	const columns: ColumnDef<CompetenceConfig>[] = [
		{
			accessorKey: 'performanceLevel',
			header: t('surveys.competence.table.order'),
			cell: ({ getValue }) => (
				<span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold">
					{getValue() as number}
				</span>
			),
		},
		{
			accessorKey: 'generalCompetence',
			header: t('surveys.competence.table.nameEs'),
		},
		{
			accessorKey: 'specificCompetence',
			header: t('surveys.competence.table.nameEn'),
		},
		{
			accessorKey: 'description',
			header: t('surveys.competence.table.description'),
			cell: ({ getValue }) => (
				<span className="max-w-xs block truncate text-sm text-zinc-500">
					{getValue() as string}
				</span>
			),
		},
		{
			id: 'visible',
			header: t('surveys.competence.table.visible'),
			cell: ({ row }) => (
				<span
					className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
						row.original.isVisible !== false
							? 'bg-green-50 text-green-700'
							: 'bg-zinc-100 text-zinc-500'
					}`}>
					{row.original.isVisible !== false
						? t('surveys.competence.visible.yes')
						: t('surveys.competence.visible.no')}
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

	// Show outcomes section: only when not external and commissions are available
	const showOutcomes = !form.isExternal && commissionGroups.length > 0;

	return (
		<div className="space-y-4">
			{error && (
				<p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
					{tryTranslate(t, error)}
				</p>
			)}

			<DataTable
				columns={columns}
				data={filteredItems}
				title={
					competenceType === 'specific'
						? t('surveys.competence.table.titleSpecific')
						: t('surveys.competence.table.titleGeneral')
				}
				actions={[
					{
						label: t('surveys.competence.add'),
						onClick: openAdd,
						icon: <PlusIcon className="h-4 w-4" />,
					},
				]}
			/>

			{/* Add / Edit dialog */}
			<Dialog
				open={modalOpen}
				onOpenChange={(open) => {
					if (!open && !saving) setModalOpen(false);
				}}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>{modalTitle}</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Orden + Visibilidad */}
						<div className="flex items-end gap-4">
							<div className="w-28">
								<label className="font-medium text-xs mb-1.5 text-zinc-700 block">
									{t('surveys.competence.modal.orderLabel')}
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
									className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm focus:outline-none focus:border-red-500"
								/>
							</div>
							<div className="flex-1 pb-0.5">
								<Toggle
									label={t('surveys.competence.modal.visibleLabel')}
									checked={form.isVisible ?? true}
									onChange={(checked) => setForm({ ...form, isVisible: checked })}
								/>
							</div>
						</div>

						{/* Nombre en español (required) */}
						<Input
							label={t('surveys.competence.modal.nameEsLabel')}
							value={form.generalCompetence}
							onChange={(e) => setForm({ ...form, generalCompetence: e.target.value })}
							placeholder={t('surveys.competence.modal.nameEsPlaceholder')}
							required
						/>

						{/* Descripción en español (required) */}
						<TextArea
							label={t('surveys.competence.modal.descriptionEsLabel')}
							value={form.description}
							onChange={(e) => setForm({ ...form, description: e.target.value })}
							placeholder={t('surveys.competence.modal.descriptionEsPlaceholder')}
							rows={2}
						/>

						{/* Nombre en inglés (required) */}
						<Input
							label={t('surveys.competence.modal.nameEnLabel')}
							value={form.specificCompetence}
							onChange={(e) => setForm({ ...form, specificCompetence: e.target.value })}
							placeholder={t('surveys.competence.modal.nameEnPlaceholder')}
							required
						/>

						{/* Descripción en inglés (required) */}
						<TextArea
							label={t('surveys.competence.modal.descriptionEnLabel')}
							value={form.descriptionEn ?? ''}
							onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
							placeholder={t('surveys.competence.modal.descriptionEnPlaceholder')}
							rows={2}
						/>

						{/* ¿Es para carrera ajena? (PPP only) */}
						{showExternalToggle && (
							<div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
								<Toggle
									label={t('surveys.competence.modal.externalLabel')}
									checked={form.isExternal ?? false}
									onChange={(checked) => {
										setForm({ ...form, isExternal: checked });
										if (checked) setCommissionSelections({});
									}}
								/>
							</div>
						)}

						{/* Outcomes por comisión (ocultos si es externa o no hay programa) */}
						{showOutcomes && (
							<div className="space-y-3">
								<p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
									{t('surveys.competence.modal.outcomesSection')}
								</p>
								{commissionGroups.map((group) => {
									const options = group.outcomes.map((o) => ({
										value: o.outcomeId,
										label: `${o.outcomeCode}${o.outcomeName ? ` — ${o.outcomeName}` : ''}`,
									}));
									const selectedValue =
										options.find((o) => o.value === commissionSelections[group.commissionId]) ??
										null;
									return (
										<Select
											key={group.commissionId}
											name={`commission-${group.commissionId}`}
											label={`Outcome ${group.commissionName}`}
											placeholder={t('surveys.competence.modal.outcomePlaceholder')}
											isSearchable
											isClearable
											options={options}
											value={selectedValue}
											onChange={(_name, value) => {
												setCommissionSelections((prev) => {
													const next = { ...prev };
													if (value && !Array.isArray(value)) {
														next[group.commissionId] = Number(value.value);
													} else {
														delete next[group.commissionId];
													}
													return next;
												});
											}}
										/>
									);
								})}
							</div>
						)}
					</div>

					<DialogFooter showCloseButton>
						<Button onClick={handleSave} disabled={saving} loading={saving}>
							{t('surveys.competence.modal.save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation */}
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
