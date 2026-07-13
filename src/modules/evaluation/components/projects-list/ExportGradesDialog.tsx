'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
	Button,
} from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/Select';
import { useI18n } from '@/providers';
import type { TypeOption } from '@/modules/core';
import type { useExportProjectGrades } from '@/modules';

type SelectOption = { label: string; value: number };

interface ExportGradesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	competencyScopeOptions: SelectOption[];
	selectedCompetencyScopeId: number | null;
	setSelectedCompetencyScopeId: (id: number | null) => void;
	selectedCompetencyScope: TypeOption | null;
	exportError: string | null;
	setExportError: (error: string | null) => void;
	exportMutation: ReturnType<typeof useExportProjectGrades>;
	selectedPeriodId: number | null;
	schoolId: number | null;
	setExportOpen: (open: boolean) => void;
}

export function ExportGradesDialog({
	open,
	onOpenChange,
	competencyScopeOptions,
	selectedCompetencyScopeId,
	setSelectedCompetencyScopeId,
	selectedCompetencyScope,
	exportError,
	setExportError,
	exportMutation,
	selectedPeriodId,
	schoolId,
	setExportOpen,
}: ExportGradesDialogProps) {
	const { t, locale } = useI18n();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{t('projects.list.exportModal.title')}</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<Select
						label={t('projects.list.exportModal.competencyScopeLabel')}
						options={competencyScopeOptions}
						value={
							selectedCompetencyScopeId !== null
								? (competencyScopeOptions.find((o) => o.value === selectedCompetencyScopeId) ??
									null)
								: null
						}
						onChange={(_, opt) => {
							const single = Array.isArray(opt) ? opt[0] : opt;
							if (single) setSelectedCompetencyScopeId(Number(single.value));
						}}
						isSearchable
					/>
					{exportError && <p className="text-xs text-red-600">{exportError}</p>}
				</div>
				<DialogFooter>
					<DialogClose
						render={
							<Button variant="secondary" disabled={exportMutation.isPending}>
								{t('dialog.close')}
							</Button>
						}
					/>
					<Button
						variant="primary"
						disabled={exportMutation.isPending || !selectedCompetencyScope}
						onClick={() => {
							if (!selectedPeriodId || !schoolId || !selectedCompetencyScope) return;
							setExportError(null);
							const competencyScopeLabel =
								selectedCompetencyScope.name[locale as 'es' | 'en'] ??
								selectedCompetencyScope.name.es;
							const sanitizedScope = competencyScopeLabel.trim().replace(/\s+/g, '-').toLowerCase();
							const filename = `${t('projects.list.exportModal.filename')}-${sanitizedScope}.xlsx`;
							exportMutation.mutate(
								{
									competencyScopeCode: selectedCompetencyScope.code,
									filename,
								},
								{
									onSuccess: () => setExportOpen(false),
									onError: () => setExportError(t('projects.list.exportModal.error')),
								},
							);
						}}>
						{exportMutation.isPending
							? t('projects.list.exportModal.exporting')
							: t('projects.list.exportModal.confirm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
