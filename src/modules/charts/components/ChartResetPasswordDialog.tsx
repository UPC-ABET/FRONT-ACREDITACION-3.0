'use client';

import { useMemo, useState } from 'react';
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Checkbox,
	ConfirmDialog,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	LoadingState,
} from '@/shared';
import { getErrorMessage } from '@/shared/lib';
import { useSyncOnChange } from '@/shared/hooks';
import { interpolate, localizedText } from '@/shared/utils';
import { useI18n } from '@/providers';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { ENTITY_TYPE_GROUP_CODE, RESET_PASSWORD_ENTITY_TYPE_CODES } from '../constants';
import { useResetChartPasswords } from '../hooks';
import type { ChartResetPasswordResult } from '../types';

type Step = 'select' | 'confirm' | 'results';

interface ChartResetPasswordDialogProps {
	open: boolean;
	onClose: () => void;
	onError: (message: string) => void;
}

interface ResultRow {
	key: string | number;
	label: string;
	badgeText: string;
}

interface ResultListProps {
	heading: string;
	emptyText: string;
	rows: ResultRow[];
	badgeVariant: 'success' | 'outline';
}

function ResultList({ heading, emptyText, rows, badgeVariant }: ResultListProps) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium text-zinc-700">{heading}</p>
			{rows.length === 0 ? (
				<p className="text-sm text-zinc-500">{emptyText}</p>
			) : (
				<ul className="space-y-1.5">
					{rows.map((row) => (
						<li
							key={row.key}
							className="flex items-center justify-between gap-2 text-sm text-zinc-700">
							<span>{row.label}</span>
							<Badge variant={badgeVariant}>{row.badgeText}</Badge>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export function ChartResetPasswordDialog({
	open,
	onClose,
	onError,
}: ChartResetPasswordDialogProps) {
	const { t, locale } = useI18n();
	const resetPasswords = useResetChartPasswords();

	const [step, setStep] = useState<Step>('select');
	const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
	const [result, setResult] = useState<ChartResetPasswordResult | null>(null);

	useSyncOnChange(open, false, (nextOpen) => {
		if (nextOpen) {
			setStep('select');
			setSelectedCodes(new Set());
			setResult(null);
		}
	});

	const {
		data: entityTypes,
		isLoading: typesLoading,
		isError: typesError,
	} = useTypesByGroupCode(ENTITY_TYPE_GROUP_CODE, { enabled: open });

	const typeOptions = useMemo(() => {
		const byCode = new Map((entityTypes ?? []).map((type) => [type.code, type]));
		return RESET_PASSWORD_ENTITY_TYPE_CODES.map((code) => byCode.get(code))
			.filter((type): type is NonNullable<typeof type> => type != null)
			.map((type) => ({ code: type.code, label: localizedText(type.name, locale) }));
	}, [entityTypes, locale]);

	const labelByCode = useMemo(
		() => new Map(typeOptions.map((option) => [option.code, option.label])),
		[typeOptions],
	);

	const toggleCode = (code: string) => {
		setSelectedCodes((previous) => {
			const next = new Set(previous);
			if (next.has(code)) next.delete(code);
			else next.add(code);
			return next;
		});
	};

	const selectedLabels = typeOptions
		.filter((option) => selectedCodes.has(option.code))
		.map((option) => option.label);

	const resetRows = useMemo<ResultRow[]>(
		() =>
			(result?.reset ?? []).map((user) => ({
				key: user.userId,
				label: `${user.firstName} ${user.lastName}`,
				badgeText: interpolate(
					t('loads.organizationChartMaintenance.resetPassword.resultsResetCount'),
					{ count: user.chartIds.length },
				),
			})),
		[result, t],
	);

	const skippedRows = useMemo<ResultRow[]>(() => {
		const counts = new Map<string, number>();
		for (const node of result?.skipped ?? []) {
			counts.set(node.entityTypeCode, (counts.get(node.entityTypeCode) ?? 0) + 1);
		}
		return Array.from(counts.entries()).map(([code, count]) => ({
			key: code,
			label: labelByCode.get(code) ?? code,
			badgeText: interpolate(
				t('loads.organizationChartMaintenance.resetPassword.resultsSkippedCount'),
				{ count },
			),
		}));
	}, [result, labelByCode, t]);

	const isConfirmStep = step === 'confirm';

	const handleConfirm = async () => {
		if (resetPasswords.isPending) return;
		try {
			const response = await resetPasswords.mutateAsync({ entityTypeCodes: [...selectedCodes] });
			setResult(response);
			setStep('results');
		} catch (error) {
			setStep('select');
			onError(
				getErrorMessage(error, 'loads.organizationChartMaintenance.error.resetPasswordFailed'),
			);
		}
	};

	const handleClose = () => {
		if (resetPasswords.isPending) return;
		onClose();
	};

	const handleCancelConfirm = () => {
		if (resetPasswords.isPending) return;
		setStep('select');
	};

	return (
		<>
			<Dialog
				open={open && !isConfirmStep}
				onOpenChange={(next) => (!next ? handleClose() : undefined)}>
				<DialogContent className="sm:max-w-lg">
					{step === 'select' && (
						<>
							<DialogHeader>
								<DialogTitle>
									{t('loads.organizationChartMaintenance.resetPassword.selectTitle')}
								</DialogTitle>
							</DialogHeader>

							<div className="space-y-4">
								<Alert variant="warning">
									<AlertDescription>
										{t('loads.organizationChartMaintenance.resetPassword.selectDescription')}
									</AlertDescription>
								</Alert>

								{typesLoading ? (
									<LoadingState size="sm" />
								) : typesError ? (
									<Alert variant="destructive">
										<AlertDescription>
											{t('loads.organizationChartMaintenance.resetPassword.loadTypesFailed')}
										</AlertDescription>
									</Alert>
								) : (
									<div className="space-y-2">
										{typeOptions.map((option) => (
											<label key={option.code} className="flex items-center gap-2 cursor-pointer">
												<Checkbox
													checked={selectedCodes.has(option.code)}
													onCheckedChange={() => toggleCode(option.code)}
												/>
												<span className="text-sm text-zinc-700">{option.label}</span>
											</label>
										))}
									</div>
								)}
							</div>

							<DialogFooter>
								<Button variant="secondary" onClick={handleClose}>
									{t('dialog.actions.cancel')}
								</Button>
								<Button
									variant="primary"
									disabled={selectedCodes.size === 0 || typesLoading || typesError}
									onClick={() => setStep('confirm')}>
									{t('loads.organizationChartMaintenance.resetPassword.continue')}
								</Button>
							</DialogFooter>
						</>
					)}

					{step === 'results' && result && (
						<>
							<DialogHeader>
								<DialogTitle>
									{t('loads.organizationChartMaintenance.resetPassword.resultsTitle')}
								</DialogTitle>
							</DialogHeader>

							<div className="space-y-4">
								<ResultList
									heading={t(
										'loads.organizationChartMaintenance.resetPassword.resultsResetHeading',
									)}
									emptyText={t(
										'loads.organizationChartMaintenance.resetPassword.resultsResetEmpty',
									)}
									rows={resetRows}
									badgeVariant="success"
								/>

								<ResultList
									heading={t(
										'loads.organizationChartMaintenance.resetPassword.resultsSkippedHeading',
									)}
									emptyText={t(
										'loads.organizationChartMaintenance.resetPassword.resultsSkippedEmpty',
									)}
									rows={skippedRows}
									badgeVariant="outline"
								/>
							</div>

							<DialogFooter>
								<Button variant="primary" onClick={onClose}>
									{t('loads.organizationChartMaintenance.resetPassword.close')}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				isOpen={open && isConfirmStep}
				onClose={handleCancelConfirm}
				title={t('loads.organizationChartMaintenance.resetPassword.confirmTitle')}
				message={interpolate(t('loads.organizationChartMaintenance.resetPassword.confirmMessage'), {
					types: selectedLabels.join(', '),
				})}
				confirmLabel={t('loads.organizationChartMaintenance.toolbar.resetPassword')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirm}
				onDecline={handleCancelConfirm}
				isLoading={resetPasswords.isPending}
			/>
		</>
	);
}
