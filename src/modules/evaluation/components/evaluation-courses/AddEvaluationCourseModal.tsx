'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
	Button,
	Select,
	Input,
} from '@/shared/components/ui';
import { LoadingState } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import {
	useStudyPlanCourses,
	useEnableEvaluationCourse,
	usePrograms,
} from '@/modules/academic/hooks';
import { StudyPlanCourseResponse } from '@/modules/academic';

interface AddEvaluationCourseModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

type AnyOption = { label: string; value: string | number };

export function AddEvaluationCourseModal({
	open,
	onOpenChange,
	onSuccess,
}: AddEvaluationCourseModalProps) {
	const { t, locale } = useI18n();
	const { academicPeriodId, schoolId } = useABET();

	const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
	const [selectedProgramOpt, setSelectedProgramOpt] = useState<AnyOption | null>(null);
	const [search, setSearch] = useState('');
	const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
	const [addError, setAddError] = useState<string | null>(null);

	const [trackedPeriodId, setTrackedPeriodId] = useState(academicPeriodId);
	if (academicPeriodId !== trackedPeriodId) {
		setTrackedPeriodId(academicPeriodId);
		setSelectedProgramId(null);
		setSelectedProgramOpt(null);
		setSearch('');
		setPendingIds(new Set());
	}

	useEffect(() => {
		if (!open) {
			setSelectedProgramId(null);
			setSelectedProgramOpt(null);
			setSearch('');
			setPendingIds(new Set());
			setAddError(null);
		}
	}, [open]);

	const { data: programs = [], isLoading: loadingPrograms } = usePrograms(
		{ isActive: true, schoolFilter: true },
		{ enabled: !!schoolId && !!academicPeriodId && open },
	);

	const spcFilters = useMemo(
		() => ({
			programId: selectedProgramId ?? undefined,
			isActive: true,
		}),
		[selectedProgramId],
	);

	const { data: spcList = [], isLoading: loadingCourses } = useStudyPlanCourses(spcFilters, {
		enabled: !!academicPeriodId && !!selectedProgramId,
	});

	const markedIds = useMemo(
		// NOTE: Backend field is "is_evaluable" (snake_case), do NOT convert to camelCase
		() => new Set(spcList.filter((s) => s.extra?.is_evaluable === true).map((s) => s.id)),
		[spcList],
	);

	const enableEvaluation = useEnableEvaluationCourse();

	const togglePending = (id: number) => {
		setPendingIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const handleConfirm = () => {
		setAddError(null);
		const toAdd = spcList.filter((s) => pendingIds.has(s.id));
		if (toAdd.length === 0) return;

		Promise.all(toAdd.map((spc) => enableEvaluation.mutateAsync({ id: spc.id, isEvaluable: true })))
			.then(() => {
				setPendingIds(new Set());
				onSuccess?.();
				onOpenChange(false);
			})
			.catch(() => setAddError(t('evaluationCourses.modal.errorAdd')));
	};

	const courseName = (spc: StudyPlanCourseResponse) =>
		typeof spc.course?.name === 'string'
			? spc.course.name
			: (spc.course?.name?.[locale] ?? String(spc.courseId));

	const programOptions: AnyOption[] = programs.map((p) => ({
		label: p.name[locale as 'es' | 'en'] ?? p.name.es,
		value: p.id,
	}));

	const filteredSpcList = useMemo(() => {
		if (!search.trim()) return spcList;
		const q = search.trim().toLowerCase();
		return spcList.filter((spc) => courseName(spc).toLowerCase().includes(q));
	}, [spcList, search]);

	const canConfirm = pendingIds.size > 0 && !enableEvaluation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t('evaluationCourses.modal.title')}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<Select
						label={t('evaluationCourses.modal.programLabel')}
						placeholder={
							loadingPrograms
								? t('evaluationCourses.modal.programLoading')
								: programs.length === 0
									? t('evaluationCourses.modal.programNoOptions')
									: t('evaluationCourses.modal.programPlaceholder')
						}
						options={programOptions}
						value={selectedProgramOpt}
						isDisabled={loadingPrograms || programs.length === 0}
						isSearchable
						onChange={(_, v) => {
							const opt = Array.isArray(v) ? (v[0] ?? null) : v;
							setSelectedProgramOpt(opt as AnyOption | null);
							setSelectedProgramId(opt ? Number(opt.value) : null);
							setSearch('');
							setPendingIds(new Set());
						}}
					/>

					{selectedProgramId !== null && (
						<div className="space-y-2">
							<Input
								placeholder={t('evaluationCourses.modal.searchPlaceholder')}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
								{loadingCourses ? (
									<LoadingState
										className="py-6"
										label={t('evaluationCourses.modal.loadingCourses')}
									/>
								) : filteredSpcList.length === 0 ? (
									<p className="px-4 py-6 text-center text-sm text-zinc-400">
										{search.trim()
											? t('evaluationCourses.modal.searchNoResults')
											: t('evaluationCourses.modal.empty')}
									</p>
								) : (
									<ul className="divide-y divide-zinc-100">
										{filteredSpcList.map((spc) => {
											const isMarked = markedIds.has(spc.id);
											const isPending = pendingIds.has(spc.id);

											return (
												<li
													key={spc.id}
													className="flex items-center justify-between gap-3 px-4 py-3">
													<span
														className={`text-sm ${isMarked ? 'text-zinc-400' : 'text-zinc-800'}`}>
														{courseName(spc)}
													</span>
													<button
														type="button"
														disabled={isMarked}
														onClick={() => togglePending(spc.id)}
														title={
															isMarked
																? t('evaluationCourses.modal.alreadyAdded')
																: isPending
																	? t('evaluationCourses.modal.deselect')
																	: t('evaluationCourses.modal.select')
														}
														className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors
                            ${
															isMarked
																? 'cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-400'
																: isPending
																	? 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
																	: 'border-zinc-300 bg-white text-zinc-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
														}`}>
														{isMarked || isPending ? (
															<CheckIcon className="h-4 w-4" />
														) : (
															<PlusIcon className="h-4 w-4" />
														)}
													</button>
												</li>
											);
										})}
									</ul>
								)}
							</div>
						</div>
					)}

					{pendingIds.size > 0 && (
						<p className="text-xs text-zinc-500">
							{t('evaluationCourses.modal.selectedCount').replace(
								'{{count}}',
								String(pendingIds.size),
							)}
						</p>
					)}

					{addError && <p className="text-xs text-red-600">{addError}</p>}
				</div>

				<DialogFooter>
					<DialogClose
						render={
							<Button variant="secondary" disabled={enableEvaluation.isPending}>
								{t('dialog.close')}
							</Button>
						}
					/>
					<Button variant="primary" disabled={!canConfirm} onClick={handleConfirm}>
						{enableEvaluation.isPending
							? t('evaluationCourses.modal.adding')
							: t('evaluationCourses.modal.confirm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
