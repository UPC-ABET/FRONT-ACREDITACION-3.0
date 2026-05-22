'use client';

import { useI18n } from '@/providers';
import { Card } from '@/shared/components';
import { IFC_SHARED_LABELS } from './ifc.labels';
import type { ProgramGroup } from '../../services/types';

type Props = { outcomeResult: ProgramGroup[] };

export function IFCResultadoLogros({ outcomeResult }: Props) {
	const { locale: lang } = useI18n();
	if (!outcomeResult || outcomeResult.length === 0) return null;

	return (
		<Card title={IFC_SHARED_LABELS.section_outcome[lang]} className="h-full">
			<div className="space-y-6">
				{outcomeResult.map((program) => (
					<div key={program.program_code} className="space-y-3">
						<h3 className="text-sm font-bold uppercase tracking-wider text-red-700">
							{program.program_name?.[lang] ?? program.program_name?.es ?? ''}
						</h3>

						<div className="space-y-4 border-l-2 border-zinc-200 pl-4">
							{program.commissions.map((commission) => (
								<div
									key={`${program.program_code}-${commission.commission_code}`}
									className="space-y-3">
									{commission.outcomes.map((outcome) => {
										const ref = [
											commission.commission_name?.[lang] ??
												commission.commission_name?.es ??
												'',
											outcome.outcome_code,
										]
											.filter(Boolean)
											.join(' · ');
										return (
											<div
												key={`${commission.commission_code}-${outcome.outcome_code}`}
												className="space-y-1">
												<p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
													{IFC_SHARED_LABELS.student_outcome[lang]} ({ref})
												</p>
												<p className="text-base italic leading-relaxed text-zinc-800">
													&ldquo;
													{outcome.outcome_description?.[lang] ??
														outcome.outcome_description?.es ??
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
