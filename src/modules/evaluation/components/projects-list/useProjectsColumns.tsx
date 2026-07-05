'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/providers';
import type { ProjectResponse } from '../../types';

interface UseProjectsColumnsArgs {
	setConfirmTarget: (project: ProjectResponse | null) => void;
	setDeleteError: (error: string | null) => void;
}

export function useProjectsColumns({ setConfirmTarget, setDeleteError }: UseProjectsColumnsArgs) {
	const { t, locale } = useI18n();

	return useMemo<ColumnDef<ProjectResponse>[]>(
		() => [
			{
				id: 'code',
				header: t('projects.list.table.code'),
				cell: ({ row }) => (
					<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-700">
						{row.original.code}
					</span>
				),
				meta: { headerClassName: 'w-[10%] !whitespace-normal' },
			},
			{
				id: 'name',
				header: t('projects.list.table.name'),
				cell: ({ row }) => (
					<span className="font-medium text-zinc-900">
						{row.original.name[locale as 'es' | 'en'] ?? row.original.name.es}
					</span>
				),
				meta: {
					headerClassName: 'w-[20%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'course',
				header: t('projects.list.table.course'),
				cell: ({ row }) => {
					const name = row.original.courseName;
					if (!name) return <span className="text-zinc-400">—</span>;
					return (
						<span className="text-sm text-zinc-700">{name[locale as 'es' | 'en'] ?? name.es}</span>
					);
				},
				meta: {
					headerClassName: 'w-[15%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'group',
				header: t('projects.list.table.group'),
				cell: ({ row }) => {
					const group = row.original.projectGroup;
					if (!group) {
						return <span className="text-zinc-400">{t('projects.list.table.noGroup')}</span>;
					}
					return (
						<div className="flex flex-col gap-0.5">
							<span className="inline-flex w-fit items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-xs font-medium text-zinc-700">
								{group.code}
							</span>
							<span className="text-xs text-zinc-500">
								{group.name[locale as 'es' | 'en'] ?? group.name.es}
							</span>
						</div>
					);
				},
				meta: {
					headerClassName: 'w-[15%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'evaluators',
				header: t('projects.list.table.evaluators'),
				cell: ({ row }) => {
					const evaluators = Object.values(
						(row.original.evaluators ?? []).reduce<
							Record<number, { pid: number; name: string; types: { id: number; label: string }[] }>
						>((acc, ev) => {
							const pid = ev.professorId;
							const name = `${ev.professorFirstName} ${ev.professorLastName}`.trim() || `#${pid}`;
							if (!acc[pid]) acc[pid] = { pid, name, types: [] };
							if (ev.evaluatorTypeName) {
								acc[pid].types.push({
									id: ev.evaluatorTypeId,
									label: ev.evaluatorTypeName[locale as 'es' | 'en'] ?? ev.evaluatorTypeName.es,
								});
							}
							return acc;
						}, {}),
					);
					return evaluators.length ? (
						<div className="flex flex-col gap-1 text-sm text-zinc-700">
							{evaluators.map((entry) => (
								<div key={entry.pid} className="flex flex-col gap-0.5">
									<span className="font-medium">{entry.name}</span>
									<div className="flex flex-wrap gap-1">
										{entry.types.map((tp) => (
											<span
												key={tp.id}
												className="inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs text-zinc-500">
												{tp.label}
											</span>
										))}
									</div>
								</div>
							))}
						</div>
					) : (
						<span className="text-zinc-400">—</span>
					);
				},
				meta: {
					headerClassName: 'w-[25%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'students',
				header: t('projects.list.table.students'),
				cell: ({ row }) =>
					row.original.students?.length ? (
						<div className="flex flex-col gap-1 text-sm text-zinc-700">
							{row.original.students.map((st) => (
								<div key={st.id} className="flex items-center gap-2">
									<span className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
									<span>
										{st.studentInfo
											? `${st.studentInfo.firstName} ${st.studentInfo.lastName}`
											: `#${st.studentSectionEnrollmentId}`}
									</span>
								</div>
							))}
						</div>
					) : (
						<span className="text-zinc-400">—</span>
					),
				meta: {
					headerClassName: 'w-[20%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'actions',
				header: t('projects.list.table.actions'),
				cell: ({ row }) => (
					<div className="flex justify-center gap-1">
						<Link
							href={`/academic-projects/projects/${row.original.id}/edit`}
							className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
							title={t('projects.list.table.edit')}>
							<PencilIcon className="h-4 w-4" />
						</Link>
						<button
							type="button"
							onClick={() => {
								setConfirmTarget(row.original);
								setDeleteError(null);
							}}
							disabled={!!row.original.hasEvaluations}
							className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
							title={t('projects.list.table.delete')}>
							<TrashIcon className="h-4 w-4" />
						</button>
					</div>
				),
				meta: {
					headerClassName: 'w-[10%] !whitespace-normal !text-center',
					cellClassName: 'text-center',
				},
			},
		],
		[t, locale, setConfirmTarget, setDeleteError],
	);
}
