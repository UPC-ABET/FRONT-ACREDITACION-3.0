'use client';

import React, { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
	Select,
	Button,
	Badge,
	DataTable,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Toast,
} from '@/shared/components';
import { SparklesIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useI18n, useABET } from '@/providers';
import { useLCFCConfiguration, useLCFCCycles } from '../../../hooks';
import type { LCFCCourse } from '../../../types';

export function LCFCConfiguration() {
	const { t } = useI18n();
	const { modalityTypeId } = useABET();
	const { cycles, load: loadCycles } = useLCFCCycles();
	const {
		courses,
		loading,
		error,
		load: loadConfig,
		generate,
		clone,
	} = useLCFCConfiguration();

	const [selectedCycle, setSelectedCycle] = useState<{ label: string; value: number } | null>(null);
	const [originCycle, setOriginCycle] = useState<{ label: string; value: number } | null>(null);
	const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		loadCycles(modalityTypeId);
	}, [modalityTypeId, loadCycles]);

	useEffect(() => {
		if (selectedCycle) loadConfig('1', selectedCycle.value);
	}, [selectedCycle, loadConfig]);

	useEffect(() => {
		if (error) setToast({ open: true, type: 'error', msg: error });
	}, [error]);

	function handleGenerate() {
		if (!selectedCycle) return;
		generate('1', selectedCycle.value, undefined, undefined, () => {
			setToast({ open: true, type: 'success', msg: t('surveys.lcfc.config.toastGenerated') });
			loadConfig('1', selectedCycle.value);
		});
	}

	function handleClone() {
		if (!selectedCycle || !originCycle) return;
		clone(originCycle.value, selectedCycle.value, () => {
			setCloneDialogOpen(false);
			setToast({ open: true, type: 'success', msg: t('surveys.lcfc.config.toastCloned') });
			loadConfig('1', selectedCycle.value);
		});
	}

	const cycleOptions = cycles.map((c) => ({ label: c.name, value: c.id }));

	const columns: ColumnDef<LCFCCourse>[] = [
		{ accessorKey: 'code', header: t('surveys.lcfc.config.colCode') },
		{ accessorKey: 'courseName', header: t('surveys.lcfc.config.colCourse') },
		{
			accessorKey: 'commissions',
			header: t('surveys.lcfc.config.colCommissions'),
			cell: ({ getValue }) => {
				// NOSONAR — cell renderers are render functions, not React components
				const list = getValue() as Array<{ commissionId: number; commissionName: string }>;
				return (
					<div className="flex flex-wrap gap-1">
						{list.map((c) => (
							<Badge key={c.commissionId} variant="outline">
								{c.commissionName}
							</Badge>
						))}
					</div>
				);
			},
		},
	];

	return (
		<div className="space-y-6">
			<div className="max-w-sm">
				<Select
					label={t('surveys.lcfc.config.cycleLabel')}
					options={cycleOptions}
					value={selectedCycle}
					onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
					placeholder={t('surveys.lcfc.config.cyclePlaceholder')}
					isSearchable
				/>
			</div>

			{selectedCycle && (
				<div className="flex gap-2">
					<Button size="sm" onClick={handleGenerate} disabled={loading}>
						<SparklesIcon className="h-4 w-4 mr-1" />
						{t('surveys.lcfc.config.generateButton')}
					</Button>
					<Button size="sm" variant="surface" onClick={() => setCloneDialogOpen(true)}>
						<DocumentDuplicateIcon className="h-4 w-4 mr-1" />
						{t('surveys.lcfc.config.cloneButton')}
					</Button>
				</div>
			)}

			{selectedCycle && (
				<DataTable
					columns={columns}
					data={courses}
					title={t('surveys.lcfc.config.coursesTitle').replace('{{count}}', String(courses.length))}
				/>
			)}

			<Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.lcfc.config.cloneDialogTitle')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<p className="text-sm text-zinc-600">
							{t('surveys.lcfc.config.cloneDialogBody').replace(
								'{{period}}',
								selectedCycle?.label ?? '',
							)}
						</p>
						<Select
							label={t('surveys.lcfc.config.originLabel')}
							options={cycleOptions.filter((c) => c.value !== selectedCycle?.value)}
							value={originCycle}
							onChange={(_, val) =>
								setOriginCycle(val as { label: string; value: number } | null)
							}
							placeholder={t('surveys.lcfc.config.originPlaceholder')}
						/>
					</div>
					<DialogFooter showCloseButton>
						<Button onClick={handleClone} disabled={!originCycle}>
							{t('surveys.lcfc.config.cloneConfirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
