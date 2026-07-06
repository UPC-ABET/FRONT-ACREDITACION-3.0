'use client';

import { useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	I18nTextField,
	Input,
	Select,
} from '@/shared/components/ui';
import { tryTranslateReason } from '@/shared/utils';
import { useI18n } from '@/providers';
import { useProjectGroupOptions, useCreateProjectGroup } from '../../hooks';

type AnyOption = { label: string; value: string | number };

interface ProjectGroupSelectProps {
	academicPeriodId?: number;
	programId?: number;
	value?: number;
	onChange: (id: number | undefined) => void;
	error?: string;
	disabled?: boolean;
	/** Allows creating a group on the fly (requires period + program). */
	allowQuickCreate?: boolean;
}

export function ProjectGroupSelect({
	academicPeriodId,
	programId,
	value,
	onChange,
	error,
	disabled,
	allowQuickCreate = true,
}: ProjectGroupSelectProps) {
	const { t, locale } = useI18n();
	const loc = locale as 'es' | 'en';

	const { data: groups = [], isLoading } = useProjectGroupOptions(academicPeriodId, programId);
	const createMutation = useCreateProjectGroup();

	const [createOpen, setCreateOpen] = useState(false);
	const [code, setCode] = useState('');
	const [name, setName] = useState<Record<string, string>>({});
	const [createError, setCreateError] = useState<string | null>(null);

	const options = useMemo<AnyOption[]>(
		() =>
			groups.map((g) => ({
				label: `${g.code} — ${g.name[loc] ?? g.name.es}`,
				value: g.id,
			})),
		[groups, loc],
	);

	const selectedOption = options.find((o) => o.value === value) ?? null;

	const canQuickCreate = allowQuickCreate && !!academicPeriodId && !!programId;

	const openCreate = () => {
		setCode('');
		setName({});
		setCreateError(null);
		setCreateOpen(true);
	};

	const handleCreate = () => {
		if (!academicPeriodId || !programId) return;
		if (code.trim().length === 0) {
			setCreateError(t('projectGroups.form.codeRequired'));
			return;
		}
		const es = name.es?.trim() || code.trim();
		const en = name.en?.trim() || es;
		createMutation.mutate(
			{
				code: code.trim(),
				name: { es, en },
				programId,
			},
			{
				onSuccess: (created) => {
					setCreateOpen(false);
					onChange(created.id);
				},
				onError: (err) => {
					const key = err instanceof Error ? err.message : 'projectGroups.form.createError';
					setCreateError(tryTranslateReason(t, key));
				},
			},
		);
	};

	return (
		<div className="space-y-1.5">
			<div className="flex items-end gap-2">
				<div className="flex-1">
					<Select
						label={t('projects.create.step2.fieldGroup')}
						placeholder={
							!programId
								? t('projects.create.step2.fieldGroupSelectCourseFirst')
								: isLoading
									? t('projects.create.step2.fieldGroupLoading')
									: options.length === 0
										? t('projects.create.step2.fieldGroupNoOptions')
										: t('projects.create.step2.fieldGroupPlaceholder')
						}
						options={options}
						value={selectedOption}
						isSearchable
						isClearable
						isDisabled={disabled || isLoading || !programId}
						onChange={(_, opt) => {
							const single = Array.isArray(opt) ? (opt[0] ?? null) : opt;
							onChange(single ? Number(single.value) : undefined);
						}}
					/>
				</div>
				{canQuickCreate && (
					<Button
						type="button"
						variant="secondary"
						size="md"
						className="shrink-0"
						disabled={disabled}
						onClick={openCreate}>
						<PlusIcon className="h-4 w-4" />
						{t('projects.create.step2.fieldGroupNew')}
					</Button>
				)}
			</div>
			{error && <span className="text-xs text-red-600">{error}</span>}

			<Dialog
				open={createOpen}
				onOpenChange={(open) => {
					if (!open) setCreateOpen(false);
				}}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t('projectGroups.create.title')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							label={t('projectGroups.form.code')}
							placeholder={t('projectGroups.form.codePlaceholder')}
							value={code}
							onChange={(e) => setCode(e.target.value)}
						/>
						<I18nTextField
							as="input"
							layout="row"
							label={t('projectGroups.form.name')}
							value={name}
							onChange={setName}
						/>
						<p className="text-xs text-zinc-400">{t('projectGroups.form.nameHint')}</p>
						{createError && <p className="text-xs text-red-600">{createError}</p>}
					</div>
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={createMutation.isPending}>
									{t('dialog.actions.cancel')}
								</Button>
							}
						/>
						<Button
							variant="primary"
							onClick={handleCreate}
							disabled={createMutation.isPending}
							loading={createMutation.isPending}>
							{t('dialog.actions.save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
