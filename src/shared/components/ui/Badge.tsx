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

function parseHex(hex: string): [number, number, number] | null {
	const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
	if (!match) return null;
	const int = parseInt(match[1], 16);
	return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function contrastWithWhite([r, g, b]: [number, number, number]): number {
	const channel = (c: number) => {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	};
	const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
	return 1.05 / (luminance + 0.05);
}

// The badge background is a 10% tint of `color` on white, so the label sits on a near-white
// surface. A light `color` used verbatim as text fails AA contrast — darken it toward black
// until it clears 4.5:1 against white. Sufficiently dark colors are returned unchanged.
function readableTextColor(hex: string): string {
	const rgb = parseHex(hex);
	if (!rgb) return hex;
	let factor = 1;
	while (
		factor > 0.1 &&
		contrastWithWhite([rgb[0] * factor, rgb[1] * factor, rgb[2] * factor]) < 4.5
	) {
		factor -= 0.05;
	}
	if (factor >= 1) return hex.trim();
	const toHex = (n: number) =>
		Math.round(n * factor)
			.toString(16)
			.padStart(2, '0');
	return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

function Badge({ children, variant = 'default', color, className }: BadgeProps) {
	const baseClass =
		'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border';

	if (color) {
		return (
			<span
				className={cn(baseClass, className)}
				style={{
					color: readableTextColor(color),
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
