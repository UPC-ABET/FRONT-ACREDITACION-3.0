'use client';

import { Button } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { CommissionTabs } from './CommissionTabs';
import { CommissionValidator } from './CommissionValidator';
import { CriteriaInlineRow } from './CriteriaInlineRow';
import { OutcomeCard } from './OutcomeCard';
import { verificationOutcomes } from '../../utils/capstoneUtils';
import { PerformanceLevelsSummary } from './PerformanceLevelsSummary';
import type { RubricDetail } from '../../types';
import { useRubricCapstoneState } from '../../hooks/useRubricCapstoneState';
import { useRubricCapstoneCriteria } from '../../hooks/useRubricCapstoneCriteria';
import { useRubricCapstoneSave } from '../../hooks/useRubricCapstoneSave';

interface RubricEditorMultipleCompetencyProps {
	rubric: RubricDetail;
	rubricId: string;
	canEdit: boolean;
	queryKey: readonly unknown[];
	onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
	messages: { autosaveRetry: string; saveSuccess: string };
}

export function RubricEditorMultipleCompetency({
	rubric,
	rubricId,
	canEdit,
	queryKey,
	onNotify,
	messages,
}: RubricEditorMultipleCompetencyProps) {
	const { t, locale } = useI18n();

	const { draftRubric, activeCommissionId, setActiveCommissionId, activeCommission, mergeRubric } =
		useRubricCapstoneState({ rubric, queryKey });

	const { saveAllowed, isSaving, handleSave } = useRubricCapstoneSave({
		rubricId,
		draftRubric,
		canEdit,
		onNotify,
		saveSuccessMessage: messages.saveSuccess,
	});

	const {
		savingKey,
		handleAddCriteria,
		handlePatchCriteria,
		handleCreateCriteria,
		handleDeleteCriteria,
		handleDeleteCriteriaLocal,
		handleTextChange,
	} = useRubricCapstoneCriteria({ locale, mergeRubric });

	if (!rubric.commissions.length) {
		return (
			<p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
				{t('rubrics.editor.capstone.noCommissions')}
			</p>
		);
	}

	return (
		<div className="space-y-6">
			<CommissionTabs
				commissions={draftRubric.commissions}
				activeCommissionId={activeCommissionId}
				onCommissionChange={setActiveCommissionId}
				checkboxTooltipIncomplete={t(
					'rubrics.editor.capstone.tooltips.commissionCheckboxIncomplete',
				)}
			/>

			<PerformanceLevelsSummary levels={rubric.performanceLevels} />

			{activeCommission ? (
				<div className="space-y-4">
					{verificationOutcomes(activeCommission).map((outcome) => (
						<OutcomeCard
							key={outcome.id}
							outcome={outcome}
							canEdit={canEdit}
							emptyMessage={t('rubrics.editor.capstone.validation.emptyOutcomeReadonly')}
							emptyMessageWithHint={t('rubrics.editor.capstone.validation.emptyOutcome')}
							onAdd={
								canEdit ? () => handleAddCriteria(activeCommission.id, outcome.id) : undefined
							}>
							{(outcome.questions[0]?.criteria ?? []).map((criterion, index) => (
								<CriteriaInlineRow
									key={criterion.id}
									criterion={criterion}
									index={index}
									canEdit={canEdit}
									isSaving={
										savingKey === criterion.id ||
										(criterion.id.startsWith('temp-') && savingKey === `${outcome.id}__create`)
									}
									savingLabel={t('rubrics.editor.criteria.saving')}
									placeholder={t('rubrics.editor.capstone.criteria.criteriaPlaceholder')}
									criteriaLabelPrefix={t('rubrics.editor.capstone.criteria.criteriaLabel')}
									onTextChange={(criteriaId, text) =>
										handleTextChange(activeCommission.id, outcome.id, criteriaId, text)
									}
									onPatch={(criteriaId, text) =>
										handlePatchCriteria(activeCommission.id, outcome.id, criteriaId, text)
									}
									onCreate={(text) => handleCreateCriteria(activeCommission.id, outcome.id, text)}
									onDeletePersisted={(criteriaId) =>
										handleDeleteCriteria(activeCommission.id, outcome.id, criteriaId)
									}
									onDeleteLocal={(criteriaId) =>
										handleDeleteCriteriaLocal(activeCommission.id, outcome.id, criteriaId)
									}
									onNotifyRetry={() => onNotify('warning', messages.autosaveRetry)}
									onConfirmDelete={() => true}
								/>
							))}
						</OutcomeCard>
					))}
				</div>
			) : null}

			<CommissionValidator
				commissions={draftRubric.commissions}
				locale={locale}
				labelComplete={t('rubrics.editor.capstone.validation.validationComplete')}
				labelIncomplete={t('rubrics.editor.capstone.validation.validationIncomplete')}
			/>

			<div className="flex flex-col items-end gap-2">
				{!saveAllowed && (
					<p className="text-xs text-zinc-500" role="status">
						{t('rubrics.editor.capstone.tooltips.saveDisabled')}
					</p>
				)}
				<Button
					type="button"
					variant="primary"
					disabled={!canEdit || !saveAllowed || isSaving}
					onClick={() => void handleSave()}
					loading={isSaving}>
					{t('rubrics.editor.capstone.saveRubric')}
				</Button>
			</div>
		</div>
	);
}
