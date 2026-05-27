'use client';

import { useMemo, useState } from 'react';
import {
	ExclamationTriangleIcon,
	TrashIcon,
	UserGroupIcon,
	UsersIcon,
} from '@heroicons/react/24/outline';
import { Button, I18nTextField, Toggle } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/apiError';
import { useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import { useNotificationConfigContext } from '../hooks/useNotificationConfigContext';
import {
	deleteNotificationConfig,
	upsertNotificationConfig,
} from '../services/notificationConfigsService';
import type { NotificationConfig, UpsertConfigBody } from '../types';
import { VariableLegend } from './VariableLegend';

type Props = {
	triggerTypeId: number;
	statusTypeId: number;
	statusCode: string;
	existingConfig: NotificationConfig | null;
};

function emptyI18n(): I18nText {
	return { es: '', en: '' };
}

function asI18n(text: I18nText | undefined | null): I18nText {
	return { es: text?.es ?? '', en: text?.en ?? '' };
}

type RecipientOption = { id: number; label: string };

function RecipientsField({
	icon,
	label,
	options,
	selected,
	onToggle,
	emptyLabel,
}: {
	icon: React.ReactNode;
	label: string;
	options: RecipientOption[];
	selected: number[];
	onToggle: (id: number) => void;
	emptyLabel: string;
}) {
	return (
		<div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
			<div className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/60 px-5 py-3">
				<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-700">
					{icon}
					{label}
				</div>
				{selected.length > 0 && (
					<span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-100 px-2 text-xs font-bold text-red-700">
						{selected.length}
					</span>
				)}
			</div>
			<div className="space-y-1 p-4">
				{options.length === 0 ? (
					<p className="px-1 py-2 text-sm italic text-zinc-500">{emptyLabel}</p>
				) : (
					options.map((opt) => {
						const checked = selected.includes(opt.id);
						return (
							<label
								key={opt.id}
								className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-base transition-colors ${
									checked ? 'bg-red-50 text-red-900' : 'hover:bg-zinc-50'
								}`}>
								<input
									type="checkbox"
									className="h-5 w-5 cursor-pointer rounded border-zinc-300 accent-red-600"
									checked={checked}
									onChange={() => onToggle(opt.id)}
								/>
								<span>{opt.label}</span>
							</label>
						);
					})
				)}
			</div>
		</div>
	);
}

export function ConfigEditor({ triggerTypeId, statusTypeId, statusCode, existingConfig }: Props) {
	const { t, locale: lang } = useI18n();
	const { periodId, chartLevels, notifyVars, onSaved, onError, onSuccess } =
		useNotificationConfigContext();
	const [title, setTitle] = useState<I18nText>(() =>
		existingConfig ? asI18n(existingConfig.title) : emptyI18n(),
	);
	const [body, setBody] = useState<I18nText>(() =>
		existingConfig ? asI18n(existingConfig.body) : emptyI18n(),
	);
	const [toIds, setToIds] = useState<number[]>(() => existingConfig?.to_chart_level_type_ids ?? []);
	const [ccIds, setCcIds] = useState<number[]>(() => existingConfig?.cc_chart_level_type_ids ?? []);
	const [isActive, setIsActive] = useState<boolean>(() => existingConfig?.is_active ?? true);
	const [saving, setSaving] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const chartLevelOptions = useMemo<RecipientOption[]>(
		() =>
			chartLevels.map((c) => ({
				id: Number(c.id),
				label: c.name?.[lang] ?? c.name?.es ?? c.code,
			})),
		[chartLevels, lang],
	);

	function toggleIdInList(list: number[], id: number): number[] {
		return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
	}

	async function handleSave() {
		setSaving(true);
		try {
			const payload: UpsertConfigBody = {
				academic_period_id: periodId,
				trigger_type_id: triggerTypeId,
				ifc_status_type_id: statusTypeId,
				title,
				body,
				to_chart_level_type_ids: toIds,
				cc_chart_level_type_ids: ccIds,
				is_active: isActive,
			};
			await upsertNotificationConfig(payload);
			onSuccess(t('admin.notify.toast.saved'));
			onSaved();
		} catch (e) {
			onError(getErrorMessage(e, 'admin.notify.error.saveFailed'));
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!existingConfig) return;
		setSaving(true);
		try {
			await deleteNotificationConfig(existingConfig.id);
			onSuccess(t('admin.notify.toast.deleted'));
			onSaved();
		} catch (e) {
			onError(getErrorMessage(e, 'admin.notify.error.deleteFailed'));
		} finally {
			setSaving(false);
			setConfirmDelete(false);
		}
	}

	return (
		<div className="space-y-8">
			<section className="space-y-4">
				<h3 className="text-lg font-bold uppercase tracking-wider text-zinc-900">
					{t('admin.notify.field.title')}
				</h3>
				<I18nTextField as="input" layout="row" value={title} onChange={setTitle} />
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold uppercase tracking-wider text-zinc-900">
					{t('admin.notify.field.body')}
				</h3>
				<div className="grid gap-5 lg:grid-cols-[1fr_320px]">
					<I18nTextField layout="row" rows={10} value={body} onChange={setBody} />
					<VariableLegend notifyVars={notifyVars} currentStatusCode={statusCode} />
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold uppercase tracking-wider text-zinc-900">
					{t('admin.notify.field.to')} / {t('admin.notify.field.cc')}
				</h3>
				<div className="grid gap-5 md:grid-cols-2">
					<RecipientsField
						icon={<UsersIcon className="h-5 w-5 text-red-700" />}
						label={t('admin.notify.field.to')}
						options={chartLevelOptions}
						selected={toIds}
						onToggle={(id) => setToIds((prev) => toggleIdInList(prev, id))}
						emptyLabel={t('admin.notify.field.noLevels')}
					/>
					<RecipientsField
						icon={<UserGroupIcon className="h-5 w-5 text-red-700" />}
						label={t('admin.notify.field.cc')}
						options={chartLevelOptions}
						selected={ccIds}
						onToggle={(id) => setCcIds((prev) => toggleIdInList(prev, id))}
						emptyLabel={t('admin.notify.field.noLevels')}
					/>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<Toggle checked={isActive} onChange={setIsActive} />
					<span className="text-base font-medium text-zinc-900">
						{t('admin.notify.field.isActive')}
					</span>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					{existingConfig && !confirmDelete && (
						<Button
							variant="ghost"
							size="lg"
							disabled={saving}
							onClick={() => setConfirmDelete(true)}
							className="text-red-700 hover:bg-red-50">
							<TrashIcon className="h-5 w-5" />
							{t('admin.notify.btn.delete')}
						</Button>
					)}
					{existingConfig && confirmDelete && (
						<div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3">
							<ExclamationTriangleIcon className="h-5 w-5 text-red-700" />
							<span className="text-sm font-medium text-red-800">
								{t('admin.notify.confirm.delete')}
							</span>
							<Button
								variant="ghost"
								size="md"
								disabled={saving}
								onClick={() => setConfirmDelete(false)}>
								{t('dialog.actions.cancel')}
							</Button>
							<Button variant="primary" size="md" disabled={saving} onClick={handleDelete}>
								{t('admin.notify.btn.confirmDelete')}
							</Button>
						</div>
					)}
					<Button variant="primary" size="lg" disabled={saving} onClick={handleSave}>
						{saving ? t('loading.default') : t('admin.notify.btn.save')}
					</Button>
				</div>
			</section>
		</div>
	);
}
