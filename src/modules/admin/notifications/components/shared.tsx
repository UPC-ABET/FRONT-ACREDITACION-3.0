'use client';

import type { ReactNode } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Card, SubTitle, Title, Toggle } from '@/shared';
import { useI18n } from '@/providers';

export function TabHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div className="space-y-1">
			<Title
				title={title}
				className="[&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-zinc-900"
			/>
			{description && (
				<SubTitle
					name={description}
					className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-500"
				/>
			)}
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
				<Title
					title={title}
					className="[&_h2]:text-sm [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-zinc-700"
				/>
				{hint && (
					<SubTitle
						name={hint}
						className="[&_h3]:text-xs [&_h3]:font-normal [&_h3]:text-zinc-500"
					/>
				)}
			</div>
			{children}
		</section>
	);
}

export function EditorCard({ title, children }: { title?: string; children: ReactNode }) {
	return (
		<Card className="overflow-visible">
			<div className="space-y-8">
				{title && (
					<Title title={title} className="[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-zinc-900" />
				)}
				{children}
			</div>
		</Card>
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
		<Card className="bg-zinc-50/60">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">{left}</div>
				<div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
			</div>
		</Card>
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
