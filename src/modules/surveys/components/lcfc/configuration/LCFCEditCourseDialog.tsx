'use client';

import React from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Select,
	Toggle,
	LoadingState,
} from '@/shared/components';
import { useI18n } from '@/providers';
import type { LCFCCourse, LCFCSectionCommission } from '../../../types';

interface LCFCEditCourseDialogProps {
	readonly editing: LCFCCourse | null;
	readonly onOpenChange: () => void;
	readonly editActive: boolean;
	readonly onEditActiveChange: (value: boolean) => void;
	readonly loadingCommissions: boolean;
	readonly sectionCommissions: LCFCSectionCommission[];
	readonly selectedCommissionId: number | null;
	readonly onSelectedCommissionChange: (value: number | null) => void;
	readonly saving: boolean;
	readonly onSave: () => void;
}

export function LCFCEditCourseDialog({
	editing,
	onOpenChange,
	editActive,
	onEditActiveChange,
	loadingCommissions,
	sectionCommissions,
	selectedCommissionId,
	onSelectedCommissionChange,
	saving,
	onSave,
}: LCFCEditCourseDialogProps) {
	const { t } = useI18n();

	return (
		<Dialog open={editing !== null} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('surveys.lcfc.config.editDialogTitle')}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					{editing && (
						<div className="text-sm text-zinc-600">
							<span className="font-semibold">{editing.courseName}</span>
							{editing.sectionCode ? (
								<span className="text-zinc-400"> · {editing.sectionCode}</span>
							) : null}
						</div>
					)}
					<Toggle
						label={t('surveys.lcfc.config.activeLabel')}
						checked={editActive}
						onChange={onEditActiveChange}
					/>
					{loadingCommissions ? (
						<LoadingState size="sm" />
					) : sectionCommissions.length === 0 ? (
						<p className="text-sm text-zinc-500 italic">
							{t('surveys.lcfc.config.noCommissionsForSection')}
						</p>
					) : (
						<Select
							name="commission"
							label={t('surveys.lcfc.config.commissionLabel')}
							placeholder={t('surveys.lcfc.config.commissionPlaceholder')}
							isSearchable
							options={sectionCommissions.map((c) => ({
								value: c.commissionId,
								label: `${c.code}${c.name ? ` — ${c.name}` : ''}`,
							}))}
							value={
								sectionCommissions
									.map((c) => ({
										value: c.commissionId,
										label: `${c.code}${c.name ? ` — ${c.name}` : ''}`,
									}))
									.find((c) => c.value === selectedCommissionId) ?? null
							}
							onChange={(_name, value) =>
								onSelectedCommissionChange(
									value && !Array.isArray(value) ? Number(value.value) : null,
								)
							}
						/>
					)}
				</div>
				<DialogFooter showCloseButton>
					<Button onClick={onSave} disabled={saving || !selectedCommissionId}>
						{t('surveys.lcfc.config.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
