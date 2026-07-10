'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	DeleteConfirmDialog,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogClose,
	I18nTextField,
	Input,
	PageHeader,
	TableEmptyState,
	TableErrorState,
	TableLoadingState,
} from '@/shared/components/ui';
import { Toggle } from '@/shared/components/ui/Toggle';
import { interpolate } from '@/shared/utils';
import { useI18n } from '@/providers';
import { TypeOption } from '@/modules/core';
import {
	useTypeGroups,
	useTypesByGroupCode,
	useSetCanEvaluate,
	useCreateType,
	useDeleteType,
} from '@/modules/core/hooks';
import { TYPE_GROUP_CODES } from '@/shared/constants';

interface EditState {
	id: number;
	canEvaluate: boolean;
	maxEvaluators: string;
}

export function EvaluatorTypesPage() {
	const { t, locale } = useI18n();
	const loc = locale as 'es' | 'en';

	const { data: typeGroups = [] } = useTypeGroups({ code: TYPE_GROUP_CODES.EVALUATOR_ROLE });
	const typeGroupId = typeGroups[0]?.id ?? null;

	const {
		data: types = [],
		isLoading,
		isError,
	} = useTypesByGroupCode(TYPE_GROUP_CODES.EVALUATOR_ROLE);

	// ── Edit modal ──────────────────────────────────────────────────────────
	const [editState, setEditState] = useState<EditState | null>(null);
	const [editError, setEditError] = useState<string | null>(null);

	const openEdit = (type: TypeOption) => {
		setEditState({
			id: type.id,
			canEvaluate: type.extra?.canEvaluate === true,
			maxEvaluators: String(type.extra?.maxEvaluators ?? ''),
		});
		setEditError(null);
	};

	const setCanEvaluateMutation = useSetCanEvaluate();
	const handleEditSave = () => {
		const max = editState!.maxEvaluators;
		if (max !== '' && (isNaN(Number(max)) || Number(max) < 1)) {
			setEditError(t('academicProjects.evaluators.maxInvalid'));
			return;
		}
		setCanEvaluateMutation.mutate(
			{
				id: editState!.id,
				body: {
					canEvaluate: editState!.canEvaluate,
					maxEvaluators: max !== '' ? Number(max) : undefined,
				},
			},
			{
				onSuccess: () => {
					setEditState(null);
					setEditError(null);
				},
				onError: () => setEditError(t('academicProjects.evaluators.editError')),
			},
		);
	};

	// ── Create modal ─────────────────────────────────────────────────────────
	const [createOpen, setCreateOpen] = useState(false);
	const [nameValue, setNameValue] = useState<Record<string, string>>({});
	const [createCanEvaluate, setCreateCanEvaluate] = useState(false);
	const [createMaxEvaluators, setCreateMaxEvaluators] = useState('');
	const [createError, setCreateError] = useState<string | null>(null);

	const openCreate = () => {
		setNameValue({});
		setCreateCanEvaluate(false);
		setCreateMaxEvaluators('');
		setCreateError(null);
		setCreateOpen(true);
	};

	const createTypeMutation = useCreateType();
	const handleCreate = () => {
		const hasName = Object.values(nameValue).some((v) => v.trim().length > 0);
		if (!hasName) {
			setCreateError(t('academicProjects.evaluators.nameRequired'));
			return;
		}
		const max = createMaxEvaluators;
		if (max !== '' && (isNaN(Number(max)) || Number(max) < 1)) {
			setCreateError(t('academicProjects.evaluators.maxInvalid'));
			return;
		}
		setCreateError(null);
		createTypeMutation.mutate(
			{
				typeGroupId: typeGroupId!,
				name: nameValue,
				extra: {
					canEvaluate: createCanEvaluate,
					...(max !== '' ? { maxEvaluators: Number(max) } : {}),
				},
			},
			{
				onSuccess: () => setCreateOpen(false),
				onError: () => setCreateError(t('academicProjects.evaluators.createError')),
			},
		);
	};

	// ── Delete modal ─────────────────────────────────────────────────────────
	const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const deleteTypeMutation = useDeleteType();
	const handleDelete = () => {
		if (!deleteTarget) return;
		deleteTypeMutation.mutate(deleteTarget.id, {
			onSuccess: () => {
				setDeleteTarget(null);
				setDeleteError(null);
			},
			onError: () => setDeleteError(t('academicProjects.evaluators.deleteError')),
		});
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('academicProjects.evaluators.title')}
				description={t('academicProjects.evaluators.description')}
				action={
					<Button variant="primary" onClick={openCreate} disabled={typeGroupId == null}>
						<PlusIcon className="h-4 w-4" />
						{t('academicProjects.evaluators.addButton')}
					</Button>
				}
			/>

			{isLoading ? (
				<TableLoadingState label={t('academicProjects.evaluators.loading')} />
			) : isError ? (
				<TableErrorState message={t('academicProjects.evaluators.error')} />
			) : types.length === 0 ? (
				<TableEmptyState message={t('academicProjects.evaluators.empty')} />
			) : (
				<Card>
					<ul className="-m-4 divide-y divide-zinc-100">
						{types.map((type) => {
							const canEvaluate = type.extra?.canEvaluate === true;
							const maxEvaluators = type.extra?.maxEvaluators as number | undefined;
							const label = type.name[loc] ?? type.name.es;
							return (
								<li key={type.id} className="flex items-center justify-between gap-4 px-6 py-4">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-medium text-zinc-800">{label}</span>
										<div className="flex items-center gap-3 text-xs text-zinc-400">
											<span className={canEvaluate ? 'text-emerald-600 font-medium' : ''}>
												{canEvaluate
													? t('academicProjects.evaluators.canGrade')
													: t('academicProjects.evaluators.readOnly')}
											</span>
											{maxEvaluators != null && (
												<span>
													{interpolate(t('academicProjects.evaluators.maxLabel'), {
														max: maxEvaluators,
													})}
												</span>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
											onClick={() => openEdit(type)}
											aria-label={t('academicProjects.evaluators.editTitle')}>
											<PencilSquareIcon className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="text-zinc-500 hover:bg-red-50 hover:text-red-600"
											onClick={() => {
												setDeleteTarget({ id: type.id, label });
												setDeleteError(null);
											}}
											aria-label={t('academicProjects.evaluators.deleteTitle')}>
											<TrashIcon className="h-4 w-4" />
										</Button>
									</div>
								</li>
							);
						})}
					</ul>
				</Card>
			)}

			{/* Edit modal */}
			<Dialog
				open={editState != null}
				onOpenChange={(open) => {
					if (!open) setEditState(null);
				}}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>{t('academicProjects.evaluators.editTitle')}</DialogTitle>
					</DialogHeader>
					{editState && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-zinc-700">
									{t('academicProjects.evaluators.canGradeLabel')}
								</span>
								<Toggle
									checked={editState.canEvaluate}
									onChange={(val) => setEditState((s) => s && { ...s, canEvaluate: val })}
								/>
							</div>
							<Input
								type="number"
								min={1}
								label={t('academicProjects.evaluators.maxEvaluatorsLabel')}
								value={editState.maxEvaluators}
								onChange={(e) => setEditState((s) => s && { ...s, maxEvaluators: e.target.value })}
								placeholder={t('academicProjects.evaluators.maxEvaluatorsPlaceholder')}
							/>
							{editError && <p className="text-xs text-red-600">{editError}</p>}
						</div>
					)}
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={setCanEvaluateMutation.isPending}>
									{t('dialog.actions.cancel')}
								</Button>
							}
						/>
						<Button
							variant="primary"
							onClick={handleEditSave}
							disabled={setCanEvaluateMutation.isPending}
							loading={setCanEvaluateMutation.isPending}>
							{t('dialog.actions.save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Create modal */}
			<Dialog
				open={createOpen}
				onOpenChange={(open) => {
					if (!open) setCreateOpen(false);
				}}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t('academicProjects.evaluators.createTitle')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<I18nTextField
							as="input"
							layout="row"
							label={t('academicProjects.evaluators.nameLabel')}
							required
							value={nameValue}
							onChange={setNameValue}
						/>
						<div className="flex items-center justify-between">
							<span className="text-sm text-zinc-700">
								{t('academicProjects.evaluators.canGradeLabel')}
							</span>
							<Toggle checked={createCanEvaluate} onChange={setCreateCanEvaluate} />
						</div>
						<Input
							type="number"
							min={1}
							label={t('academicProjects.evaluators.maxEvaluatorsLabel')}
							value={createMaxEvaluators}
							onChange={(e) => setCreateMaxEvaluators(e.target.value)}
							placeholder={t('academicProjects.evaluators.maxEvaluatorsPlaceholder')}
						/>
						{createError && <p className="text-xs text-red-600">{createError}</p>}
					</div>
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={createTypeMutation.isPending}>
									{t('dialog.actions.cancel')}
								</Button>
							}
						/>
						<Button
							variant="primary"
							onClick={handleCreate}
							disabled={createTypeMutation.isPending}
							loading={createTypeMutation.isPending}>
							{t('dialog.actions.save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete modal */}
			<DeleteConfirmDialog
				open={deleteTarget != null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				contentClassName="sm:max-w-md"
				title={t('academicProjects.evaluators.deleteTitle')}
				description={interpolate(t('academicProjects.evaluators.deleteConfirm'), {
					name: deleteTarget?.label ?? '',
				})}
				error={deleteError}
				isPending={deleteTypeMutation.isPending}
				cancelLabel={t('dialog.actions.cancel')}
				confirmLabel={t('dialog.actions.delete')}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
