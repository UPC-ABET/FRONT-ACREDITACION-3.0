'use client';

import type { ReactNode } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Toggle } from '@/shared/components';
import { useI18n } from '@/providers';

export function TabHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div className="space-y-1">
			<h2 className="text-xl font-bold tracking-tight text-zinc-900">{title}</h2>
			{description && <p className="text-sm text-zinc-500">{description}</p>}
		</div>
	);
}

export function FormSection({
	title,
	hint,
	children,
}: {
	title: string;
	hint?: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-3">
			<div className="space-y-1">
				<h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700">{title}</h3>
				{hint && <p className="text-xs text-zinc-500">{hint}</p>}
			</div>
			{children}
		</section>
	);
}

export function EditorCard({ title, children }: { title?: string; children: ReactNode }) {
	return (
		<div className="space-y-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
			{title && <h3 className="text-lg font-bold text-zinc-900">{title}</h3>}
			{children}
		</div>
	);
}

export function EditorShell({
	title,
	onBack,
	children,
	footer,
}: {
	title?: string;
	onBack: () => void;
	children: ReactNode;
	footer: ReactNode;
}) {
	const { t } = useI18n();
	return (
		<div className="space-y-5">
			<Button variant="ghost" size="sm" onClick={onBack} className="self-start text-zinc-600">
				<ArrowLeftIcon className="h-4 w-4" />
				{t('admin.notify.btn.back')}
			</Button>
			<EditorCard title={title}>{children}</EditorCard>
			{footer}
		</div>
	);
}

export function EditorActions({ left, children }: { left?: ReactNode; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-3">{left}</div>
			<div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
		</div>
	);
}

export function ActiveToggle({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	const { t } = useI18n();
	return (
		<>
			<Toggle checked={checked} onChange={onChange} />
			<span className="text-base font-medium text-zinc-900">
				{t('admin.notify.field.isActive')}
			</span>
		</>
	);
}

export function StatusBadge({ active }: { active: boolean }) {
	const { t } = useI18n();
	return (
		<Badge variant={active ? 'success' : 'default'}>
			{t(active ? 'admin.notify.badge.active' : 'admin.notify.badge.inactive')}
		</Badge>
	);
}
