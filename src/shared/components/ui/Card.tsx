'use client';
import React from 'react';
import { SubTitle, Title } from '@/shared';

interface CardProps {
	title?: string;
	children: React.ReactNode;
	description?: string;
	className?: string;
}

function Card({ title, children, description, className = '' }: CardProps) {
	return (
		<div
			className={`bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden ${className}`}>
			{(title || description) && (
				<div className="p-4 border-b border-zinc-100">
					{title && (
						<Title title={title} className="[&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-zinc-800" />
					)}
					{description && (
						<SubTitle
							name={description}
							className="[&_h3]:text-xs [&_h3]:font-normal [&_h3]:text-zinc-500"
						/>
					)}
				</div>
			)}
			<div className="p-4 text-zinc-600 text-sm">{children}</div>
		</div>
	);
}

export { Card };
