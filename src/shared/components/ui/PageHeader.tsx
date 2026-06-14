'use client';
import React from 'react';
import { cn } from '@/shared/lib/utils';

interface PageHeaderProps {
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

function PageHeader({ title, description, action, className }: PageHeaderProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
				className,
			)}>
			<div>
				<h1 className="text-3xl font-bold text-zinc-900">{title}</h1>
				{description && <p className="mt-2 text-zinc-600">{description}</p>}
			</div>
			{action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
		</div>
	);
}

export { PageHeader };
