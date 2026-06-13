'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon } from '@heroicons/react/24/outline';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Button } from '@/shared/components/ui/Button';
import { useI18n } from '@/providers';
import { professorsService } from '@/modules/academic/services';
import { useTypeGroups, useTypes } from '@/modules/core/hooks';
import { projectsService } from '../../services';
import { projectsQueryKeys } from '../../hooks';
import type { ProfessorSearchResponse } from '@/modules/academic';
import { TYPE_GROUP_CODES } from '@/shared/constants';

const EVALUATOR_TYPE_GROUP_CODE = TYPE_GROUP_CODES.EVALUATOR_ROLE;

interface AddEvaluatorModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	projectNumericId: number;
	onSuccess?: () => void;
}

export function AddEvaluatorModal({
	open,
	onOpenChange,
	projectId,
	projectNumericId,
	onSuccess,
}: AddEvaluatorModalProps) {
	const { t, locale } = useI18n();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [professors, setProfessors] = useState<ProfessorSearchResponse[]>([]);
	const [loadingProfessors, setLoadingProfessors] = useState(false);
	const [selectedProfessor, setSelectedProfessor] = useState<ProfessorSearchResponse | null>(null);
	const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		if (!open) {
			setSearch('');
			setDebouncedSearch('');
			setProfessors([]);
			setSelectedProfessor(null);
			setSelectedRoleId(null);
			setSubmitError(null);
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;
		setLoadingProfessors(true);
		professorsService
			.getByFilters({ search: debouncedSearch.trim() || undefined, isActive: true })
			.then((r) => setProfessors(r.data ?? []))
			.catch(() => setProfessors([]))
			.finally(() => setLoadingProfessors(false));
	}, [open, debouncedSearch]);

	const { data: typeGroups = [] } = useTypeGroups(
		{ code: EVALUATOR_TYPE_GROUP_CODE },
		{ enabled: open },
	);
	const evaluatorTypeGroupId = typeGroups[0]?.id ?? null;

	const { data: evaluatorTypes = [], isLoading: loadingRoles } = useTypes(
		{ typeGroupId: evaluatorTypeGroupId ?? undefined },
		{ enabled: evaluatorTypeGroupId != null },
	);

	const roleOptions = useMemo(
		() =>
			evaluatorTypes.map((type) => ({
				label: type.name[locale as 'es' | 'en'] ?? type.name.es,
				value: type.id,
			})),
		[evaluatorTypes, locale],
	);

	const createMutation = useMutation({
		mutationFn: () =>
			projectsService.createEvaluator({
				projectId: projectNumericId,
				professorId: selectedProfessor!.id,
				evaluatorTypeId: selectedRoleId!,
				isActive: true,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: projectsQueryKeys.details(projectId, { isEvaluationMode: false }),
			});
			onOpenChange(false);
			onSuccess?.();
		},
		onError: () => setSubmitError(t('projects.edit.evaluators.modal.errorMessage')),
	});

	const handleConfirm = () => {
		if (!selectedProfessor || !selectedRoleId) return;
		setSubmitError(null);
		createMutation.mutate();
	};

	const professorDisplayName = (p: ProfessorSearchResponse) => {
		const user = p.staff?.user;
		if (user?.firstName || user?.lastName) {
			return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
		}
		return p.staff?.staffEmail ?? `ID ${p.id}`;
	};

	const canSubmit =
		selectedProfessor !== null && selectedRoleId !== null && !createMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t('projects.edit.evaluators.modal.title')}</DialogTitle>
				</DialogHeader>

				<div className="space-y-5">
					<div className="space-y-2">
						<Input
							label={t('projects.edit.evaluators.modal.searchLabel')}
							placeholder={t('projects.edit.evaluators.modal.searchPlaceholder')}
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setSelectedProfessor(null);
							}}
						/>

						<div className="h-45 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
							{loadingProfessors ? (
								<div className="px-4 py-6 text-center text-sm text-zinc-400">
									<span className="animate-pulse">...</span>
								</div>
							) : professors.length === 0 ? (
								<p className="px-4 py-6 text-center text-sm text-zinc-400">
									{t('projects.edit.evaluators.modal.noResults')}
								</p>
							) : (
								<ul className="divide-y divide-zinc-100">
									{professors.map((professor) => {
										const isSelected = selectedProfessor?.id === professor.id;
										const displayName = professorDisplayName(professor);
										const email = professor.staff?.staffEmail;

										return (
											<li key={professor.id}>
												<button
													type="button"
													onClick={() => setSelectedProfessor(isSelected ? null : professor)}
													className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
														isSelected ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-800'
													}`}>
													<div className="flex flex-col gap-0.5 min-w-0">
														<span className="font-medium truncate">{displayName}</span>
														{email && displayName !== email && (
															<span
																className={`text-xs truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
																{email}
															</span>
														)}
													</div>
													{isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
												</button>
											</li>
										);
									})}
								</ul>
							)}
						</div>
					</div>

					<Select
						label={t('projects.edit.evaluators.modal.roleLabel')}
						placeholder={
							loadingRoles
								? t('projects.edit.evaluators.modal.loadingRoles')
								: t('projects.edit.evaluators.modal.rolePlaceholder')
						}
						options={roleOptions}
						value={roleOptions.find((o) => o.value === selectedRoleId) ?? null}
						onChange={(_: string | undefined, opt) => {
							const single = Array.isArray(opt) ? opt[0] : opt;
							setSelectedRoleId(single ? Number(single.value) : null);
						}}
						isDisabled={loadingRoles || roleOptions.length === 0}
					/>

					{submitError && <p className="text-xs text-red-600">{submitError}</p>}
				</div>

				<DialogFooter>
					<DialogClose
						render={
							<Button variant="secondary" disabled={createMutation.isPending}>
								{t('dialog.close')}
							</Button>
						}
					/>
					<Button variant="primary" onClick={handleConfirm} disabled={!canSubmit}>
						{createMutation.isPending
							? t('projects.edit.evaluators.modal.adding')
							: t('projects.edit.evaluators.modal.confirmButton')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
