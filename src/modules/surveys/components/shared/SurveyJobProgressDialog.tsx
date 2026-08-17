'use client';

import React from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/components';
import { cn } from '@/shared/lib/utils';
import { interpolate } from '@/shared/utils';
import { useI18n } from '@/providers';

const PROGRESS_SEGMENTS = 20;

export interface SurveyJobProgressStat {
	/** i18n key for the stat's caption. */
	readonly labelKey: string;
	readonly value: number;
}

export interface SurveyJobProgressDialogProps {
	readonly open: boolean;
	/** While true the dialog cannot be dismissed and shows no close button. */
	readonly busy: boolean;
	readonly percentage: number;
	readonly title: string;
	readonly description: string;
	/** Rendered as one or more two-column rows of counters. */
	readonly stats?: readonly SurveyJobProgressStat[];
	/** Free-form line under the bar, e.g. "12 / 340 rows". */
	readonly detail?: string | null;
	/** Non-blocking hint shown above the error slot (amber). */
	readonly note?: string | null;
	/** Blocking failure message (red). */
	readonly error?: string | null;
	readonly onOpenChange: (open: boolean) => void;
	/** Extra actions in the footer, shown alongside Close once `busy` is false. */
	readonly footerActions?: React.ReactNode;
	readonly children?: React.ReactNode;
}

export function clampPercentage(value: number | undefined): number {
	if (typeof value !== 'number' || Number.isNaN(value)) return 0;
	return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Progress dialog for a polled background job. Shared by PPP's bulk upload and LCFC's
 * notification send, which previously shipped two near-identical copies of this markup —
 * so an a11y or contrast fix applied to one silently missed the other.
 */
export function SurveyJobProgressDialog({
	open,
	busy,
	percentage,
	title,
	description,
	stats,
	detail,
	note,
	error,
	onOpenChange,
	footerActions,
	children,
}: SurveyJobProgressDialogProps) {
	const { t } = useI18n();
	const safePercentage = clampPercentage(percentage);
	const filledSegments = Math.ceil((safePercentage / 100) * PROGRESS_SEGMENTS);
	// Two per row, matching the original layouts.
	const statRows: SurveyJobProgressStat[][] = [];
	for (let index = 0; index < (stats?.length ?? 0); index += 2) {
		statRows.push((stats as SurveyJobProgressStat[]).slice(index, index + 2));
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen && busy) return;
				onOpenChange(nextOpen);
			}}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<p className="text-sm text-zinc-500">{description}</p>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium text-zinc-700">
								{t('surveys.shared.progress.progressLabel')}
							</span>
							<span className="font-semibold text-zinc-900">
								{interpolate(t('surveys.shared.progress.progressValue'), {
									percentage: safePercentage,
								})}
							</span>
						</div>
						<div
							className="flex h-2 gap-1"
							role="progressbar"
							aria-valuemin={0}
							aria-valuemax={100}
							aria-valuenow={safePercentage}
							aria-label={t('surveys.shared.progress.progressLabel')}>
							{Array.from({ length: PROGRESS_SEGMENTS }, (_, index) => (
								<span
									key={index}
									className={cn(
										'h-full flex-1 rounded-full',
										index < filledSegments ? 'bg-red-600' : 'bg-zinc-100',
									)}
								/>
							))}
						</div>
						{detail && <p className="text-xs text-zinc-500">{detail}</p>}
					</div>

					{statRows.map((row) => (
						<div
							key={row.map((stat) => stat.labelKey).join('|')}
							className="grid grid-cols-2 gap-3">
							{row.map((stat) => (
								<div
									key={stat.labelKey}
									className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
									<p className="text-xs font-medium uppercase text-zinc-500">{t(stat.labelKey)}</p>
									<p className="mt-1 text-2xl font-semibold text-zinc-900">{stat.value}</p>
								</div>
							))}
						</div>
					))}

					{children}

					{note && <p className="text-sm text-amber-700">{note}</p>}

					{error && <p className="text-sm font-medium text-red-700">{error}</p>}
				</div>

				{!busy && (
					<DialogFooter>
						{footerActions}
						<Button variant="secondary" onClick={() => onOpenChange(false)}>
							{t('dialog.close')}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
