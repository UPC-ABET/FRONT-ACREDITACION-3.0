'use client';

import { useMemo, useState } from 'react';
import { Button, Input, TextArea, Toggle } from '@/shared/components';
import { useI18n } from '@/providers';
import type { I18nText } from '@/modules/ifcs/services/types';
import {
	deleteNotificationConfig,
	upsertNotificationConfig,
} from '../services/notificationConfigsService';
import type {
	CoreType,
	NotificationConfig,
	NotifyVar,
	UpsertConfigBody,
} from '../services/types';
import { VariableLegend } from './VariableLegend';

type Props = {
	periodId: number;
	triggerTypeId: number;
	statusTypeId: number;
	statusCode: string;
	chartLevels: CoreType[];
	notifyVars: NotifyVar[];
	existingConfig: NotificationConfig | null;
	onSaved: () => void;
	onError: (msg: string) => void;
	onSuccess: (msg: string) => void;
};

type Lang = 'es' | 'en';

const LANGS: Lang[] = ['es', 'en'];

function emptyI18n(): I18nText {
	return { es: '', en: '' };
}

function asI18n(text: I18nText | undefined | null): I18nText {
	return { es: text?.es ?? '', en: text?.en ?? '' };
}

export function ConfigEditor({
	periodId,
	triggerTypeId,
	statusTypeId,
	statusCode,
	chartLevels,
	notifyVars,
	existingConfig,
	onSaved,
	onError,
	onSuccess,
}: Props) {
	const { t, locale: lang } = useI18n();
	const [title, setTitle] = useState<I18nText>(() =>
		existingConfig ? asI18n(existingConfig.title) : emptyI18n(),
	);
	const [body, setBody] = useState<I18nText>(() =>
		existingConfig ? asI18n(existingConfig.body) : emptyI18n(),
	);
	const [toIds, setToIds] = useState<number[]>(
		() => existingConfig?.to_chart_level_type_ids ?? [],
	);
	const [ccIds, setCcIds] = useState<number[]>(
		() => existingConfig?.cc_chart_level_type_ids ?? [],
	);
	const [isActive, setIsActive] = useState<boolean>(() => existingConfig?.is_active ?? true);
	const [saving, setSaving] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const chartLevelOptions = useMemo(
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
			const msg = e instanceof Error ? e.message : 'admin.notify.error.saveFailed';
			onError(msg);
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
			const msg = e instanceof Error ? e.message : 'admin.notify.error.deleteFailed';
			onError(msg);
		} finally {
			setSaving(false);
			setConfirmDelete(false);
		}
	}

	return (
		<div className="space-y-5">
			<div className="grid gap-4 md:grid-cols-2">
				{LANGS.map((l) => (
					<Input
						key={`title-${l}`}
						label={`${t('admin.notify.field.title')} (${l.toUpperCase()})`}
						value={title[l] ?? ''}
						onChange={(e) => setTitle({ ...title, [l]: e.target.value })}
					/>
				))}
			</div>

			<VariableLegend notifyVars={notifyVars} currentStatusCode={statusCode} />

			<div className="grid gap-4 md:grid-cols-2">
				{LANGS.map((l) => (
					<TextArea
						key={`body-${l}`}
						label={`${t('admin.notify.field.body')} (${l.toUpperCase()})`}
						rows={8}
						value={body[l] ?? ''}
						onChange={(e) => setBody({ ...body, [l]: e.target.value })}
					/>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<fieldset className="rounded border border-zinc-200 p-3">
					<legend className="px-1 text-xs font-medium text-zinc-700">
						{t('admin.notify.field.to')}
					</legend>
					<div className="space-y-2">
						{chartLevelOptions.map((opt) => (
							<label key={`to-${opt.id}`} className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									className="accent-red-600"
									checked={toIds.includes(opt.id)}
									onChange={() => setToIds((prev) => toggleIdInList(prev, opt.id))}
								/>
								<span>{opt.label}</span>
							</label>
						))}
						{chartLevelOptions.length === 0 && (
							<p className="text-xs text-zinc-500">{t('admin.notify.field.noLevels')}</p>
						)}
					</div>
				</fieldset>

				<fieldset className="rounded border border-zinc-200 p-3">
					<legend className="px-1 text-xs font-medium text-zinc-700">
						{t('admin.notify.field.cc')}
					</legend>
					<div className="space-y-2">
						{chartLevelOptions.map((opt) => (
							<label key={`cc-${opt.id}`} className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									className="accent-red-600"
									checked={ccIds.includes(opt.id)}
									onChange={() => setCcIds((prev) => toggleIdInList(prev, opt.id))}
								/>
								<span>{opt.label}</span>
							</label>
						))}
						{chartLevelOptions.length === 0 && (
							<p className="text-xs text-zinc-500">{t('admin.notify.field.noLevels')}</p>
						)}
					</div>
				</fieldset>
			</div>

			<div className="flex items-center gap-3">
				<Toggle checked={isActive} onChange={setIsActive} />
				<span className="text-sm text-zinc-700">{t('admin.notify.field.isActive')}</span>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Button variant="primary" size="md" disabled={saving} onClick={handleSave}>
					{saving ? t('loading.default') : t('admin.notify.btn.save')}
				</Button>
				{existingConfig && !confirmDelete && (
					<Button
						variant="secondary"
						size="md"
						disabled={saving}
						onClick={() => setConfirmDelete(true)}>
						{t('admin.notify.btn.delete')}
					</Button>
				)}
				{existingConfig && confirmDelete && (
					<>
						<span className="text-sm text-red-700">
							{t('admin.notify.confirm.delete')}
						</span>
						<Button
							variant="primary"
							size="sm"
							disabled={saving}
							onClick={handleDelete}>
							{t('admin.notify.btn.confirmDelete')}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							disabled={saving}
							onClick={() => setConfirmDelete(false)}>
							{t('dialog.actions.cancel')}
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
