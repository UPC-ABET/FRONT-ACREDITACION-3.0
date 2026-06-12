'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Button } from '@/shared/components/ui/Button';
import { useI18n } from '@/providers';
import { coursesService } from '@/modules/academic/services';
import type { EnrolledStudentResponse } from '@/modules/academic';
import { projectsService } from '../../services';
import { projectsQueryKeys } from '../../hooks';

interface AddStudentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	projectNumericId: number;
	courseId: number | null;
	academicPeriodId: number | null;
	onSuccess?: () => void;
}

export function AddStudentModal({
	open,
	onOpenChange,
	projectId,
	projectNumericId,
	courseId,
	academicPeriodId,
	onSuccess,
}: AddStudentModalProps) {
	const { t } = useI18n();
	const queryClient = useQueryClient();

	const [students, setStudents] = useState<EnrolledStudentResponse[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [selectedStudents, setSelectedStudents] = useState<Map<number, EnrolledStudentResponse>>(
		new Map(),
	);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			setSearch('');
			setSelectedStudents(new Map());
			setSubmitError(null);
			setStudents([]);
		}
	}, [open]);

	useEffect(() => {
		if (!open || courseId == null) return;
		setIsLoading(true);
		coursesService
			.getEnrolledStudents(courseId, {
				isActive: true,
				...(academicPeriodId != null ? { academicPeriodId: academicPeriodId } : {}),
			})
			.then((r) => setStudents(r.data ?? []))
			.catch(() => setStudents([]))
			.finally(() => setIsLoading(false));
	}, [open]);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return students;
		return students.filter(
			(s) =>
				s.firstName.toLowerCase().includes(term) ||
				s.lastName.toLowerCase().includes(term) ||
				s.studentCode.toLowerCase().includes(term) ||
				(s.email ?? '').toLowerCase().includes(term),
		);
	}, [students, search]);

	const toggleStudent = (student: EnrolledStudentResponse) => {
		const key = student.studentSectionEnrollmentId;
		setSelectedStudents((prev) => {
			const next = new Map(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.set(key, student);
			}
			return next;
		});
	};

	const addMutation = useMutation({
		mutationFn: () =>
			Promise.all(
				Array.from(selectedStudents.values()).map((student) =>
					projectsService.createStudent({
						projectId: projectNumericId,
						studentSectionEnrollmentId: student.studentSectionEnrollmentId,
						isActive: true,
					}),
				),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: projectsQueryKeys.details(projectId, { isEvaluationMode: false }),
			});
			onOpenChange(false);
			onSuccess?.();
		},
		onError: () => setSubmitError(t('projects.edit.students.modal.errorMessage')),
	});

	const handleConfirm = () => {
		if (selectedStudents.size === 0) return;
		setSubmitError(null);
		addMutation.mutate();
	};

	const canSubmit = selectedStudents.size > 0 && !addMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t('projects.edit.students.modal.title')}</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<Input
						placeholder={t('projects.edit.students.modal.searchPlaceholder')}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>

					{selectedStudents.size > 0 && (
						<p className="text-xs text-zinc-500">
							<span className="font-semibold text-zinc-900">{selectedStudents.size}</span>{' '}
							{t('projects.edit.students.modal.selected')}
						</p>
					)}

					<div className="h-45 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
						{isLoading ? (
							<p className="px-4 py-6 text-center text-sm text-zinc-400 animate-pulse">
								{t('projects.edit.students.modal.loading')}
							</p>
						) : students.length === 0 ? (
							<p className="px-4 py-6 text-center text-sm text-zinc-400">
								{t('projects.edit.students.modal.empty')}
							</p>
						) : filtered.length === 0 ? (
							<p className="px-4 py-6 text-center text-sm text-zinc-400">
								{t('projects.edit.students.modal.noResults')}
							</p>
						) : (
							<ul className="divide-y divide-zinc-100">
								{filtered.map((student) => {
									const isSelected = selectedStudents.has(student.studentSectionEnrollmentId);
									return (
										<li key={student.studentSectionEnrollmentId}>
											<button
												type="button"
												onClick={() => toggleStudent(student)}
												className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
													isSelected ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-800'
												}`}>
												<div className="flex flex-col gap-0.5 min-w-0">
													<span className="font-medium truncate">
														{student.firstName} {student.lastName}
													</span>
													<div
														className={`flex flex-wrap items-center gap-x-2 text-xs truncate ${
															isSelected ? 'text-zinc-300' : 'text-zinc-400'
														}`}>
														<span className="font-mono">{student.studentCode}</span>
														{student.sectionCode && (
															<>
																<span>·</span>
																<span>
																	{t('projects.edit.students.modal.section')} {student.sectionCode}
																</span>
															</>
														)}
													</div>
												</div>
												{isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
											</button>
										</li>
									);
								})}
							</ul>
						)}
					</div>

					{submitError && <p className="text-xs text-red-600">{submitError}</p>}
				</div>

				<DialogFooter>
					<DialogClose
						render={
							<Button variant="secondary" disabled={addMutation.isPending}>
								{t('dialog.close')}
							</Button>
						}
					/>
					<Button variant="primary" onClick={handleConfirm} disabled={!canSubmit}>
						{addMutation.isPending
							? t('projects.edit.students.modal.adding')
							: `${t('projects.edit.students.modal.confirmButton')}${selectedStudents.size > 0 ? ` (${selectedStudents.size})` : ''}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
