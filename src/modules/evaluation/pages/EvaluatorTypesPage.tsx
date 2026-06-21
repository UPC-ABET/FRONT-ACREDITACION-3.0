'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import {
	Button,
	buttonVariants,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogClose,
	I18nTextField,
	PageHeader,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { Toggle } from '@/shared/components/ui/Toggle';
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
			// NOTE: Backend fields are "can_evaluate" and "max_evaluators" (snake_case), do NOT convert to camelCase
			canEvaluate: type.extra?.can_evaluate === true,
			maxEvaluators: String(type.extra?.max_evaluators ?? ''),
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
				// NOTE: Backend expects snake_case inside extra, do NOT convert to camelCase
				extra: {
					can_evaluate: createCanEvaluate,
					...(max !== '' ? { max_evaluators: Number(max) } : {}),
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
					<button
						type="button"
						onClick={openCreate}
						disabled={typeGroupId == null}
						className={cn(
							buttonVariants({ variant: 'primary', size: 'md' }),
							'inline-flex items-center gap-1.5 disabled:pointer-events-none disabled:opacity-50',
						)}>
						<PlusIcon className="h-4 w-4" />
						{t('academicProjects.evaluators.addButton')}
					</button>
				}
			/>

			<div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
				{isLoading ? (
					<div className="px-6 py-10 text-center text-sm text-zinc-400 animate-pulse">
						{t('academicProjects.evaluators.loading')}
					</div>
				) : isError ? (
					<div className="px-6 py-10 text-center text-sm text-red-500">
						{t('academicProjects.evaluators.error')}
					</div>
				) : types.length === 0 ? (
					<div className="px-6 py-10 text-center text-sm text-zinc-400">
						{t('academicProjects.evaluators.empty')}
					</div>
				) : (
					<ul className="divide-y divide-zinc-100">
						{types.map((type) => {
							// NOTE: Backend fields are "can_evaluate" and "max_evaluators" (snake_case), do NOT convert to camelCase
							const canEvaluate = type.extra?.can_evaluate === true;
							const maxEvaluators = type.extra?.max_evaluators as number | undefined;
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
													{t('academicProjects.evaluators.maxLabel').replace(
														'{{max}}',
														String(maxEvaluators),
													)}
												</span>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => openEdit(type)}
											className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
											<PencilSquareIcon className="h-4 w-4" />
										</button>
										<button
											type="button"
											onClick={() => {
												setDeleteTarget({ id: type.id, label });
												setDeleteError(null);
											}}
											className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors">
											<TrashIcon className="h-4 w-4" />
										</button>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>

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
							<div className="flex flex-col gap-1">
								<label className="text-sm text-zinc-700">
									{t('academicProjects.evaluators.maxEvaluatorsLabel')}
								</label>
								<input
									type="number"
									min={1}
									value={editState.maxEvaluators}
									onChange={(e) =>
										setEditState((s) => s && { ...s, maxEvaluators: e.target.value })
									}
									placeholder={t('academicProjects.evaluators.maxEvaluatorsPlaceholder')}
									className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
								/>
							</div>
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
						<div className="flex flex-col gap-1">
							<label className="text-sm text-zinc-700">
								{t('academicProjects.evaluators.maxEvaluatorsLabel')}
							</label>
							<input
								type="number"
								min={1}
								value={createMaxEvaluators}
								onChange={(e) => setCreateMaxEvaluators(e.target.value)}
								placeholder={t('academicProjects.evaluators.maxEvaluatorsPlaceholder')}
								className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
							/>
						</div>
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
			<Dialog
				open={deleteTarget != null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t('academicProjects.evaluators.deleteTitle')}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-zinc-600">
						{t('academicProjects.evaluators.deleteConfirm').replace(
							'{{name}}',
							deleteTarget?.label ?? '',
						)}
					</p>
					{deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={deleteTypeMutation.isPending}>
									{t('dialog.actions.cancel')}
								</Button>
							}
						/>
						<Button
							variant="primary"
							className="bg-red-600 hover:bg-red-700"
							onClick={handleDelete}
							disabled={deleteTypeMutation.isPending}
							loading={deleteTypeMutation.isPending}>
							{t('dialog.actions.delete')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
