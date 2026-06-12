'use client';

import { useCallback, useMemo, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	LazySelect,
	Select,
} from '@/shared/components';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { tryTranslate } from '@/shared/utils';
import { getApiErrorReasons } from '@/shared/lib/apiError';
import { useI18n } from '@/providers';
import {
	ENTITY_TYPE,
	ENTITY_TYPE_GROUP_CODE,
	READ_ONLY_ENTITY_TYPE_CODES,
	entityTypeNeedsCode,
} from '../constants';
import { chartsService } from '../services/chartsService';
import { useChartMutations, usePrograms } from '../hooks';
import type {
	ChartCreatePayload,
	ChartNode,
	ChartUpdatePayload,
	CourseLookupItem,
	I18nText,
	StaffLookupItem,
} from '../types';

const LOOKUP_PAGE_SIZE = 20;

interface ChartNodeDialogProps {
	open: boolean;
	mode: 'create' | 'edit';
	node: ChartNode | null;
	onClose: () => void;
	onSaved: () => void;
}

interface EntitySelection {
	id: number;
	label: string;
}

interface FieldErrors {
	staff?: string;
	titleEs?: string;
	titleEn?: string;
	entityType?: string;
	entityCode?: string;
}

function localized(text: I18nText | undefined | null, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

export function ChartNodeDialog({ open, mode, node, onClose, onSaved }: ChartNodeDialogProps) {
	const { t, locale } = useI18n();
	const { create, update } = useChartMutations();

	const [staff, setStaff] = useState<EntitySelection | null>(null);
	const [titleEs, setTitleEs] = useState('');
	const [titleEn, setTitleEn] = useState('');
	const [entityTypeId, setEntityTypeId] = useState<number | null>(null);
	const [entity, setEntity] = useState<EntitySelection | null>(null);
	const [entityTouched, setEntityTouched] = useState(false);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [generalErrors, setGeneralErrors] = useState<string[]>([]);
	const [syncedKey, setSyncedKey] = useState('');

	const { data: entityTypes } = useTypesByGroupCode(ENTITY_TYPE_GROUP_CODE, { enabled: open });

	const typeOptions = useMemo(
		() =>
			(entityTypes ?? [])
				.filter((type) => !READ_ONLY_ENTITY_TYPE_CODES.includes(type.code))
				.map((type) => ({ value: type.id, label: localized(type.name, locale), code: type.code })),
		[entityTypes, locale],
	);

	const selectedCode = typeOptions.find((option) => option.value === entityTypeId)?.code;
	const needsCode = entityTypeNeedsCode(selectedCode);
	const isProgram = selectedCode === ENTITY_TYPE.PROGRAM;
	const isCourse = selectedCode === ENTITY_TYPE.COURSE;

	const { data: programs } = usePrograms(open && isProgram);

	const programOptions = useMemo(
		() =>
			(programs ?? []).map((program) => ({
				value: program.id,
				label: `${program.code} · ${localized(program.name, locale)}`,
			})),
		[programs, locale],
	);

	const syncKey = `${open}|${mode}|${node?.chartId ?? ''}`;
	if (syncKey !== syncedKey) {
		setSyncedKey(syncKey);
		setErrors({});
		setGeneralErrors([]);
		setEntityTouched(false);
		if (open && mode === 'edit' && node) {
			const staffLabel =
				`${node.professorCode ? `${node.professorCode} · ` : ''}${node.firstName} ${node.lastName}`.trim();
			setStaff({ id: node.staffId, label: staffLabel });
			setTitleEs(node.organizationLevelTitle?.es ?? '');
			setTitleEn(node.organizationLevelTitle?.en ?? '');
			setEntityTypeId(node.entityType?.id ?? null);
			setEntity(
				node.entity
					? { id: -1, label: `${node.entity.code} · ${localized(node.entity.name, locale)}` }
					: null,
			);
		} else {
			setStaff(null);
			setTitleEs('');
			setTitleEn('');
			setEntityTypeId(null);
			setEntity(null);
		}
	}

	const loadStaff = useCallback(
		({ search, page }: { search: string; page: number }) =>
			chartsService.staffLookup({ search, page, pageSize: LOOKUP_PAGE_SIZE }).then((result) => ({
				items: result.items,
				totalPages: Math.max(1, Math.ceil(result.total / (result.pageSize || LOOKUP_PAGE_SIZE))),
			})),
		[],
	);

	const loadCourses = useCallback(
		({ search, page }: { search: string; page: number }) =>
			chartsService.courseLookup({ search, page, pageSize: LOOKUP_PAGE_SIZE }).then((result) => ({
				items: result.items,
				totalPages: Math.max(1, Math.ceil(result.total / (result.pageSize || LOOKUP_PAGE_SIZE))),
			})),
		[],
	);

	const handleTypeChange = (value: number | null) => {
		setEntityTypeId(value);
		setEntity(null);
		setEntityTouched(false);
	};

	const validate = (): FieldErrors => {
		const next: FieldErrors = {};
		if (!staff) next.staff = t('loads.organizationChartMaintenance.form.error.staffRequired');
		if (!titleEs.trim())
			next.titleEs = t('loads.organizationChartMaintenance.form.error.titleRequired');
		if (!titleEn.trim())
			next.titleEn = t('loads.organizationChartMaintenance.form.error.titleRequired');
		if (entityTypeId == null)
			next.entityType = t('loads.organizationChartMaintenance.form.error.entityTypeRequired');

		if (needsCode) {
			const typeChanged = mode === 'create' || node?.entityType?.id !== entityTypeId;
			const mustProvide = typeChanged || entityTouched;
			const hasValidEntity = entity != null && entity.id > 0;
			if (mustProvide && !hasValidEntity)
				next.entityCode = t('loads.organizationChartMaintenance.form.error.entityCodeRequired');
		}
		return next;
	};

	const handleApiError = (error: unknown, fallbackKey: string) => {
		const reasons = getApiErrorReasons(error);
		if (reasons.length > 0) {
			setGeneralErrors(reasons.map((reason) => tryTranslate(t, reason)));
		} else {
			setGeneralErrors([t(fallbackKey)]);
		}
	};

	const submitCreate = async () => {
		const payload: ChartCreatePayload = {
			rootChartId: node!.chartId,
			staffId: staff!.id,
			title: { es: titleEs.trim(), en: titleEn.trim() },
			entityTypeId: entityTypeId!,
			...(needsCode && entity ? { entityCode: entity.id } : {}),
		};
		await create.mutateAsync(payload);
	};

	const submitEdit = async () => {
		const payload: ChartUpdatePayload = {};
		if (staff!.id !== node!.staffId) payload.staffId = staff!.id;
		if (
			titleEs.trim() !== (node!.organizationLevelTitle?.es ?? '') ||
			titleEn.trim() !== (node!.organizationLevelTitle?.en ?? '')
		) {
			payload.title = { es: titleEs.trim(), en: titleEn.trim() };
		}
		if (entityTypeId !== node!.entityType?.id) payload.entityTypeId = entityTypeId ?? undefined;
		if (needsCode && entityTouched && entity && entity.id > 0) payload.entityCode = entity.id;
		await update.mutateAsync({ chartId: node!.chartId, payload });
	};

	const handleSubmit = async () => {
		setGeneralErrors([]);
		const validationErrors = validate();
		setErrors(validationErrors);
		if (Object.keys(validationErrors).length > 0) return;

		try {
			if (mode === 'create') await submitCreate();
			else await submitEdit();
			onSaved();
		} catch (error) {
			handleApiError(error, 'loads.organizationChartMaintenance.form.error.saveFailed');
		}
	};

	const isPending = create.isPending || update.isPending;

	return (
		<Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{mode === 'create'
							? t('loads.organizationChartMaintenance.form.createTitle')
							: t('loads.organizationChartMaintenance.form.editTitle')}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{mode === 'create' && node && (
						<p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
							{t('loads.organizationChartMaintenance.form.parentLabel')}:{' '}
							<span className="font-medium text-zinc-700">
								{localized(node.organizationLevelTitle, locale)} — {node.firstName} {node.lastName}
							</span>
						</p>
					)}

					<LazySelect<StaffLookupItem>
						label={t('loads.organizationChartMaintenance.form.staff')}
						placeholder={t('loads.organizationChartMaintenance.form.staffPlaceholder')}
						value={staff ? { id: staff.id, label: staff.label } : null}
						onChange={(item) => {
							setStaff(item ? { id: item.id, label: item.label } : null);
						}}
						loadPage={loadStaff}
						getId={(item) => item.id}
						getLabel={(item) => item.label}
					/>
					{errors.staff && <p className="-mt-2 text-xs text-red-500">{errors.staff}</p>}

					<div className="grid gap-4 sm:grid-cols-2">
						<Input
							label={t('loads.organizationChartMaintenance.form.titleEs')}
							value={titleEs}
							onChange={(event) => setTitleEs(event.target.value)}
							error={errors.titleEs}
						/>
						<Input
							label={t('loads.organizationChartMaintenance.form.titleEn')}
							value={titleEn}
							onChange={(event) => setTitleEn(event.target.value)}
							error={errors.titleEn}
						/>
					</div>

					<Select
						name="entityType"
						label={t('loads.organizationChartMaintenance.form.entityType')}
						placeholder={t('loads.organizationChartMaintenance.form.entityTypePlaceholder')}
						options={typeOptions}
						value={typeOptions.find((option) => option.value === entityTypeId) ?? null}
						error={errors.entityType}
						onChange={(_name, value) =>
							handleTypeChange(value && !Array.isArray(value) ? Number(value.value) : null)
						}
					/>

					{needsCode && isProgram && (
						<Select
							name="program"
							label={t('loads.organizationChartMaintenance.form.entityCode')}
							placeholder={t('loads.organizationChartMaintenance.form.programPlaceholder')}
							isSearchable
							options={programOptions}
							value={entity ? { value: entity.id, label: entity.label } : null}
							error={errors.entityCode}
							onChange={(_name, value) => {
								if (value && !Array.isArray(value)) {
									setEntity({ id: Number(value.value), label: value.label });
									setEntityTouched(true);
								} else {
									setEntity(null);
									setEntityTouched(true);
								}
							}}
						/>
					)}

					{needsCode && isCourse && (
						<div>
							<LazySelect<CourseLookupItem>
								label={t('loads.organizationChartMaintenance.form.entityCode')}
								placeholder={t('loads.organizationChartMaintenance.form.coursePlaceholder')}
								value={entity ? { id: entity.id, label: entity.label } : null}
								onChange={(item) => {
									setEntity(
										item
											? { id: item.id, label: `${item.code} · ${localized(item.name, locale)}` }
											: null,
									);
									setEntityTouched(true);
								}}
								loadPage={loadCourses}
								getId={(item) => item.id}
								getLabel={(item) => `${item.code} · ${localized(item.name, locale)}`}
							/>
							{errors.entityCode && (
								<p className="mt-2 text-xs text-red-500">{errors.entityCode}</p>
							)}
						</div>
					)}

					{generalErrors.length > 0 && (
						<ul className="list-disc space-y-1 rounded-lg border border-red-200 bg-red-50 px-5 py-3 pl-8 text-sm text-red-700">
							{generalErrors.map((message, index) => (
								<li key={`${message}-${index}`}>{message}</li>
							))}
						</ul>
					)}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={isPending}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={isPending}>
						{isPending
							? t('loads.organizationChartMaintenance.form.saving')
							: t('loads.organizationChartMaintenance.form.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
