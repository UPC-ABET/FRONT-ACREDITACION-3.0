'use client';

import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';

const SPINNER_SIZES = {
	sm: 'h-4 w-4 border-2',
	md: 'h-6 w-6 border-2',
	lg: 'h-10 w-10 border-4',
} as const;

type SpinnerSize = keyof typeof SPINNER_SIZES;

interface SpinnerProps {
	size?: SpinnerSize;
	className?: string;
	'aria-label'?: string;
}

function Spinner({ size = 'md', className, 'aria-label': ariaLabel = 'Loading' }: SpinnerProps) {
	return (
		<span
			role="status"
			aria-label={ariaLabel}
			className={cn(
				'inline-block animate-spin rounded-full border-red-600 border-t-transparent align-[-0.125em]',
				SPINNER_SIZES[size],
				className,
			)}
		/>
	);
}

interface LoadingStateProps {
	size?: SpinnerSize;
	className?: string;
	label?: string;
}

function LoadingState({ size = 'md', className, label }: LoadingStateProps) {
	const { t } = useI18n();
	const resolvedLabel = label ?? t('loading.default');
	return (
		<div className={cn('flex items-center justify-center py-10', className)} role="status">
			<Spinner size={size} aria-label={resolvedLabel} />
			<span className="sr-only">{resolvedLabel}</span>
		</div>
	);
}

export { Spinner, LoadingState };
