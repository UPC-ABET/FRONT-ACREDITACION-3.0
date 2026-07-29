'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { TYPE_CODES } from '@/shared/constants';
import type { CompetenceConfig, CompetenceFormData } from '../../types';
import { competenceSchema } from '../../schemas/competenceSchema';
import { MIN_PERFORMANCE_LEVEL } from '../../constants/competence';
import { listGRAOutcomes } from '../../services/graService';

export interface CompetenceCRUDProps {
	cycleId: number;
	programId?: number;
	/** 'general' shows non-linked items; 'specific' shows items linked to a real outcome */
	competenceType: 'general' | 'specific';
	/** Show the "Is it for another program?" toggle — typically only PPP */
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

/**
 * A competence is "specific" when its outcomeId links to an outcome under a Específica commission
 * (per Carrera x Comisión). No outcome (undefined/1, the "no real outcome" sentinel) or an outcome
 * under a General commission (e.g. WASC) both count as general.
 */
function isSpecificItem(item: CompetenceConfig, specificOutcomeIds: Set<number>): boolean {
	return item.outcomeId != null && item.outcomeId !== 1 && specificOutcomeIds.has(item.outcomeId);
}

export function CompetenceCRUD({
	cycleId,
	programId,
	competenceType,
	showExternalToggle = false,
	competences,
	error,
	onLoad,
	onSave,
	onDelete,
}: CompetenceCRUDProps) {
	const { t, locale } = useI18n();
	const [modalOpen, setModalOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [form, setForm] = useState(EMPTY_FORM);
	const [saving, setSaving] = useState(false);
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

	const { data: allCommissionGroups = [] } = useQuery({
		queryKey: ['gra-outcomes', programId, cycleId],
		queryFn: () => listGRAOutcomes({ programId: programId as number }),
		enabled: Boolean(programId) && Boolean(cycleId),
	});

	// Each commission is configured (Carrera x Comisión) as General or Específica — only show the
	// outcomes of commissions matching this CRUD's type, so e.g. a General commission (WASC) never
	// surfaces under the "specific" picker and vice versa.
	const commissionTypeCode =
		competenceType === 'specific'
			? TYPE_CODES.COMMISSION_TYPE.SPECIFIC
			: TYPE_CODES.COMMISSION_TYPE.GENERAL;
	const commissionGroups = allCommissionGroups.filter(
		(g) => g.commissionTypeCode === commissionTypeCode,
	);

	const specificOutcomeIds = new Set(
		allCommissionGroups
			.filter((g) => g.commissionTypeCode === TYPE_CODES.COMMISSION_TYPE.SPECIFIC)
			.flatMap((g) => g.outcomes.map((o) => o.outcomeId)),
	);

	// Filter the list by type
	const filteredItems = competences.filter((item) =>
		competenceType === 'specific'
			? isSpecificItem(item, specificOutcomeIds)
			: !isSpecificItem(item, specificOutcomeIds),
	);

	function openAdd() {
		if (!programId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectProgram') });
			return;
		}
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
		if (!programId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectProgram') });
			return;
		}
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
			id: 'description',
			header: t('surveys.competence.table.description'),
			cell: ({ row }) => {
				// Follow the global language selector, falling back to the other language when empty
				const text =
					locale === 'en'
						? row.original.descriptionEn || row.original.description
						: row.original.description || row.original.descriptionEn;
				return <span className="max-w-xs block truncate text-zinc-500">{text}</span>;
			},
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
				<div className="flex items-center justify-end gap-1">
					<Button
						size="icon"
						variant="ghost"
						className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
						onClick={() => openEdit(row.original)}
						aria-label={t('surveys.competence.actions.edit')}>
						<PencilSquareIcon className="h-5 w-5" />
					</Button>
					<Button
						size="icon"
						variant="ghost"
						className="text-red-600 hover:bg-red-50"
						onClick={() => setDeleteId(row.original.id)}
						aria-label={t('surveys.competence.actions.delete')}>
						<TrashIcon className="h-5 w-5" />
					</Button>
				</div>
			),
			meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
		},
	];

	// Show the outcomes section for both types, but each only offers outcomes from commissions of
	// its own type (Específica vs General, per Carrera x Comisión) — see commissionGroups above.
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
						{/* Order + Visibility */}
						<div className="flex items-end gap-4">
							<div className="w-28">
								<label className="font-medium text-xs mb-1.5 text-zinc-700 block">
									{t('surveys.competence.modal.orderLabel')}
								</label>
								<input
									type="number"
									min={MIN_PERFORMANCE_LEVEL}
									value={form.performanceLevel}
									onChange={(e) =>
										setForm({
											...form,
											performanceLevel: Math.max(MIN_PERFORMANCE_LEVEL, Number(e.target.value)),
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

						{/* Name in Spanish (required) */}
						<Input
							label={t('surveys.competence.modal.nameEsLabel')}
							value={form.generalCompetence}
							onChange={(e) => setForm({ ...form, generalCompetence: e.target.value })}
							placeholder={t('surveys.competence.modal.nameEsPlaceholder')}
							required
						/>

						{/* Description in Spanish (required) */}
						<TextArea
							label={t('surveys.competence.modal.descriptionEsLabel')}
							value={form.description}
							onChange={(e) => setForm({ ...form, description: e.target.value })}
							placeholder={t('surveys.competence.modal.descriptionEsPlaceholder')}
							rows={2}
						/>

						{/* Name in English (required) */}
						<Input
							label={t('surveys.competence.modal.nameEnLabel')}
							value={form.specificCompetence}
							onChange={(e) => setForm({ ...form, specificCompetence: e.target.value })}
							placeholder={t('surveys.competence.modal.nameEnPlaceholder')}
							required
						/>

						{/* Description in English (required) */}
						<TextArea
							label={t('surveys.competence.modal.descriptionEnLabel')}
							value={form.descriptionEn ?? ''}
							onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
							placeholder={t('surveys.competence.modal.descriptionEnPlaceholder')}
							rows={2}
						/>

						{/* "Is it for another program?" (PPP only) */}
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

						{/* Outcomes by commission (hidden when external or no program selected) */}
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
