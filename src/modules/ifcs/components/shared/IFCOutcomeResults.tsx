'use client';

import { useI18n } from '@/providers';
import { Card } from '@/shared/components';
import { IFC_SHARED_LABELS } from './ifc.labels';
import type { ProgramGroup } from '../../types';

type Props = { outcomeResult: ProgramGroup[] };

export function IFCOutcomeResults({ outcomeResult }: Props) {
	const { locale: lang } = useI18n();
	if (!outcomeResult || outcomeResult.length === 0) return null;

	return (
		<Card title={IFC_SHARED_LABELS.sectionOutcome[lang]} className="h-full">
			<div className="space-y-6">
				{outcomeResult.map((program) => (
					<div key={program.programCode} className="space-y-3">
						<h3 className="text-sm font-bold uppercase tracking-wider text-red-700">
							{program.programName?.[lang] ?? program.programName?.es ?? ''}
						</h3>

						<div className="space-y-4 border-l-2 border-zinc-200 pl-4">
							{program.commissions.map((commission) => (
								<div
									key={`${program.programCode}-${commission.commissionCode}`}
									className="space-y-3">
									{commission.outcomes.map((outcome) => {
										const ref = [
											commission.commissionName?.[lang] ?? commission.commissionName?.es ?? '',
											outcome.outcomeCode,
										]
											.filter(Boolean)
											.join(' · ');
										return (
											<div
												key={`${commission.commissionCode}-${outcome.outcomeCode}`}
												className="space-y-1">
												<p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
													{IFC_SHARED_LABELS.studentOutcome[lang]} ({ref})
												</p>
												<p className="text-base italic leading-relaxed text-zinc-800">
													&ldquo;
													{outcome.outcomeDescription?.[lang] ??
														outcome.outcomeDescription?.es ??
														''}
													&rdquo;
												</p>
											</div>
										);
									})}
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}
