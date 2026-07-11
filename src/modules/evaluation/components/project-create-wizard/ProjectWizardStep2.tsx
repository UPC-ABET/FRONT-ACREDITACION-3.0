'use client';

import { useState, useMemo } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Card, Input, TableEmptyState, TextArea, Title } from '@/shared';
import { useI18n } from '@/providers';
import type { EnrolledStudentResponse } from '@/modules/academic';
import type { Step1Data } from '../rubric-create-wizard/WizardStep1';
import { WizardSelectStudentsModal, WizardSelectEvaluatorModal } from '@/modules';
import { ProjectGroupSelect } from '@/modules';

export interface ProjectFormData {
	code: string;
	name: string;
	description: string;
	projectGroupId: number;
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
	const [projectGroupId, setProjectGroupId] = useState<number | undefined>(undefined);
	const [groupError, setGroupError] = useState<string | undefined>(undefined);

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

	const canSubmit =
		code.trim().length > 0 && name.trim().length > 0 && projectGroupId != null && !isSubmitting;

	const handleSubmit = async () => {
		if (projectGroupId == null) {
			setGroupError(t('projects.create.step2.fieldGroupRequired'));
			return;
		}
		if (!canSubmit) return;
		await onSubmit({
			code: code.trim(),
			name: name.trim(),
			description: description.trim(),
			projectGroupId,
			studentEnrollmentIds: selectedStudents.map((s) => s.studentSectionEnrollmentId),
			evaluators: evaluators.map((e) => ({
				professorId: e.professorId,
				evaluatorTypeId: e.typeId,
			})),
		});
	};

	return (
		<div className="space-y-6">
			<Card title={t('projects.create.step2.infoTitle')}>
				<div className="space-y-4">
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
						<ProjectGroupSelect
							academicPeriodId={step1.periodId}
							programId={step1.programId}
							value={projectGroupId}
							onChange={(id) => {
								setProjectGroupId(id);
								if (id != null) setGroupError(undefined);
							}}
							error={groupError}
						/>
					</div>
				</div>
			</Card>

			<Card>
				<div className="-m-4">
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
							<TableEmptyState message={t('projects.create.step2.studentsEmpty')} />
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
									<Button
										variant="ghost"
										size="icon"
										className="text-zinc-400 hover:bg-red-50 hover:text-red-600"
										onClick={() => removeStudent(s.studentSectionEnrollmentId)}
										aria-label={t('projects.create.step2.studentsAdd')}>
										<XMarkIcon className="h-4 w-4" />
									</Button>
								</div>
							))
						)}
					</div>
				</div>
			</Card>

			<Card>
				<div className="-m-4">
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
							<TableEmptyState message={t('projects.create.step2.evaluatorsEmpty')} />
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
									<Button
										variant="ghost"
										size="icon"
										className="text-zinc-400 hover:bg-red-50 hover:text-red-600"
										onClick={() => removeEvaluator(idx)}
										aria-label={t('projects.create.step2.evaluatorsAdd')}>
										<XMarkIcon className="h-4 w-4" />
									</Button>
								</div>
							))
						)}
					</div>
				</div>
			</Card>

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
