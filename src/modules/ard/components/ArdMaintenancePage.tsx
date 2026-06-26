'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
	Edit,
	Plus,
	Trash2,
} from 'lucide-react';
import {
	Button,
	Card,
	DataTable,
	PageHeader,
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { useArdMeetings, useArdMutations } from '../hooks';
import type { ArdMeetingSummary } from '../types';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 10;

export function ArdMaintenancePage() {
	const { t } = useI18n();
	const router = useRouter();
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const meetingsQuery = useArdMeetings({ page, pageSize: PAGE_SIZE, search });
	const { remove } = useArdMutations();

	const data = meetingsQuery.data;
	const rows = data?.items ?? [];

	const columns = useMemo<ColumnDef<ArdMeetingSummary>[]>(
		() => [
			{ accessorKey: 'meetingDate', header: t('ard.header.meetingDate') },
			{ accessorKey: 'campusName', header: t('ard.header.campus') },
			{ accessorKey: 'attendeeCount', header: t('ard.maintenance.attendees') },
			{ accessorKey: 'commentCount', header: t('ard.maintenance.comments') },
			{
				id: 'actions',
				header: t('ard.table.actions'),
				cell: ({ row }) => (
					<div className="flex gap-2">
						<Button
							variant="surface"
							size="icon"
							title={t('ard.actions.edit')}
							aria-label={t('ard.actions.edit')}
							onClick={() => router.push(`/ard?edit=${row.original.id}`)}>
							<Edit className="h-4 w-4" />
						</Button>
						<Button
							variant="surface"
							size="icon"
							title={t('ard.actions.delete')}
							aria-label={t('ard.actions.delete')}
							onClick={() => {
								if (window.confirm(t('ard.messages.confirmDelete'))) {
									void remove.mutateAsync(row.original.id);
								}
							}}>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				),
			},
		],
		[remove, router, t],
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('ard.maintenance.title')}
				description={t('ard.maintenance.description')}
				action={
					<Button onClick={() => router.push('/ard')}>
						<Plus className="h-4 w-4" />
						{t('ard.actions.new')}
					</Button>
				}
			/>
			<Card>
				<DataTable
					columns={columns}
					data={rows}
					searchValue={search}
					onSearchChange={(value) => {
						setSearch(value);
						setPage(1);
					}}
					isLoading={meetingsQuery.isLoading}
					emptyMessage={t('ard.table.empty')}
					serverPagination={{
						page,
						pageCount: data?.totalPages ?? 1,
						total: data?.total ?? 0,
						onPageChange: setPage,
						isFetching: meetingsQuery.isFetching,
					}}
					aria-label={t('ard.maintenance.title')}
				/>
			</Card>
		</div>
	);
}
