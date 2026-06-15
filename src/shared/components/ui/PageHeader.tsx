'use client';
import React from 'react';
import { cn } from '@/shared/lib/utils';
import { SubTitle, Title } from './Typography';

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
				<Title title={title} className="[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-zinc-900" />
				{description && (
					<SubTitle
						name={description}
						className="mt-2 [&_h3]:text-base [&_h3]:font-normal [&_h3]:text-zinc-600"
					/>
				)}
			</div>
			{action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
		</div>
	);
}

export { PageHeader };
