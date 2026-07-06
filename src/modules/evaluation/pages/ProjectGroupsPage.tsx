'use client';

import { useMemo, useState } from 'react';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	I18nTextField,
	Input,
	PageHeader,
	Select,
	TableEmptyState,
	TableErrorState,
	TableLoadingState,
} from '@/shared/components/ui';
import { Toggle } from '@/shared/components/ui/Toggle';
import { tryTranslateReason } from '@/shared/utils';
import { useI18n, useABET } from '@/providers';
import { usePrograms } from '@/modules/academic/hooks';
import {
	useProjectGroups,
	useCreateProjectGroup,
	useUpdateProjectGroup,
	useDeleteProjectGroup,
} from '../hooks';
import type { ProjectGroup } from '../types';

type SelectOption = { label: string; value: number };
type AnyOption = { label: string; value: string | number };

function toSelectOption(opt: AnyOption | AnyOption[] | null): SelectOption | null {
	const single = Array.isArray(opt) ? (opt[0] ?? null) : opt;
	return single ? { label: single.label, value: Number(single.value) } : null;
}

interface FormState {
	code: string;
	name: Record<string, string>;
	description: Record<string, string>;
	isActive: boolean;
}

const emptyForm: FormState = { code: '', name: {}, description: {}, isActive: true };

