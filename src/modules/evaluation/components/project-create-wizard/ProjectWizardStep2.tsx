'use client';

import { useState, useMemo } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Input, TextArea, Title } from '@/shared';
import { useI18n } from '@/providers';
import type { EnrolledStudentResponse } from '@/modules/academic';
import type { Step1Data } from '../rubric-create-wizard/WizardStep1';
import { WizardSelectStudentsModal, WizardSelectEvaluatorModal } from '@/modules';

export interface ProjectFormData {
	code: string;
	name: string;
	description: string;
	studentEnrollmentIds: number[];
	evaluators: { professorId: number; evaluatorTypeId: number }[];
}

export interface LocalEvaluator {
	professorId: number;
	professorName: string;
	professorEmail: string;
	typeId: number;
	typeName: { es: string; en: string };
	typeCode: string;
}

interface ProjectWizardStep2Props {
	step1: Step1Data;
	onBack: () => void;
	onSubmit: (data: ProjectFormData) => Promise<void>;
	isSubmitting: boolean;
}

export function ProjectWizardStep2({
	step1,
	onBack,
	onSubmit,
	isSubmitting,
}: ProjectWizardStep2Props) {
	const { t, locale } = useI18n();
	const loc = locale as 'es' | 'en';

	const [code, setCode] = useState('');
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');

	const [selectedStudents, setSelectedStudents] = useState<EnrolledStudentResponse[]>([]);
	const [studentModalOpen, setStudentModalOpen] = useState(false);

	const selectedStudentIds = useMemo(
		() => new Set(selectedStudents.map((s) => s.studentSectionEnrollmentId)),
		[selectedStudents],
	);

	const removeStudent = (id: number) =>
		setSelectedStudents((prev) => prev.filter((s) => s.studentSectionEnrollmentId !== id));

	const [evaluators, setEvaluators] = useState<LocalEvaluator[]>([]);
	const [evaluatorModalOpen, setEvaluatorModalOpen] = useState(false);

	const removeEvaluator = (idx: number) =>
		setEvaluators((prev) => prev.filter((_, i) => i !== idx));

	const canSubmit = code.trim().length > 0 && name.trim().length > 0 && !isSubmitting;

	const handleSubmit = async () => {
		if (!canSubmit) return;
		await onSubmit({
			code: code.trim(),
			name: name.trim(),
			description: description.trim(),
			studentEnrollmentIds: selectedStudents.map((s) => s.studentSectionEnrollmentId),
			evaluators: evaluators.map((e) => ({
				professorId: e.professorId,
				evaluatorTypeId: e.typeId,
			})),
		});
	};

	return (
		<div className="space-y-8">
			<section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
				<Title
					title={t('projects.create.step2.infoTitle')}
					className="[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900"
				/>

				<div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600">
					<span className="font-medium text-zinc-800">{step1.periodCode}</span>
					{' · '}
					<span>{step1.courseName[loc]}</span>
				</div>

				<div className="space-y-4">
					<Input
						label={t('projects.create.step2.fieldCode')}
						placeholder={t('projects.create.step2.fieldCodePlaceholder')}
						value={code}
						onChange={(e) => setCode(e.target.value)}
					/>
					<Input
						label={t('projects.create.step2.fieldName')}
						placeholder={t('projects.create.step2.fieldNamePlaceholder')}
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<TextArea
						label={t('projects.create.step2.fieldDesc')}
						placeholder={t('projects.create.step2.fieldDescPlaceholder')}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
					/>
				</div>
			</section>

			<section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
				<div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
					<div className="flex items-center gap-3">
						<Title
							title={t('projects.create.step2.studentsTitle')}
							className="[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900"
						/>
						{selectedStudents.length > 0 && (
							<span className="text-xs text-zinc-400">{selectedStudents.length}</span>
						)}
					</div>
					<Button variant="primary" size="sm" onClick={() => setStudentModalOpen(true)}>
						<PlusIcon className="h-4 w-4" />
						{t('projects.create.step2.studentsAdd')}
					</Button>
				</div>

				<div className="divide-y divide-zinc-100">
					{selectedStudents.length === 0 ? (
						<p className="px-6 py-8 text-center text-sm text-zinc-400">
							{t('projects.create.step2.studentsEmpty')}
						</p>
					) : (
						selectedStudents.map((s) => (
							<div
								key={s.studentSectionEnrollmentId}
								className="flex items-center justify-between gap-4 px-6 py-4">
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-zinc-900 text-sm">
										{s.firstName} {s.lastName}
									</span>
									<span className="text-xs font-mono text-zinc-400">{s.studentCode}</span>
								</div>
								<button
									type="button"
									onClick={() => removeStudent(s.studentSectionEnrollmentId)}
									className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors">
									<XMarkIcon className="h-4 w-4" />
								</button>
							</div>
						))
					)}
				</div>
			</section>

			<section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
				<div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
					<div className="flex items-center gap-3">
						<Title
							title={t('projects.create.step2.evaluatorsTitle')}
							className="[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900"
						/>
						{evaluators.length > 0 && (
							<span className="text-xs text-zinc-400">{evaluators.length}</span>
						)}
					</div>
					<Button variant="primary" size="sm" onClick={() => setEvaluatorModalOpen(true)}>
						<PlusIcon className="h-4 w-4" />
						{t('projects.create.step2.evaluatorsAdd')}
					</Button>
				</div>

				<div className="divide-y divide-zinc-100">
					{evaluators.length === 0 ? (
						<p className="px-6 py-8 text-center text-sm text-zinc-400">
							{t('projects.create.step2.evaluatorsEmpty')}
						</p>
					) : (
						evaluators.map((ev, idx) => (
							<div
								key={`${ev.professorId}-${ev.typeId}`}
								className="flex items-center justify-between gap-4 px-6 py-4">
								<div className="flex flex-col gap-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-medium text-zinc-900 text-sm">{ev.professorName}</span>
										<span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
											{ev.typeName[loc] ?? ev.typeName.es}
										</span>
									</div>
									{ev.professorEmail && (
										<span className="text-xs text-zinc-400 truncate">{ev.professorEmail}</span>
									)}
								</div>
								<button
									type="button"
									onClick={() => removeEvaluator(idx)}
									className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors">
									<XMarkIcon className="h-4 w-4" />
								</button>
							</div>
						))
					)}
				</div>
			</section>

			<div className="flex justify-between">
				<Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
					{t('projects.create.step2.back')}
				</Button>
				<Button variant="primary" disabled={!canSubmit} onClick={() => void handleSubmit()}>
					{isSubmitting ? t('projects.create.step2.submitting') : t('projects.create.step2.submit')}
				</Button>
			</div>

			<WizardSelectStudentsModal
				open={studentModalOpen}
				onOpenChange={setStudentModalOpen}
				courseId={step1.courseId}
				studyPlanAcademicPeriodId={step1.studyPlanAcademicPeriodId}
				selectedIds={selectedStudentIds}
				onConfirm={(result) => setSelectedStudents(result)}
			/>

			<WizardSelectEvaluatorModal
				open={evaluatorModalOpen}
				onOpenChange={setEvaluatorModalOpen}
				existing={evaluators}
				onConfirm={(ev) => setEvaluators((prev) => [...prev, ev])}
			/>
		</div>
	);
}
