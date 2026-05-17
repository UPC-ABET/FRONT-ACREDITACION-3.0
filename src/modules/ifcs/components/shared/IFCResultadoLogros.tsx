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
		<Card title={IFC_SHARED_LABELS.section_outcome[lang]}>
			<div className="space-y-6">
				{outcomeResult.map((program) => (
					<div key={program.program_code} className="space-y-3">
						<h3 className="text-sm font-bold uppercase tracking-wide text-zinc-700">
							{program.program_name?.[lang] ?? program.program_name?.es ?? ''}
						</h3>

						<div className="space-y-3 pl-2">
							{program.commissions.map((commission) => (
								<div
									key={`${program.program_code}-${commission.commission_code}`}
									className="space-y-2">
									{commission.outcomes.map((outcome) => {
										const ref = [
											program.program_name?.[lang] ?? program.program_name?.es ?? '',
											commission.commission_name?.[lang] ?? commission.commission_name?.es ?? '',
											outcome.outcome_code,
										]
											.filter(Boolean)
											.join(' · ');
										return (
											<div key={`${commission.commission_code}-${outcome.outcome_code}`}>
												<p className="text-xs font-semibold uppercase text-zinc-500">
													{IFC_SHARED_LABELS.student_outcome[lang]} ({ref})
												</p>
												<p className="text-sm text-zinc-700 italic">
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