export function ProjectGroupsPage() {
	const { t, locale } = useI18n();
	const loc = locale as 'es' | 'en';
	const { academicPeriodId, schoolId, modalityTypeId } = useABET();

	const [selectedProgram, setSelectedProgram] = useState<SelectOption | null>(null);

	const { data: programs = [] } = usePrograms(
		{ isActive: true, schoolFilter: true, modalityTypeId: modalityTypeId ?? undefined },
		{ enabled: !!academicPeriodId && !!schoolId },
	);

	const programOptions = useMemo(
		() => programs.map((p) => ({ label: p.name[loc] ?? p.name.es, value: p.id })),
		[programs, loc],
	);

	const {
		data: groups = [],
		isLoading,
		isError,
	} = useProjectGroups(
		{ programId: selectedProgram?.value },
		{ enabled: !!academicPeriodId && !!schoolId && !!selectedProgram },
	);

	const createMutation = useCreateProjectGroup();
	const updateMutation = useUpdateProjectGroup();
	const deleteMutation = useDeleteProjectGroup();

	// ── Create / Edit modal ───────────────────────────────────────────────────
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<ProjectGroup | null>(null);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [formError, setFormError] = useState<string | null>(null);

	const openCreate = () => {
		setEditTarget(null);
		setForm(emptyForm);
		setFormError(null);
		setDialogOpen(true);
	};

	const openEdit = (group: ProjectGroup) => {
		setEditTarget(group);
		setForm({
			code: group.code,
			name: { es: group.name.es ?? '', en: group.name.en ?? '' },
			description: { es: group.description?.es ?? '', en: group.description?.en ?? '' },
			isActive: group.isActive,
		});
		setFormError(null);
		setDialogOpen(true);
	};

	const handleSave = () => {
		if (form.code.trim().length === 0) {
			setFormError(t('projectGroups.form.codeRequired'));
			return;
		}
		const hasName = Object.values(form.name).some((v) => v.trim().length > 0);
		if (!hasName) {
			setFormError(t('projectGroups.form.nameRequired'));
			return;
		}
		const es = form.name.es?.trim() || form.name.en!.trim();
		const en = form.name.en?.trim() || es;
		const descEs = form.description.es?.trim() ?? '';
		const descEn = form.description.en?.trim() ?? '';
		const hasDesc = descEs.length > 0 || descEn.length > 0;

		const onError = (err: unknown) => {
			const key = err instanceof Error ? err.message : 'projectGroups.form.saveError';
			setFormError(tryTranslateReason(t, key));
		};

		if (editTarget) {
			updateMutation.mutate(
				{
					id: editTarget.id,
					dto: {
						code: form.code.trim(),
						name: { es, en },
						...(hasDesc ? { description: { es: descEs, en: descEn } } : {}),
						isActive: form.isActive,
					},
				},
				{ onSuccess: () => setDialogOpen(false), onError },
			);
			return;
		}

		if (!academicPeriodId || !selectedProgram) return;
		createMutation.mutate(
			{
				code: form.code.trim(),
				name: { es, en },
				...(hasDesc ? { description: { es: descEs, en: descEn } } : {}),
				programId: selectedProgram.value,
				isActive: form.isActive,
			},
			{ onSuccess: () => setDialogOpen(false), onError },
		);
	};

	// ── Delete modal ──────────────────────────────────────────────────────────
	const [deleteTarget, setDeleteTarget] = useState<ProjectGroup | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const handleDelete = () => {
		if (!deleteTarget) return;
		deleteMutation.mutate(deleteTarget.id, {
			onSuccess: () => {
				setDeleteTarget(null);
				setDeleteError(null);
			},
			onError: (err) => {
				const key = err instanceof Error ? err.message : 'projectGroups.delete.error';
				setDeleteError(tryTranslateReason(t, key));
			},
		});
	};

	const isSaving = createMutation.isPending || updateMutation.isPending;

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('projectGroups.title')}
				description={t('projectGroups.description')}
				action={
					<Button variant="primary" onClick={openCreate} disabled={!selectedProgram}>
						<PlusIcon className="h-4 w-4" />
						{t('projectGroups.addButton')}
					</Button>
				}
			/>

			<Card>
				<Select
					label={t('projectGroups.filters.program')}
					options={programOptions}
					value={selectedProgram}
					isClearable
					isSearchable
					isDisabled={!academicPeriodId}
					onChange={(_, opt) => setSelectedProgram(toSelectOption(opt))}
				/>
			</Card>

			{!selectedProgram ? (
				<TableEmptyState message={t('projectGroups.selectProgram')} />
			) : isLoading ? (
				<TableLoadingState label={t('projectGroups.loading')} />
			) : isError ? (
				<TableErrorState message={t('projectGroups.error')} />
			) : groups.length === 0 ? (
				<TableEmptyState message={t('projectGroups.empty')} />
			) : (
				<Card>
					<ul className="-m-4 divide-y divide-zinc-100">
						{groups.map((group) => {
							const name = group.name[loc] ?? group.name.es;
							const desc = group.description?.[loc] ?? group.description?.es ?? '';
							return (
								<li key={group.id} className="flex items-center justify-between gap-4 px-6 py-4">
									<div className="flex flex-col gap-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-xs font-medium text-zinc-700">
												{group.code}
											</span>
											<span className="text-sm font-medium text-zinc-800">{name}</span>
											{!group.isActive && (
												<span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
													{t('projectGroups.inactive')}
												</span>
											)}
										</div>
										{desc && <span className="text-xs text-zinc-400">{desc}</span>}
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											className="text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
											onClick={() => openEdit(group)}
											aria-label={t('projectGroups.edit.title')}>
											<PencilSquareIcon className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="text-zinc-400 hover:bg-red-50 hover:text-red-600"
											onClick={() => {
												setDeleteTarget(group);
												setDeleteError(null);
											}}
											aria-label={t('projectGroups.delete.title')}>
											<TrashIcon className="h-4 w-4" />
										</Button>
									</div>
								</li>
							);
						})}
					</ul>
				</Card>
			)}

			{/* Create / Edit modal */}
			<Dialog
				open={dialogOpen}
				onOpenChange={(open) => {
					if (!open) setDialogOpen(false);
				}}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editTarget ? t('projectGroups.edit.title') : t('projectGroups.create.title')}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							label={t('projectGroups.form.code')}
							placeholder={t('projectGroups.form.codePlaceholder')}
							value={form.code}
							onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
						/>
						<I18nTextField
							as="input"
							layout="row"
							label={t('projectGroups.form.name')}
							required
							value={form.name}
							onChange={(next) => setForm((s) => ({ ...s, name: next }))}
						/>
						<I18nTextField
							layout="row"
							label={t('projectGroups.form.description')}
							value={form.description}
							onChange={(next) => setForm((s) => ({ ...s, description: next }))}
							rows={2}
						/>
						<div className="flex items-center justify-between">
							<span className="text-sm text-zinc-700">{t('projectGroups.form.active')}</span>
							<Toggle
								checked={form.isActive}
								onChange={(val) => setForm((s) => ({ ...s, isActive: val }))}
							/>
						</div>
						{formError && <p className="text-xs text-red-600">{formError}</p>}
					</div>
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={isSaving}>
									{t('dialog.actions.cancel')}
								</Button>
							}
						/>
						<Button variant="primary" onClick={handleSave} disabled={isSaving} loading={isSaving}>
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
						<DialogTitle>{t('projectGroups.delete.title')}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-zinc-600">
						{t('projectGroups.delete.confirm').replace(
							'{{name}}',
							deleteTarget ? (deleteTarget.name[loc] ?? deleteTarget.name.es) : '',
						)}
					</p>
					{deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={deleteMutation.isPending}>
									{t('dialog.actions.cancel')}
								</Button>
							}
						/>
						<Button
							variant="danger"
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
							loading={deleteMutation.isPending}>
							{t('dialog.actions.delete')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
