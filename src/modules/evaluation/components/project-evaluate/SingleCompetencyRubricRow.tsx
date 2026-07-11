'use client';

import { JSX } from 'react';
import type { RubricQuestionDetailsResponse, ProjectDetailsStudentResponse } from '@/modules';
import { SingleCompetencyScoreInput } from './SingleCompetencyScoreInput';
import { fmtNum, validateScore } from './singleCompetencyRubricUtils';
import type { Scores, DupScores } from './singleCompetencyRubricUtils';

interface SingleCompetencyRubricRowProps {
	question: RubricQuestionDetailsResponse;
	range: { min: number; max: number };
	locale: string;
	duplicateMode: boolean;
	dupScores: DupScores;
	scores: Scores;
	students: ProjectDetailsStudentResponse[];
	nonAttendanceTypeIds: Set<number>;
	qualifStatuses: Record<number, number | null>;
	msgNaN: string;
	msgRange: string;
	readOnly: boolean;
	onDupScore: (qId: number, val: string) => void;
	onScore: (qId: number, stIdx: number, val: string) => void;
}

export function SingleCompetencyRubricRow({
	question: q,
	range,
	locale,
	duplicateMode,
	dupScores,
	scores,
	students,
	nonAttendanceTypeIds,
	qualifStatuses,
	msgNaN,
	msgRange,
	readOnly,
	onDupScore,
	onScore,
}: SingleCompetencyRubricRowProps): JSX.Element {
	const questionText = q.text[locale as 'es' | 'en'] ?? q.text.es;

	return (
		<tr key={q.id} className="align-middle">
			<td className="px-4 py-4">
				<p className="text-xs leading-snug text-zinc-700">{questionText}</p>
			</td>

			<td className="px-4 py-4">
				<div className="flex gap-2">
					{q.criterias.map((c) => {
						const minF = fmtNum(c.minValue);
						const maxF = fmtNum(c.maxValue);
						const desc = c.text[locale as 'es' | 'en'] ?? c.text.es;
						return (
							<div
								key={c.id}
								className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-600">
								<p className="mb-1 font-bold tabular-nums text-zinc-700">
									{minF} – {maxF}
								</p>
								<p className="leading-snug">{desc}</p>
							</div>
						);
					})}
				</div>
			</td>

			<td className="px-4 py-4 text-center">
				{duplicateMode ? (
					<div className="flex justify-center">
						<SingleCompetencyScoreInput
							value={dupScores[q.id] ?? ''}
							min={range.min}
							max={range.max}
							error={validateScore(dupScores[q.id] ?? '', range, msgNaN, msgRange)}
							onChange={(val) => onDupScore(q.id, val)}
							disabled={readOnly}
						/>
					</div>
				) : (
					<div className="flex flex-col items-center gap-3">
						{students
							.map((st, stIdx) => ({ st, stIdx }))
							.filter(({ st }) => !nonAttendanceTypeIds.has(qualifStatuses[st.id] ?? -1))
							.map(({ st, stIdx }) => {
								const val = scores[q.id]?.[stIdx] ?? '';
								return (
									<div key={stIdx} className="flex items-center gap-2">
										<span className="min-w-0 truncate text-xs font-medium text-zinc-700">
											{st.firstName} {st.lastName}
										</span>
										<SingleCompetencyScoreInput
											value={val}
											min={range.min}
											max={range.max}
											error={validateScore(val, range, msgNaN, msgRange)}
											onChange={(v) => onScore(q.id, stIdx, v)}
											disabled={readOnly}
										/>
									</div>
								);
							})}
					</div>
				)}
			</td>
		</tr>
	);
}
