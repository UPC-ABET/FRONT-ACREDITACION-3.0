'use client';
import React from 'react';
import { cn } from '@/shared/lib/utils';

type BadgeVariant = 'default' | 'danger' | 'success' | 'outline';

interface BadgeProps {
	children: React.ReactNode;
	variant?: BadgeVariant;
	color?: string;
	className?: string;
}

function hexWithAlpha(hex: string, alphaHex: string): string {
	const clean = hex.trim();
	if (/^#[0-9a-fA-F]{6}$/.test(clean)) return `${clean}${alphaHex}`;
	return clean;
}

function Badge({ children, variant = 'default', color, className }: BadgeProps) {
	const baseClass =
		'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border';

	if (color) {
		return (
			<span
				className={cn(baseClass, className)}
				style={{
					color,
					backgroundColor: hexWithAlpha(color, '1A'),
					borderColor: hexWithAlpha(color, '33'),
				}}>
				{children}
			</span>
		);
	}

	const variants = {
		default: 'bg-zinc-100 text-zinc-700 border-transparent',
		danger: 'bg-red-100 text-red-700 border-transparent',
		success: 'bg-emerald-100 text-emerald-700 border-transparent',
		outline: 'border-zinc-200 text-zinc-600 bg-transparent',
	};

	return <span className={cn(baseClass, variants[variant], className)}>{children}</span>;
}

export { Badge };
