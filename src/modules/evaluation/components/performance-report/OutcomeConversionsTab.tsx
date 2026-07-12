'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components';
import { useI18n } from '@/providers';
import { OutcomeConversionsMaintenance } from '@/modules/accreditation';
import { RebuildRvGradesButton } from './RebuildRvGradesButton';

interface OutcomeConversionsTabProps {
	readonly academicPeriodId: number | null;
}

// Conversions maintenance (accreditation) and the RV rebuild (evaluation) are two domains meeting
// on one screen: the maintenance widget renders the rebuild action in a slot, so accreditation
// never has to reach into evaluation.
export function OutcomeConversionsTab({ academicPeriodId }: OutcomeConversionsTabProps) {
	const { t } = useI18n();
	const [hasUnprocessedChanges, setHasUnprocessedChanges] = useState(false);

	return (
		<div className="space-y-6">
			{hasUnprocessedChanges && (
				<Alert variant="warning">
					<AlertTitle>{t('outcomeConversions.pendingRebuild.title')}</AlertTitle>
					<AlertDescription>{t('outcomeConversions.pendingRebuild.description')}</AlertDescription>
				</Alert>
			)}

			<OutcomeConversionsMaintenance
				onConversionsChanged={() => setHasUnprocessedChanges(true)}
				rebuildAction={
					<RebuildRvGradesButton
						disabled={academicPeriodId == null}
						highlighted={hasUnprocessedChanges}
						onRebuilt={() => setHasUnprocessedChanges(false)}
					/>
				}
			/>
		</div>
	);
}
