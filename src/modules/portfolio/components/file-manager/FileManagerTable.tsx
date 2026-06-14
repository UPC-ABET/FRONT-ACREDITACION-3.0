'use client';

import { ArrowDownTrayIcon, FolderIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Checkbox } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import type { S3Entry } from '../../types';
import { formatBytes, formatDate, getFileIcon } from './fileManagerUtils';

type Props = {
	entries: S3Entry[];
	selectedKeys: Set<string>;
	onToggleSelect: (key: string) => void;
	onToggleAll: () => void;
	onOpenFolder: (entry: S3Entry) => void;
	onDownload: (entry: S3Entry) => void;
	onDeleteOne: (entry: S3Entry) => void;
	downloadingKey: string | null;
};

const ICON_BTN =
	'inline-flex h-8 w-8 items-center justify-center rounded-md text-red-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40';

export function FileManagerTable({
	entries,
	selectedKeys,
	onToggleSelect,
	onToggleAll,
	onOpenFolder,
	onDownload,
	onDeleteOne,
	downloadingKey,
}: Props) {
	const { t, locale } = useI18n();
	const allSelected = entries.length > 0 && entries.every((e) => selectedKeys.has(e.key));

	return (
		<div className="overflow-hidden rounded-xl border border-zinc-200">
			<table className="w-full text-sm">
				<thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
					<tr>
						<th className="w-10 px-4 py-3">
							<Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
						</th>
						<th className="px-4 py-3">{t('portfolio.table.name')}</th>
						<th className="hidden px-4 py-3 sm:table-cell">{t('portfolio.table.size')}</th>
						<th className="hidden px-4 py-3 md:table-cell">{t('portfolio.table.modified')}</th>
						<th className="px-4 py-3 text-right">{t('portfolio.table.actions')}</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-zinc-100 bg-white">
					{entries.map((entry) => {
						const Icon = entry.isFolder ? FolderIcon : getFileIcon(entry.name);
						const isSelected = selectedKeys.has(entry.key);
						const isDownloading = downloadingKey === entry.key;
						return (
							<tr
								key={entry.key}
								className={`group transition-colors ${
									isSelected ? 'bg-red-50/40' : 'hover:bg-zinc-50'
								}`}>
								<td className="px-4 py-2.5">
									<Checkbox
										checked={isSelected}
										onCheckedChange={() => onToggleSelect(entry.key)}
									/>
								</td>
								<td className="px-4 py-2.5">
									<button
										type="button"
										onClick={() => (entry.isFolder ? onOpenFolder(entry) : onDownload(entry))}
										className="flex items-center gap-2.5 text-left min-w-0">
										<Icon
											className={`h-5 w-5 shrink-0 ${
												entry.isFolder ? 'text-amber-500' : 'text-red-400'
											}`}
										/>
										<span
											className={`truncate font-medium ${
												entry.isFolder ? 'text-zinc-800 group-hover:text-red-600' : 'text-zinc-700'
											}`}
											title={entry.name}>
											{entry.name}
										</span>
									</button>
								</td>
								<td className="hidden px-4 py-2.5 text-zinc-500 sm:table-cell">
									{entry.isFolder ? '—' : formatBytes(entry.size)}
								</td>
								<td className="hidden px-4 py-2.5 text-zinc-500 md:table-cell">
									{formatDate(entry.lastModified, locale)}
								</td>
								<td className="px-4 py-2.5">
									<div className="flex items-center justify-end gap-1">
										<button
											type="button"
											disabled={isDownloading}
											onClick={() => onDownload(entry)}
											className={ICON_BTN}
											title={t('portfolio.table.download')}
											aria-label={t('portfolio.table.download')}>
											<ArrowDownTrayIcon className="h-4 w-4" />
										</button>
										<button
											type="button"
											onClick={() => onDeleteOne(entry)}
											className={ICON_BTN}
											title={t('portfolio.table.delete')}
											aria-label={t('portfolio.table.delete')}>
											<TrashIcon className="h-4 w-4" />
										</button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
