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
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { getSchoolCookie } from '@/shared/lib/authCookies';
import {
	useAcademicPeriods,
	useStudyPlanCourses,
	useUpdateStudyPlanCourse,
} from '@/modules/academic/hooks';
import { StudyPlanCourseResponse } from '@/modules/academic';

type AnyOption = { label: string; value: string | number };

interface AddEvaluationCourseModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function AddEvaluationCourseModal({
	open,
	onOpenChange,
	onSuccess,
}: AddEvaluationCourseModalProps) {
	const { t, locale } = useI18n();
	const schoolId = getSchoolCookie()?.id as number | undefined;

	const [selectedPeriod, setSelectedPeriod] = useState<AnyOption | null>(null);
	const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
	const [addError, setAddError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			setSelectedPeriod(null);
			setPendingIds(new Set());
			setAddError(null);
		}
	}, [open]);

	const { data: periods = [], isLoading: loadingPeriods } = useAcademicPeriods(
		{ is_active: true },
		{ enabled: open },
	);

	const periodOptions: AnyOption[] = periods.map((p) => ({ label: p.code, value: p.id }));

	const spcFilters = useMemo(
		() => ({
			academic_period_id: Number(selectedPeriod?.value ?? 0),
			school_id: schoolId,
			is_active: true,
		}),
		[selectedPeriod?.value, schoolId],
	);

	const { data: spcList = [], isLoading: loadingCourses } = useStudyPlanCourses(spcFilters, {
		enabled: !!selectedPeriod && !!schoolId,
	});

	const markedIds = useMemo(
		() => new Set(spcList.filter((s) => s.extra?.is_evaluate_rubric === true).map((s) => s.id)),
		[spcList],
	);

	const updateSpc = useUpdateStudyPlanCourse();

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

		Promise.all(
			toAdd.map((spc) => {
				const mergedExtra = { ...(spc.extra ?? {}), is_evaluate_rubric: true };
				return updateSpc.mutateAsync({ id: spc.id, body: { extra: mergedExtra } });
			}),
		)
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
			: (spc.course?.name?.[locale] ?? String(spc.course_id));

	const canConfirm = pendingIds.size > 0 && !updateSpc.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t('evaluationCourses.modal.title')}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<Select
						label={t('evaluationCourses.modal.periodLabel')}
						placeholder={
							loadingPeriods
								? t('evaluationCourses.modal.periodLoading')
								: t('evaluationCourses.modal.periodPlaceholder')
						}
						options={periodOptions}
						value={selectedPeriod}
						isDisabled={loadingPeriods}
						isSearchable
						onChange={(_, v) => {
							setSelectedPeriod(Array.isArray(v) ? (v[0] ?? null) : v);
							setPendingIds(new Set());
						}}
					/>

					{selectedPeriod && (
						<div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
							{loadingCourses ? (
								<p className="px-4 py-6 text-center text-sm text-zinc-400 animate-pulse">
									{t('evaluationCourses.modal.loadingCourses')}
								</p>
							) : spcList.length === 0 ? (
								<p className="px-4 py-6 text-center text-sm text-zinc-400">
									{t('evaluationCourses.modal.empty')}
								</p>
							) : (
								<ul className="divide-y divide-zinc-100">
									{spcList.map((spc) => {
										const isMarked = markedIds.has(spc.id);
										const isPending = pendingIds.has(spc.id);

										return (
											<li
												key={spc.id}
												className="flex items-center justify-between gap-3 px-4 py-3">
												<span className={`text-sm ${isMarked ? 'text-zinc-400' : 'text-zinc-800'}`}>
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
							<Button variant="secondary" disabled={updateSpc.isPending}>
								{t('dialog.close')}
							</Button>
						}
					/>
					<Button variant="primary" disabled={!canConfirm} onClick={handleConfirm}>
						{updateSpc.isPending
							? t('evaluationCourses.modal.adding')
							: t('evaluationCourses.modal.confirm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
