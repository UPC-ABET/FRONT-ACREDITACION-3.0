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
} from '@/shared';
import { getErrorMessage } from '@/shared/lib';
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
	const [syncedOpen, setSyncedOpen] = useState(false);

	if (open !== syncedOpen) {
		setSyncedOpen(open);
		if (open) {
			setStep('select');
			setSelectedCodes(new Set());
			setResult(null);
		}
	}

	const { data: entityTypes, isLoading: typesLoading } = useTypesByGroupCode(
		ENTITY_TYPE_GROUP_CODE,
		{ enabled: open },
	);

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

	const skippedCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const node of result?.skipped ?? []) {
			counts.set(node.entityTypeCode, (counts.get(node.entityTypeCode) ?? 0) + 1);
		}
		return Array.from(counts.entries());
	}, [result]);

	const handleConfirm = async () => {
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

	return (
		<>
			<Dialog
				open={open && step !== 'confirm'}
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
							</div>

							<DialogFooter>
								<Button variant="secondary" onClick={handleClose}>
									{t('dialog.actions.cancel')}
								</Button>
								<Button
									variant="primary"
									disabled={selectedCodes.size === 0 || typesLoading}
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
								<div className="space-y-2">
									<p className="text-sm font-medium text-zinc-700">
										{t('loads.organizationChartMaintenance.resetPassword.resultsResetHeading')}
									</p>
									{result.reset.length === 0 ? (
										<p className="text-sm text-zinc-500">
											{t('loads.organizationChartMaintenance.resetPassword.resultsResetEmpty')}
										</p>
									) : (
										<ul className="space-y-1.5">
											{result.reset.map((user) => (
												<li
													key={user.userId}
													className="flex items-center justify-between gap-2 text-sm text-zinc-700">
													<span>
														{user.firstName} {user.lastName}
													</span>
													<Badge variant="success">
														{interpolate(
															t(
																'loads.organizationChartMaintenance.resetPassword.resultsResetCount',
															),
															{ count: user.chartIds.length },
														)}
													</Badge>
												</li>
											))}
										</ul>
									)}
								</div>

								<div className="space-y-2">
									<p className="text-sm font-medium text-zinc-700">
										{t('loads.organizationChartMaintenance.resetPassword.resultsSkippedHeading')}
									</p>
									{skippedCounts.length === 0 ? (
										<p className="text-sm text-zinc-500">
											{t('loads.organizationChartMaintenance.resetPassword.resultsSkippedEmpty')}
										</p>
									) : (
										<ul className="space-y-1.5">
											{skippedCounts.map(([code, count]) => (
												<li
													key={code}
													className="flex items-center justify-between gap-2 text-sm text-zinc-700">
													<span>{labelByCode.get(code) ?? code}</span>
													<Badge variant="outline">
														{interpolate(
															t(
																'loads.organizationChartMaintenance.resetPassword.resultsSkippedCount',
															),
															{ count },
														)}
													</Badge>
												</li>
											))}
										</ul>
									)}
								</div>
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
				isOpen={open && step === 'confirm'}
				onClose={() => setStep('select')}
				title={t('loads.organizationChartMaintenance.resetPassword.confirmTitle')}
				message={interpolate(t('loads.organizationChartMaintenance.resetPassword.confirmMessage'), {
					types: selectedLabels.join(', '),
				})}
				confirmLabel={t('loads.organizationChartMaintenance.toolbar.resetPassword')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirm}
				onDecline={() => setStep('select')}
				isLoading={resetPasswords.isPending}
			/>
		</>
	);
}
