'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import {
	Alert,
	Button,
	Card,
	DataTable,
	PageHeader,
	TableLoadingState,
} from '@/shared/components/ui';
import { useABET, useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import { useArdById } from '../hooks';
import type { ArdDetailView } from '../types';
import { ArdDetailEditor } from './ArdDetailEditor';

export function ArdViewPage() {
	const { t, locale } = useI18n();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const searchParams = useSearchParams();
	const ardId = Number(params.id);
	const { academicPeriodId } = useABET();

	const ardQuery = useArdById(Number.isFinite(ardId) ? ardId : null);
	const ard = ardQuery.data ?? null;

	const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1');

	const localize = (text?: I18nText) => text?.[locale] ?? text?.es ?? text?.en ?? '';

	const columns = useMemo<ColumnDef<ArdDetailView>[]>(
		() => [
			{
				id: 'student',
				header: t('ard.table.fullName'),
				cell: ({ row }) =>
					[row.original.studentCode, row.original.studentFullName].filter(Boolean).join(' - '),
			},
			{
				id: 'course',
				header: t('ard.table.course'),
				cell: ({ row }) => `${row.original.courseCode} - ${localize(row.original.courseName)}`,
			},
			{
				id: 'professor',
				header: t('ard.table.professor'),
				cell: ({ row }) => `${row.original.professorCode} - ${row.original.professorFullName}`,
			},
			{
				id: 'comment',
				header: t('ard.details.comment'),
				cell: ({ row }) => localize(row.original.comments),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps -- localize depends on locale
		[t, locale],
	);

	if (ardQuery.isLoading) {
		return <TableLoadingState label={t('ard.loading')} />;
	}

	if (ardQuery.isError || !ard) {
		return (
			<div className="space-y-6">
				<PageHeader title={t('ard.view.title')} />
				<Alert variant="warning">
					{t('ard.view.notFound')}{' '}
					<Link href="/ard" className="font-semibold underline">
						{t('ard.flow.backToOverview')}
					</Link>
				</Alert>
			</div>
		);
	}

	const exitToView = () => {
		setIsEditing(false);
		router.replace(`/ard/${ard.id}`);
	};

	if (isEditing) {
		if (academicPeriodId === null || academicPeriodId !== ard.academicPeriodId) {
			return (
				<div className="space-y-6">
					<PageHeader title={ard.code} />
					<Alert variant="warning">{t('ard.edit.periodMismatch')}</Alert>
					<Button variant="surface" onClick={exitToView}>
						{t('ard.actions.cancel')}
					</Button>
				</div>
			);
		}
		return (
			<ArdDetailEditor
				ard={ard}
				onDone={() => {
					exitToView();
					void ardQuery.refetch();
				}}
				onCancel={exitToView}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title={ard.code}
				description={t('ard.view.description')}
				action={
					<Button onClick={() => setIsEditing(true)}>
						<Pencil className="h-4 w-4" />
						{t('ard.actions.edit')}
					</Button>
				}
			/>

			<Card>
				<dl className="grid gap-4 sm:grid-cols-3">
					<div>
						<dt className="text-xs text-zinc-500">{t('ard.table.meetingDate')}</dt>
						<dd className="text-sm font-medium text-zinc-900">{ard.meetingDate.slice(0, 10)}</dd>
					</div>
					<div>
						<dt className="text-xs text-zinc-500">{t('ard.table.campus')}</dt>
						<dd className="text-sm font-medium text-zinc-900">{ard.campusCode}</dd>
					</div>
					<div>
						<dt className="text-xs text-zinc-500">{t('ard.table.program')}</dt>
						<dd className="text-sm font-medium text-zinc-900">{localize(ard.programName)}</dd>
					</div>
				</dl>
			</Card>

			<DataTable
				columns={columns}
				data={ard.details}
				showSearch={false}
				emptyMessage={t('ard.view.noDetails')}
				aria-label={t('ard.view.title')}
			/>

			<div>
				<Link href="/ard" className="text-sm font-medium text-zinc-500 hover:text-zinc-700">
					{t('ard.flow.backToOverview')}
				</Link>
			</div>
		</div>
	);
}
