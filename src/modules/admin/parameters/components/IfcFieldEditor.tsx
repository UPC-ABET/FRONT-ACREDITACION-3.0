'use client';

import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Input, Toggle } from '@/shared/components';
import { useI18n } from '@/providers';
import type { IFCFieldDescriptor } from '../types';

type Props = {
	field: IFCFieldDescriptor;
	index: number;
	total: number;
	keyError?: boolean;
	keyDuplicate?: boolean;
	esError?: boolean;
	enError?: boolean;
	onChange: (next: IFCFieldDescriptor) => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onDelete: () => void;
};

export function IfcFieldEditor({
	field,
	index,
	total,
	keyError,
	keyDuplicate,
	esError,
	enError,
	onChange,
	onMoveUp,
	onMoveDown,
	onDelete,
}: Props) {
	const { t } = useI18n();
	const isFirst = index === 0;
	const isLast = index === total - 1;

	return (
		<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow">
			<div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/60 px-5 py-3">
				<div className="flex items-center gap-3">
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white tabular-nums">
						{index + 1}
					</span>
					<span className="text-sm font-semibold uppercase tracking-wider text-zinc-700">
						{t('admin.params.fields.row.title')}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						aria-label={t('admin.params.fields.btn.moveUp')}
						title={t('admin.params.fields.btn.moveUp')}
						disabled={isFirst}
						onClick={onMoveUp}>
						<ArrowUpIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						aria-label={t('admin.params.fields.btn.moveDown')}
						title={t('admin.params.fields.btn.moveDown')}
						disabled={isLast}
						onClick={onMoveDown}>
						<ArrowDownIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						aria-label={t('admin.params.fields.btn.delete')}
						title={t('admin.params.fields.btn.delete')}
						onClick={onDelete}
						className="text-red-700 hover:bg-red-50">
						<TrashIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="grid gap-5 px-5 py-5 md:grid-cols-2">
				<div className="md:col-span-2">
					<Input
						label={t('admin.params.fields.field.key')}
						value={field.key}
						onChange={(e) => onChange({ ...field, key: e.target.value.replace(/\s+/g, '_') })}
						placeholder={t('admin.params.fields.field.keyPlaceholder')}
						error={
							keyError
								? t('admin.params.fields.err.keyRequired')
								: keyDuplicate
									? t('admin.params.fields.err.keyDuplicate')
									: undefined
						}
						helperText={
							!keyError && !keyDuplicate ? t('admin.params.fields.field.keyHelp') : undefined
						}
						required
					/>
				</div>

				<Input
					label={t('admin.params.fields.field.labelEs')}
					value={field.label.es ?? ''}
					onChange={(e) => onChange({ ...field, label: { ...field.label, es: e.target.value } })}
					error={esError ? t('admin.params.fields.err.labelRequired') : undefined}
					required
				/>
				<Input
					label={t('admin.params.fields.field.labelEn')}
					value={field.label.en ?? ''}
					onChange={(e) => onChange({ ...field, label: { ...field.label, en: e.target.value } })}
					error={enError ? t('admin.params.fields.err.labelRequired') : undefined}
					required
				/>

				<div className="md:col-span-2 flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3">
					<div className="flex flex-col">
						<span className="text-sm font-semibold text-zinc-900">
							{t('admin.params.fields.field.required')}
						</span>
						<span className="text-xs text-zinc-500">
							{t('admin.params.fields.field.requiredHelp')}
						</span>
					</div>
					<Toggle
						checked={field.required}
						onChange={(checked) => onChange({ ...field, required: checked })}
					/>
				</div>
			</div>
		</div>
	);
}
