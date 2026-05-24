'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
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
import { professorsService, typeGroupsService, typesService } from '@/modules/academic/services';
import { projectsService } from '../../services';
import { projectsQueryKeys } from '../../hooks';
import type { ProfessorSearchResponse } from '@/modules/academic/api/dtos/response';

const EVALUATOR_TYPE_GROUP_CODE = 'TG403';

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
	const [selectedProfessor, setSelectedProfessor] = useState<ProfessorSearchResponse | null>(null);
	const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	// Reset state when modal closes
	useEffect(() => {
		if (!open) {
			setSearch('');
			setDebouncedSearch('');
			setSelectedProfessor(null);
			setSelectedRoleId(null);
			setSubmitError(null);
		}
	}, [open]);

	// Professors search — only fires when there is a non-empty search term
	const { data: professors = [], isFetching: loadingProfessors } = useQuery({
		queryKey: ['professors', 'search', debouncedSearch],
		queryFn: () =>
			professorsService
				.getByFilters({ search: debouncedSearch, is_active: true })
				.then((r) => r.data),
		enabled: open && debouncedSearch.trim().length > 0,
	});

	// Step 1: resolve TG403 type-group id
	const { data: evaluatorTypeGroup } = useQuery({
		queryKey: ['type-groups', EVALUATOR_TYPE_GROUP_CODE],
		queryFn: () =>
			typeGroupsService
				.getByFilters({ code: EVALUATOR_TYPE_GROUP_CODE })
				.then((r) => r.data[0] ?? null),
		enabled: open,
		staleTime: Infinity,
	});

	// Step 2: fetch evaluator types once we have the group id
	const { data: evaluatorTypes = [], isLoading: loadingRoles } = useQuery({
		queryKey: ['types', 'by-type-group', evaluatorTypeGroup?.id],
		queryFn: () =>
			typesService.getByFilters({ type_group_id: evaluatorTypeGroup!.id }).then((r) => r.data),
		enabled: !!evaluatorTypeGroup?.id,
		staleTime: Infinity,
	});

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
				project_id: projectNumericId,
				professor_id: selectedProfessor!.id,
				evaluator_type_id: selectedRoleId!,
				is_active: true,
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

	const handleRoleChange = (_: string | undefined, opt: any) => {
		setSelectedRoleId(opt ? Number(opt.value) : null);
	};

	const professorDisplayName = (p: ProfessorSearchResponse) => {
		const user = p.staff?.user;
		if (user?.first_name || user?.last_name) {
			return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
		}
		return p.staff?.staff_email ?? `ID ${p.id}`;
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
					{/* Professor search */}
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

						{/* Professor list */}
						<div className="h-45 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
							{loadingProfessors ? (
								<div className="px-4 py-6 text-center text-sm text-zinc-400">
									<span className="animate-pulse">...</span>
								</div>
							) : debouncedSearch.trim().length === 0 ? (
								<p className="px-4 py-6 text-center text-sm text-zinc-400">
									{t('projects.edit.evaluators.modal.searchPrompt')}
								</p>
							) : professors.length === 0 ? (
								<p className="px-4 py-6 text-center text-sm text-zinc-400">
									{t('projects.edit.evaluators.modal.noResults')}
								</p>
							) : (
								<ul className="divide-y divide-zinc-100">
									{professors.map((professor) => {
										const isSelected = selectedProfessor?.id === professor.id;
										const displayName = professorDisplayName(professor);
										const email = professor.staff?.staff_email;

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

					{/* Role select */}
					<Select
						label={t('projects.edit.evaluators.modal.roleLabel')}
						placeholder={
							loadingRoles
								? t('projects.edit.evaluators.modal.loadingRoles')
								: t('projects.edit.evaluators.modal.rolePlaceholder')
						}
						options={roleOptions}
						value={roleOptions.find((o) => o.value === selectedRoleId) ?? null}
						onChange={handleRoleChange}
						isDisabled={loadingRoles || roleOptions.length === 0}
					/>

					{/* Error */}
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
