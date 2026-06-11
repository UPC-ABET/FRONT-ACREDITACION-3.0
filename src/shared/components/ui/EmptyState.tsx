'use client';

import { InboxIcon } from '@heroicons/react/24/outline';

interface TableEmptyStateProps {
	message: string;
	icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	action?: React.ReactNode;
}

export function TableEmptyState({ message, icon: Icon = InboxIcon, action }: TableEmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-white py-14 text-zinc-500">
			<Icon className="h-10 w-10 text-zinc-400" aria-hidden="true" />
			<p className="text-base italic">{message}</p>
			{action}
		</div>
	);
}

interface TableErrorStateProps {
	message: string;
	onRetry?: () => void;
	retryLabel?: string;
}

export function TableErrorState({ message, onRetry, retryLabel }: TableErrorStateProps) {
	return (
		<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-base text-red-800">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth={1.5}
				stroke="currentColor"
				className="h-6 w-6 flex-shrink-0 text-red-600"
				aria-hidden="true">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
				/>
			</svg>
			<div className="flex-1">
				<p>{message}</p>
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="mt-2 text-sm font-medium text-red-700 hover:bg-red-100 rounded px-2 py-1 transition-colors">
						{retryLabel ?? 'Retry'}
					</button>
				)}
			</div>
		</div>
	);
}
