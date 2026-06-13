'use client';
import { TrashIcon } from '@heroicons/react/24/outline';
import { CriteriaCell } from './CriteriaCell';
import { QuestionCell } from './QuestionCell';
import type { RubricQuestion } from '../../types';
import { useState } from 'react';

interface RubricTableProps {
	questions: RubricQuestion[];
	columnCount: number;
	canEdit: boolean;
	locale: 'en' | 'es';
	questionLabelPrefix: string;
	questionPlaceholder: string;
	criteriaHeader: string;
	criteriaPlaceholder: string;
	minScoreLabel: string;
	maxScoreLabel: string;
	onDeleteColumn: (colIndex: number) => void;
	onDeleteRow: (rowIndex: number) => void;
	onQuestionTextChange: (rowIndex: number, text: string) => void;
	onCriteriaTextChange: (rowIndex: number, colIndex: number, text: string) => void;
	onCriteriaMinChange: (rowIndex: number, colIndex: number, v: number | '') => void;
	onCriteriaMaxChange: (rowIndex: number, colIndex: number, v: number | '') => void;
}

export function RubricTable({
	questions,
	columnCount,
	canEdit,
	locale,
	questionLabelPrefix,
	questionPlaceholder,
	criteriaHeader,
	criteriaPlaceholder,
	minScoreLabel,
	maxScoreLabel,
	onDeleteColumn,
	onDeleteRow,
	onQuestionTextChange,
	onCriteriaTextChange,
	onCriteriaMinChange,
	onCriteriaMaxChange,
}: RubricTableProps) {
	const [hoveredCol, setHoveredCol] = useState<number | null>(null);
	const [hoveredRow, setHoveredRow] = useState<number | null>(null);

	return (
		<div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
			<table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
				<thead>
					<tr className="border-b border-zinc-200 bg-zinc-50">
						{canEdit ? <th className="w-8 border-r border-zinc-100 p-2" /> : null}

						<th className="w-56 p-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
							{questionLabelPrefix}
						</th>

						{Array.from({ length: columnCount }).map((_, colIndex) => (
							<th
								key={colIndex}
								className={`w-[200px] border-l border-zinc-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 transition-colors duration-300 ${
									hoveredCol === colIndex ? 'bg-red-50' : ''
								}`}>
								<div className="flex items-center justify-between gap-2">
									<span
										className={`transition-colors duration-300 ${hoveredCol === colIndex ? 'text-red-600' : 'text-zinc-600'}`}>
										{criteriaHeader} {colIndex + 1}
									</span>

									{canEdit && columnCount > 1 ? (
										<button
											type="button"
											aria-label={`Delete criteria column ${colIndex + 1}`}
											className="shrink-0 rounded p-1 text-zinc-400 transition-colors duration-300 hover:text-red-600 cursor-pointer"
											onMouseEnter={() => setHoveredCol(colIndex)}
											onMouseLeave={() => setHoveredCol(null)}
											onClick={() => onDeleteColumn(colIndex)}>
											<TrashIcon
												className={`h-3.5 w-3.5 transition-colors duration-300 ${hoveredCol === colIndex ? 'text-red-500' : ''}`}
											/>
										</button>
									) : null}
								</div>
							</th>
						))}
					</tr>
				</thead>

				<tbody>
					{questions.map((question, rowIndex) => (
						<tr
							key={question.id ?? `row-${rowIndex}`}
							className="border-b border-zinc-100 last:border-b-0">
							{canEdit ? (
								<td
									className={`w-8 border-r border-zinc-100 align-middle transition-colors duration-300 ${
										hoveredRow === rowIndex ? 'bg-red-50' : ''
									}`}>
									{questions.length > 1 ? (
										<div className="flex items-center justify-center h-fit py-3 ">
											<button
												type="button"
												aria-label={`Delete question ${rowIndex + 1}`}
												className="rounded text-zinc-400 transition-colors duration-300 cursor-pointer"
												onMouseEnter={() => setHoveredRow(rowIndex)}
												onMouseLeave={() => setHoveredRow(null)}
												onClick={() => questions.length > 1 && onDeleteRow(rowIndex)}>
												<TrashIcon
													className={`h-4 w-4 transition-colors duration-300 ${hoveredRow === rowIndex ? 'text-red-500' : ''}`}
												/>
											</button>
										</div>
									) : null}
								</td>
							) : null}

							<td
								className={`align-top transition-colors duration-300 ${hoveredRow === rowIndex ? 'bg-red-50' : ''}`}>
								<QuestionCell
									questionText={question.questionText[locale]}
									questionIndex={rowIndex}
									canEdit={canEdit}
									labelPrefix={questionLabelPrefix}
									placeholder={questionPlaceholder}
									onTextChange={(text) => onQuestionTextChange(rowIndex, text)}
									isHovered={hoveredRow === rowIndex}
								/>
							</td>

							{Array.from({ length: columnCount }).map((_, colIndex) => {
								const cell = question.criteria[colIndex];
								const isColHovered = hoveredCol === colIndex;
								const isRowHovered = hoveredRow === rowIndex;
								return (
									<td
										key={`${rowIndex}-${colIndex}`}
										className={`align-top border-l border-zinc-100 transition-colors duration-300 ${
											isColHovered || isRowHovered ? 'bg-red-50' : ''
										}`}>
										{cell ? (
											<CriteriaCell
												criteriaText={cell.criteriaText[locale]}
												minValue={cell.minValue}
												maxValue={cell.maxValue}
												canEdit={canEdit}
												criteriaPlaceholder={criteriaPlaceholder}
												minScoreLabel={minScoreLabel}
												maxScoreLabel={maxScoreLabel}
												onTextChange={(text) => onCriteriaTextChange(rowIndex, colIndex, text)}
												onMinChange={(v) => onCriteriaMinChange(rowIndex, colIndex, v)}
												onMaxChange={(v) => onCriteriaMaxChange(rowIndex, colIndex, v)}
											/>
										) : null}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
