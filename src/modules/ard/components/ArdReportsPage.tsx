'use client';

import { useState } from 'react';
import {
	CalendarDays,
	Download,
	FileText,
} from 'lucide-react';
import {
	Button,
	Card,
	Input,
	PageHeader,
	Select,
} from '@/shared/components/ui';
import { triggerBlobDownload } from '@/shared/lib';
import { useABET, useI18n } from '@/providers';
import { useAcademicPeriods, useCampuses, useProgramsByModality } from '@/modules/academic';
import { useArdReportExport } from '../hooks';

type ReportView = 'acts' | 'attendance';

export function ArdReportsPage() {
	const { t } = useI18n();
	const [activeView, setActiveView] = useState<ReportView>('acts');

	return (
		<div className="space-y-6">
			<PageHeader title={t('ard.reports.title')} description={t('ard.reports.description')} />
			<div className="grid gap-6 lg:grid-cols-[280px_1fr]">
				<Card>
					<nav className="space-y-2" aria-label={t('ard.reports.title')}>
						<button
							type="button"
							onClick={() => setActiveView('acts')}
							className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left ${
								activeView === 'acts' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:bg-zinc-50'
							}`}>
							<FileText className="h-4 w-4" />
							{t('ard.reports.acts')}
						</button>
						<button
							type="button"
							onClick={() => setActiveView('attendance')}
							className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left ${
								activeView === 'attendance'
									? 'bg-red-600 text-white'
									: 'text-zinc-500 hover:bg-zinc-50'
							}`}>
							<CalendarDays className="h-4 w-4" />
							{t('ard.reports.attendance')}
						</button>
					</nav>
				</Card>
				<ArdReportForm activeView={activeView} />
			</div>
		</div>
	);
}

function ArdReportForm({ activeView }: { activeView: ReportView }) {
	const { t, locale } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();
	const [programId, setProgramId] = useState<number | null>(null);
	const [periodId, setPeriodId] = useState<number | null>(academicPeriodId);
	const [meetingDate, setMeetingDate] = useState('');
	const [campusId, setCampusId] = useState<number | null>(null);
	const { data: programs = [] } = useProgramsByModality(modalityTypeId);
	const { data: periods = [] } = useAcademicPeriods({});
	const { data: campuses = [] } = useCampuses();
	const { exportActs, exportAttendance } = useArdReportExport();

	const programOptions = programs.map((program) => ({
		label: program.name[locale],
		value: program.id,
	}));
	const periodOptions = periods.map((period) => ({ label: period.code, value: period.id }));
	const campusOptions = campuses.map((campus) => ({
		label: campus.name[locale],
		value: campus.id,
	}));

	const exportReport = async () => {
		const filters = {
			programId: programId ?? undefined,
			academicPeriodId: periodId ?? undefined,
			meetingDate: meetingDate || undefined,
			campusId: campusId ?? undefined,
		};
		const blob =
			activeView === 'acts'
				? await exportActs.mutateAsync(filters)
				: await exportAttendance.mutateAsync(filters);
		triggerBlobDownload(blob, activeView === 'acts' ? 'ard-actas.xlsx' : 'ard-asistencia.xlsx');
	};

	return (
		<Card title={t('ard.reports.generalData')}>
			<div className="grid gap-6 md:grid-cols-2">
				{activeView === 'acts' ? (
					<>
						<Select
							label={t('ard.reports.program')}
							value={programOptions.find((option) => option.value === programId) ?? null}
							options={programOptions}
							onChange={(_, option) => {
								const selected = Array.isArray(option) ? option[0] : option;
								setProgramId(selected ? Number(selected.value) : null);
							}}
						/>
						<Select
							label={t('ard.reports.period')}
							value={periodOptions.find((option) => option.value === periodId) ?? null}
							options={periodOptions}
							onChange={(_, option) => {
								const selected = Array.isArray(option) ? option[0] : option;
								setPeriodId(selected ? Number(selected.value) : null);
							}}
						/>
						<Input label={t('ard.reports.area')} value={t('ard.reports.all')} disabled />
						<Input label={t('ard.reports.subArea')} value={t('ard.reports.all')} disabled />
					</>
				) : (
					<>
						<Input
							type="date"
							label={t('ard.header.meetingDate')}
							value={meetingDate}
							onChange={(event) => setMeetingDate(event.target.value)}
						/>
						<Select
							label={t('ard.header.campus')}
							value={campusOptions.find((option) => option.value === campusId) ?? null}
							options={campusOptions}
							onChange={(_, option) => {
								const selected = Array.isArray(option) ? option[0] : option;
								setCampusId(selected ? Number(selected.value) : null);
							}}
						/>
					</>
				)}
			</div>
			<div className="mt-8 flex justify-end">
				<Button onClick={exportReport} loading={exportActs.isPending || exportAttendance.isPending}>
					<Download className="h-4 w-4" />
					{activeView === 'acts' ? t('ard.reports.export') : t('ard.reports.exportAttendance')}
				</Button>
			</div>
		</Card>
	);
}
