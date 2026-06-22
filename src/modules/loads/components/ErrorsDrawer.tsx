'use client';

import { useEffect, useState } from 'react';
import { Button, SubTitle, Title } from '@/shared/components';
import { useI18n } from '@/providers';
import { useParseErrorExcel } from '../hooks';
import type { ParsedErrorRow } from '../types';

interface ErrorsDrawerProps {
	open: boolean;
	onClose: () => void;
	excelBase64: string | null;
	onResubmitRow?: (row: ParsedErrorRow) => Promise<void>;
}

export default function ErrorsDrawer({
	open,
	onClose,
	excelBase64,
	onResubmitRow,
}: ErrorsDrawerProps) {
	const { t } = useI18n();
	const parse = useParseErrorExcel();
	const [rows, setRows] = useState<ParsedErrorRow[]>([]);
	const [editing, setEditing] = useState<number | null>(null);
	const [draftCells, setDraftCells] = useState<Record<string, string>>({});
	const [resubmitting, setResubmitting] = useState(false);

	useEffect(() => {
		if (!open || !excelBase64) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- clear parsed rows when the drawer closes or has no source workbook
			setRows([]);
			return;
		}
		parse(excelBase64)
			.then(setRows)
			.catch(() => setRows([]));
	}, [open, excelBase64, parse]);

	if (!open) return null;

	const handleEditStart = (row: ParsedErrorRow) => {
		setEditing(row.rowNumber);
		setDraftCells({ ...row.cells });
	};

	const handleResubmit = async (row: ParsedErrorRow) => {
		if (!onResubmitRow) return;
		setResubmitting(true);
		try {
			await onResubmitRow({ ...row, cells: draftCells });
			setRows((prev) => prev.filter((r) => r.rowNumber !== row.rowNumber));
			setEditing(null);
		} finally {
			setResubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex">
			<button
				type="button"
				aria-label={t('dialog.close')}
				className="flex-1 bg-black/30"
				onClick={onClose}
			/>
			<aside className="flex w-full max-w-xl flex-col overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-xl">
				<header className="mb-4 flex items-center justify-between">
					<div>
						<Title
							title={t('uploadHistory.drawer.title')}
							className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
						/>
						<SubTitle
							name={`${rows.length} ${t('uploadHistory.drawer.rowsWithErrors')}`}
							className="[&_h3]:text-xs [&_h3]:font-normal [&_h3]:text-gray-500"
						/>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-2xl text-gray-400 hover:text-gray-600"
						aria-label={t('uploadHistory.drawer.close')}>
						×
					</button>
				</header>

				{rows.length === 0 && (
					<p className="py-8 text-center text-sm text-gray-400">
						{t('uploadHistory.drawer.empty')}
					</p>
				)}

				<ul className="space-y-3">
					{rows.map((row) => {
						const isEditing = editing === row.rowNumber;
						return (
							<li key={row.rowNumber} className="rounded-lg border border-red-200 bg-red-50 p-3">
								<div className="flex items-start justify-between">
									<div className="text-sm">
										<p className="font-semibold text-red-800">
											{t('uploadHistory.drawer.row')} {row.rowNumber}
										</p>
										<ul className="mt-1 list-disc pl-5 text-xs text-red-700">
											{row.messages.map((m, i) => (
												<li key={i}>{m}</li>
											))}
										</ul>
									</div>
									{onResubmitRow && !isEditing && (
										<Button variant="secondary" onClick={() => handleEditStart(row)}>
											{t('uploadHistory.drawer.editInline')}
										</Button>
									)}
								</div>

								{isEditing && (
									<div className="mt-3 space-y-2 border-t border-red-200 pt-2">
										{Object.entries(draftCells).map(([col, value]) => (
											<div key={col} className="flex items-center gap-2">
												<span className="w-32 text-xs font-medium text-gray-600">{col}</span>
												<input
													type="text"
													className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
													value={value}
													onChange={(e) =>
														setDraftCells((prev) => ({
															...prev,
															[col]: e.target.value,
														}))
													}
												/>
											</div>
										))}
										<div className="flex justify-end gap-2 pt-1">
											<Button
												variant="secondary"
												onClick={() => setEditing(null)}
												disabled={resubmitting}>
												{t('uploadHistory.drawer.cancel')}
											</Button>
											<Button
												variant="primary"
												onClick={() => handleResubmit(row)}
												disabled={resubmitting}>
												{resubmitting
													? t('uploadHistory.drawer.resubmitting')
													: t('uploadHistory.drawer.resubmit')}
											</Button>
										</div>
									</div>
								)}
							</li>
						);
					})}
				</ul>
			</aside>
		</div>
	);
}
