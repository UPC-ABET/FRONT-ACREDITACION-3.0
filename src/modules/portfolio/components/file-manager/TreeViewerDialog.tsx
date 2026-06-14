'use client';

import { useMemo, useState } from 'react';
import {
	ChevronDownIcon,
	ChevronRightIcon,
	DocumentIcon,
	FolderIcon,
	PrinterIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Skeleton,
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { usePortfolioTreeKeys } from '../../hooks';
import { buildTree, treeToText, type TreeNode } from './fileManagerUtils';

type Props = {
	isOpen: boolean;
	prefix: string;
	onClose: () => void;
};

function TreeBranch({
	node,
	expanded,
	onToggle,
}: {
	node: TreeNode;
	expanded: Set<string>;
	onToggle: (key: string) => void;
}) {
	const isOpen = expanded.has(node.key);
	return (
		<li>
			<div className="flex items-center gap-1.5 py-1">
				{node.isFolder ? (
					<button
						type="button"
						onClick={() => onToggle(node.key)}
						className="inline-flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
						{isOpen ? (
							<ChevronDownIcon className="h-4 w-4" />
						) : (
							<ChevronRightIcon className="h-4 w-4" />
						)}
					</button>
				) : (
					<span className="inline-block h-5 w-5" />
				)}
				{node.isFolder ? (
					<FolderIcon className="h-4 w-4 shrink-0 text-amber-500" />
				) : (
					<DocumentIcon className="h-4 w-4 shrink-0 text-red-400" />
				)}
				<span
					className={`truncate text-sm ${node.isFolder ? 'font-medium text-zinc-800' : 'text-zinc-600'}`}>
					{node.name}
				</span>
			</div>
			{node.isFolder && isOpen && node.children.length > 0 && (
				<ul className="ml-5 border-l border-zinc-100 pl-2">
					{node.children.map((child) => (
						<TreeBranch key={child.key} node={child} expanded={expanded} onToggle={onToggle} />
					))}
				</ul>
			)}
		</li>
	);
}

export function TreeViewerDialog({ isOpen, prefix, onClose }: Props) {
	const { t } = useI18n();
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	const { data: keys, isLoading } = usePortfolioTreeKeys(prefix, isOpen);
	const tree = useMemo(() => buildTree(keys ?? []), [keys]);

	function toggle(key: string) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}

	function collectFolderKeys(nodes: TreeNode[], acc: string[] = []): string[] {
		for (const node of nodes) {
			if (node.isFolder) {
				acc.push(node.key);
				collectFolderKeys(node.children, acc);
			}
		}
		return acc;
	}

	function expandAll() {
		setExpanded(new Set(collectFolderKeys(tree)));
	}

	function collapseAll() {
		setExpanded(new Set());
	}

	function handlePrint() {
		const printWindow = window.open('', '_blank', 'width=800,height=600');
		if (!printWindow) return;
		const body = treeToText(tree).replace(/[<>&]/g, (c) =>
			c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;',
		);
		printWindow.document.write(
			`<html><head><title>${t('portfolio.tree.printTitle')}</title>` +
				`<style>body{font-family:monospace;white-space:pre;padding:24px;font-size:13px}` +
				`h2{font-family:sans-serif}</style></head><body>` +
				`<h2>${t('portfolio.tree.printTitle')}</h2>${body}</body></html>`,
		);
		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}>
			<DialogContent showCloseButton className="max-w-2xl">
				<DialogHeader className="gap-0">
					<DialogTitle>{t('portfolio.tree.title')}</DialogTitle>
				</DialogHeader>

				<div className="flex flex-wrap gap-2">
					<Button variant="secondary" size="sm" onClick={expandAll} disabled={isLoading}>
						{t('portfolio.tree.expandAll')}
					</Button>
					<Button variant="secondary" size="sm" onClick={collapseAll} disabled={isLoading}>
						{t('portfolio.tree.collapseAll')}
					</Button>
					<Button
						variant="surface"
						size="sm"
						onClick={handlePrint}
						disabled={isLoading || tree.length === 0}>
						<PrinterIcon className="h-4 w-4" />
						{t('portfolio.tree.print')}
					</Button>
				</div>

				<div className="max-h-[60vh] min-h-40 overflow-y-auto rounded-lg border border-zinc-200 p-3">
					{isLoading ? (
						<div className="space-y-2">
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton key={`tree-sk-${i}`} className="h-6 w-full rounded-md" />
							))}
						</div>
					) : tree.length === 0 ? (
						<p className="py-8 text-center text-sm text-zinc-400">{t('portfolio.tree.empty')}</p>
					) : (
						<ul>
							{tree.map((node) => (
								<TreeBranch key={node.key} node={node} expanded={expanded} onToggle={toggle} />
							))}
						</ul>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
