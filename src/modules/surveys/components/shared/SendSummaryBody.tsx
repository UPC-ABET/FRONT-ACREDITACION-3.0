'use client';

import type { GRASendSummary } from '../../types';

interface SendSummaryBodyProps {
	readonly loading: boolean;
	readonly summary: GRASendSummary | null;
	readonly loadingLabel: string;
	readonly emptyMessage: string;
	readonly programsLabel: string;
	readonly studentsLabel: string;
	readonly byProgramTitle: string;
}

/** Shared preview body for survey "send" confirmation dialogs (GRA, LCFC): shows how many
 *  careers/students a send would reach, grouped by career, before the user confirms. */
export function SendSummaryBody({
	loading,
	summary,
	loadingLabel,
	emptyMessage,
	programsLabel,
	studentsLabel,
	byProgramTitle,
}: SendSummaryBodyProps) {
	if (loading) return <p className="text-sm text-zinc-500 italic">{loadingLabel}</p>;
	if (!summary) return null;
	if (summary.totalStudents === 0) {
		return (
			<p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">{emptyMessage}</p>
		);
	}
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
					<p className="text-xs font-medium uppercase text-zinc-500">{programsLabel}</p>
					<p className="mt-1 text-2xl font-semibold text-zinc-900">{summary.totalPrograms}</p>
				</div>
				<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
					<p className="text-xs font-medium uppercase text-zinc-500">{studentsLabel}</p>
					<p className="mt-1 text-2xl font-semibold text-zinc-900">{summary.totalStudents}</p>
				</div>
			</div>

			<div>
				<p className="text-xs font-medium text-zinc-500 mb-1">{byProgramTitle}</p>
				<div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100 max-h-48 overflow-y-auto">
					{summary.byProgram.map((row) => (
						<div
							key={row.programId}
							className="flex items-center justify-between px-3 py-1.5 text-sm">
							<span className="text-zinc-700">{row.programName}</span>
							<span className="font-semibold text-zinc-900">{row.studentCount}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
