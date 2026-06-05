'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
	ArrowLeftIcon,
	PencilSquareIcon,
	UserMinusIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	ConfirmDialog,
	Skeleton,
	SuccessDialog,
	TableEmptyState,
	Toast,
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { usePortfolioProject, useUnassignPortfolioStudent } from '../hooks';
import { PortfolioStatusBadge } from '../components';
import type { PortfolioApplicationResponse } from '../types';

type Props = { projectId: string | number };

const APP_STATUS_CLASS: Record<PortfolioApplicationResponse['status'], string> = {
	ACCEPTED: 'bg-green-100 text-green-700',
	REJECTED: 'bg-red-100 text-red-700',
	PENDING: 'bg-yellow-100 text-yellow-700',
};

export function PortfolioDetailPage({ projectId }: Props) {
	const { t } = useI18n();
	const { data: project, isLoading, isError, error } = usePortfolioProject(projectId);
	const { mutateAsync: unassign, isPending: unassigning } = useUnassignPortfolioStudent();

	const [studentToRemove, setStudentToRemove] = useState<{
		studentId: number;
		name: string;
	} | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [toastError, setToastError] = useState<string | null>(null);

	async function handleUnassignConfirm() {
		if (!studentToRemove || !project) return;
		try {
			await unassign({ projectId: project.id, studentId: studentToRemove.studentId });
			setStudentToRemove(null);
			setSuccessMessage(t('portfolio.detail.studentRemoved'));
		} catch (e) {
			setStudentToRemove(null);
			setToastError(getErrorMessage(e, t('portfolio.error.unassignFailed')));
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-5">
				<Skeleton className="h-7 w-36" />
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	if (isError || !project) {
		return (
			<div className="space-y-4">
				<Link
					href="/portfolio"
					className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
					<ArrowLeftIcon className="h-4 w-4" />
					{t('portfolio.detail.backBtn')}
				</Link>
				<div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
					{getErrorMessage(error, t('portfolio.error.loadFailed'))}
				</div>
			</div>
		);
	}

	const students = [project.studentOne, project.studentTwo].filter(Boolean);

	return (
		<div className="space-y-6">
			{/* Back + Actions */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Link
					href="/portfolio"
					className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
					<ArrowLeftIcon className="h-4 w-4" />
					{t('portfolio.detail.backBtn')}
				</Link>
				<Link
					href={`/portfolio/${project.id}/edit`}
					className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">
					<PencilSquareIcon className="h-4 w-4" />
					{t('portfolio.detail.editBtn')}
				</Link>
			</div>

			{/* Header card */}
			<div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="space-y-1">
						<h1 className="text-2xl font-bold tracking-tight text-zinc-900">{project.name}</h1>
						<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-xs font-medium text-zinc-600">
							{project.code}
						</span>
					</div>
					<PortfolioStatusBadge status={project.status} />
				</div>

				{project.description && (
					<p className="text-sm leading-relaxed text-zinc-600">{project.description}</p>
				)}

				{/* Meta grid */}
				<dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-2">
					{project.company && (
						<>
							<dt className="font-medium text-zinc-400">{t('portfolio.detail.company')}</dt>
							<dd className="text-zinc-700">{project.company.name}</dd>
						</>
					)}
					<dt className="font-medium text-zinc-400">{t('portfolio.detail.origin')}</dt>
					<dd className="text-zinc-700">
						{project.isFromUPC ? t('portfolio.table.originUpc') : t('portfolio.table.external')}
					</dd>
					{project.researchLine && (
						<>
							<dt className="font-medium text-zinc-400">{t('portfolio.detail.researchLine')}</dt>
							<dd className="text-zinc-700">{project.researchLine.name}</dd>
						</>
					)}
					{project.problemSolved && (
						<>
							<dt className="font-medium text-zinc-400">{t('portfolio.detail.problemSolved')}</dt>
							<dd className="text-zinc-700">{project.problemSolved}</dd>
						</>
					)}
					{project.goal && (
						<>
							<dt className="font-medium text-zinc-400">{t('portfolio.detail.goal')}</dt>
							<dd className="text-zinc-700">{project.goal}</dd>
						</>
					)}
				</dl>
			</div>

			{/* Students section */}
			<div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
				<div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4">
					<h2 className="text-base font-semibold text-zinc-900">
						{t('portfolio.detail.studentsTitle')}
					</h2>
					<span className="text-xs text-zinc-400">{students.length}</span>
				</div>

				<div className="divide-y divide-zinc-100">
					{students.length === 0 ? (
						<TableEmptyState message={t('portfolio.detail.noStudents')} />
					) : (
						students.map((student) => {
							if (!student) return null;
							return (
								<div
									key={student.id}
									className="flex items-center justify-between gap-4 px-6 py-4">
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-zinc-900">
											{student.firstName} {student.lastName}
										</span>
										<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
											<span className="font-mono">{student.studentCode}</span>
											{student.email && (
												<>
													<span className="text-zinc-300">·</span>
													<span>{student.email}</span>
												</>
											)}
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon"
										disabled={unassigning}
										onClick={() =>
											setStudentToRemove({
												studentId: student.id,
												name: `${student.firstName} ${student.lastName}`,
											})
										}
										className="text-zinc-400 hover:bg-red-50 hover:text-red-600">
										<UserMinusIcon className="h-4 w-4" />
									</Button>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* Applications section */}
			{project.applications && project.applications.length > 0 && (
				<div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
					<div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4">
						<h2 className="text-base font-semibold text-zinc-900">
							{t('portfolio.detail.applicationsTitle')}
						</h2>
						<span className="text-xs text-zinc-400">{project.applications.length}</span>
					</div>

					<div className="divide-y divide-zinc-100">
						{project.applications.map((app) => (
							<div key={app.id} className="flex items-center justify-between gap-4 px-6 py-4">
								<div className="flex flex-col gap-0.5">
									{app.student && (
										<span className="font-medium text-zinc-900">
											{app.student.firstName} {app.student.lastName}
										</span>
									)}
									<span className="font-mono text-xs text-zinc-500">
										{app.student?.studentCode ?? `ID: ${app.studentId}`}
									</span>
								</div>
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${APP_STATUS_CLASS[app.status]}`}>
									{t(`portfolio.application.status.${app.status.toLowerCase()}`)}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Dialogs */}
			<ConfirmDialog
				isOpen={studentToRemove != null}
				onClose={() => setStudentToRemove(null)}
				onConfirm={handleUnassignConfirm}
				onDecline={() => setStudentToRemove(null)}
				title={t('portfolio.detail.removeStudentTitle')}
				message={t('portfolio.detail.removeStudentBody').replace(
					'{{name}}',
					studentToRemove?.name ?? '',
				)}
				confirmLabel={t('portfolio.detail.removeStudentConfirm')}
				isLoading={unassigning}
			/>

			{successMessage && (
				<SuccessDialog
					isOpen
					onClose={() => setSuccessMessage(null)}
					message={successMessage}
				/>
			)}

			{toastError && (
				<Toast isOpen type="error" onClose={() => setToastError(null)} message={toastError} />
			)}
		</div>
	);
}
