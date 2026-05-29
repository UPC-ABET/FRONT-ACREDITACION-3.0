'use client';

import { useState, useMemo, useEffect } from 'react';
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
import type { LocalEvaluator } from './ProjectWizardStep2';
import { TYPE_CODES, TYPE_GROUP_CODES } from '@/modules/core';
import { ProfessorSearchResponse } from '@/modules/academic';

const EVALUATOR_TYPE_GROUP_CODE = TYPE_GROUP_CODES.EVALUATOR_ROLE;
const LIMITED_CODES: readonly string[] = Object.values(TYPE_CODES.EVALUATOR_LIMITED_TYPE);

interface WizardSelectEvaluatorModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existing: LocalEvaluator[];
	onConfirm: (evaluator: LocalEvaluator) => void;
}

export function WizardSelectEvaluatorModal({
	open,
	onOpenChange,
	existing,
	onConfirm,
}: WizardSelectEvaluatorModalProps) {
	const { t, locale } = useI18n();

	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [professors, setProfessors] = useState<ProfessorSearchResponse[]>([]);
	const [loadingProfs, setLoadingProfs] = useState(false);
	const [selectedProf, setSelectedProf] = useState<ProfessorSearchResponse | null>(null);
	const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Reset on close
	useEffect(() => {
		if (!open) {
			setSearch('');
			setDebouncedSearch('');
			setProfessors([]);
			setSelectedProf(null);
			setSelectedTypeId(null);
			setError(null);
		}
	}, [open]);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	// Fetch professors on open and on debounced search change
	useEffect(() => {
		if (!open) return;
		setLoadingProfs(true);
		professorsService
			.getByFilters({ search: debouncedSearch.trim() || undefined, is_active: true })
			.then((r) => setProfessors(r.data ?? []))
			.catch(() => setProfessors([]))
			.finally(() => setLoadingProfs(false));
	}, [open, debouncedSearch]);

	const { data: typeGroups = [] } = useTypeGroups(
		{ code: EVALUATOR_TYPE_GROUP_CODE },
		{ enabled: open },
	);
	const typeGroupId = typeGroups[0]?.id ?? null;

	const { data: allTypes = [], isLoading: loadingTypes } = useTypes(
		{ type_group_id: typeGroupId ?? undefined },
		{ enabled: typeGroupId != null },
	);

	const usedLimitedCodes = useMemo(
		() =>
			new Set(existing.filter((e) => LIMITED_CODES.includes(e.typeCode)).map((e) => e.typeCode)),
		[existing],
	);

	const availableTypes = useMemo(
		() =>
			allTypes.filter((type) =>
				LIMITED_CODES.includes(type.code) ? !usedLimitedCodes.has(type.code) : true,
			),
		[allTypes, usedLimitedCodes],
	);

	const typeOptions = useMemo(
		() =>
			availableTypes.map((type) => ({
				label: type.name[locale as 'es' | 'en'] ?? type.name.es,
				value: type.id,
			})),
		[availableTypes, locale],
	);

	const profDisplayName = (p: ProfessorSearchResponse) => {
		const user = p.staff?.user;
		if (user?.first_name || user?.last_name)
			return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
		return p.staff?.staff_email ?? `ID ${p.id}`;
	};

	const handleConfirm = () => {
		if (!selectedProf || !selectedTypeId) return;
		setError(null);
		const type = allTypes.find((tp) => tp.id === selectedTypeId);
		if (!type) return;
		if (existing.some((e) => e.professorId === selectedProf.id && e.typeId === selectedTypeId)) {
			setError(t('projects.create.step2.evaluators.errorDuplicateRole'));
			return;
		}
		onConfirm({
			professorId: selectedProf.id,
			professorName: profDisplayName(selectedProf),
			professorEmail: selectedProf.staff?.staff_email ?? '',
			typeId: type.id,
			typeName: type.name,
			typeCode: type.code,
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t('projects.create.step2.evaluatorsModal.title')}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Input
							label={t('projects.create.step2.evaluatorsSearch')}
							placeholder={t('projects.create.step2.evaluatorsSearchPlaceholder')}
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setSelectedProf(null);
							}}
						/>

						<div className="h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
							{loadingProfs ? (
								<p className="px-4 py-6 text-center text-sm text-zinc-400 animate-pulse">...</p>
							) : professors.length === 0 ? (
								<p className="px-4 py-6 text-center text-sm text-zinc-400">
									{t('projects.create.step2.evaluatorsNoResults')}
								</p>
							) : (
								<ul className="divide-y divide-zinc-100">
									{professors.map((p) => {
										const isSelected = selectedProf?.id === p.id;
										return (
											<li key={p.id}>
												<button
													type="button"
													onClick={() => setSelectedProf(isSelected ? null : p)}
													className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
														isSelected ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-800'
													}`}>
													<div className="flex flex-col gap-0.5 min-w-0">
														<span className="font-medium truncate">{profDisplayName(p)}</span>
														{p.staff?.staff_email && (
															<span
																className={`text-xs truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
																{p.staff.staff_email}
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
						label={t('projects.create.step2.evaluatorsRole')}
						placeholder={
							loadingTypes
								? t('projects.create.step2.evaluatorsRoleLoading')
								: t('projects.create.step2.evaluatorsRolePlaceholder')
						}
						options={typeOptions}
						value={typeOptions.find((o) => o.value === selectedTypeId) ?? null}
						onChange={(_: string | undefined, opt) => {
							const single = Array.isArray(opt) ? opt[0] : opt;
							setSelectedTypeId(single ? Number(single.value) : null);
						}}
						isDisabled={loadingTypes || typeOptions.length === 0}
					/>

					{error && <p className="text-xs text-red-600">{error}</p>}
				</div>

				<DialogFooter>
					<DialogClose render={<Button variant="secondary">{t('dialog.close')}</Button>} />
					<Button
						variant="primary"
						onClick={handleConfirm}
						disabled={!selectedProf || !selectedTypeId}>
						{t('projects.create.step2.evaluatorsModal.confirmButton')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
