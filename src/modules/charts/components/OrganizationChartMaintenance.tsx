'use client';

import { useRef, useState } from 'react';
import {
	ArrowsPointingInIcon,
	ArrowsPointingOutIcon,
	DocumentArrowDownIcon,
	ExclamationTriangleIcon,
	MagnifyingGlassMinusIcon,
	MagnifyingGlassPlusIcon,
	PhotoIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ConfirmDialog,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	SubTitle,
	Title,
	Toast,
} from '@/shared';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { useABET, useI18n } from '@/providers';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from '../constants';
import { useChartMutations, useChartTree } from '../hooks';
import type { ChartNode } from '../types';
import { collectNodeIdsWithChildren } from '../utils/layout';
import { exportSvgAsPdf, exportSvgAsPng } from '../utils/exportChart';
import { ChartNodeDialog } from '@/modules/charts';
import { ChartNodeMenu } from './ChartNodeMenu';
import { OrgChart } from './OrgChart';

interface MenuState {
	node: ChartNode;
	x: number;
	y: number;
}

interface DialogState {
	mode: 'create' | 'edit';
	node: ChartNode;
}

export function OrganizationChartMaintenance() {
	const { t, locale } = useI18n();
	const { academicPeriodId, schoolId } = useABET();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const treeQuery = useChartTree(academicPeriodId, schoolId);
	const { remove } = useChartMutations();

	const svgRef = useRef<SVGSVGElement>(null);

	const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
	const [scale, setScale] = useState(1);
	const [hoveredId, setHoveredId] = useState<number | null>(null);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [menu, setMenu] = useState<MenuState | null>(null);
	const [dialog, setDialog] = useState<DialogState | null>(null);
	const [pendingDelete, setPendingDelete] = useState<ChartNode | null>(null);
	const [blockedReasons, setBlockedReasons] = useState<string[] | null>(null);
	const [exportingKind, setExportingKind] = useState<'png' | 'pdf' | null>(null);
	const exporting = exportingKind !== null;

	const root = treeQuery.data ?? null;
	const contextReady = academicPeriodId != null && schoolId != null;

	const closeMenu = () => {
		setMenu(null);
		setSelectedId(null);
	};

	const handleToggle = (chartId: number) => {
		setCollapsed((previous) => {
			const next = new Set(previous);
			if (next.has(chartId)) next.delete(chartId);
			else next.add(chartId);
			return next;
		});
	};

	const handleSelect = (node: ChartNode, clientX: number, clientY: number) => {
		setSelectedId(node.chartId);
		setMenu({ node, x: clientX, y: clientY });
	};

	const handleExpandAll = () => setCollapsed(new Set());
	const handleCollapseAll = () => {
		if (root) setCollapsed(new Set(collectNodeIdsWithChildren(root)));
	};

	const changeZoom = (delta: number) =>
		setScale((current) =>
			Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))),
		);

	const handleExport = async (kind: 'png' | 'pdf') => {
		if (!svgRef.current) return;
		setExportingKind(kind);
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
		);
		try {
			if (kind === 'png') await exportSvgAsPng(svgRef.current, 'organigrama.png');
			else await exportSvgAsPdf(svgRef.current, 'organigrama.pdf');
		} catch {
			showToast('loads.organizationChartMaintenance.export.error', 'error');
		} finally {
			setExportingKind(null);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.chartId);
			showToast('loads.organizationChartMaintenance.toast.deleted', 'success');
			setPendingDelete(null);
		} catch (error) {
			const reasons = getApiErrorReasons(error);
			setPendingDelete(null);
			if (reasons.length > 0) setBlockedReasons(reasons);
			else showToast('loads.organizationChartMaintenance.error.deleteFailed', 'error');
		}
	};

	const renderChartArea = () => {
		if (!contextReady) {
			return renderNotice(t('loads.organizationChartMaintenance.selectContext'));
		}
		if (treeQuery.isLoading) {
			return (
				<div className="space-y-2" aria-busy>
					{Array.from({ length: 6 }).map((_, index) => (
						<div key={index} className="h-16 animate-pulse rounded-lg bg-zinc-100" />
					))}
				</div>
			);
		}
		if (treeQuery.isError) {
			return (
				<div className="flex flex-col items-center gap-3 py-16 text-center">
					<p className="text-sm text-zinc-500">
						{t('loads.organizationChartMaintenance.error.loadFailed')}
					</p>
					<Button variant="surface" size="sm" onClick={() => treeQuery.refetch()}>
						{t('loads.organizationChartMaintenance.retry')}
					</Button>
				</div>
			);
		}
		if (!root) {
			return renderNotice(t('loads.organizationChartMaintenance.notConfigured'));
		}
		return (
			<div className="max-h-[72vh] min-h-[420px] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50">
				<OrgChart
					root={root}
					collapsed={collapsed}
					scale={scale}
					hoveredId={hoveredId}
					selectedId={exporting ? null : selectedId}
					exporting={exporting}
					svgRef={svgRef}
					onHover={setHoveredId}
					onSelect={handleSelect}
					onToggle={handleToggle}
					locale={locale}
				/>
			</div>
		);
	};

	const chartReady = contextReady && Boolean(root) && !treeQuery.isLoading;

	return (
		<Card>
			<div className="space-y-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="space-y-1">
						<Title
							title={t('loads.organizationChartMaintenance.title')}
							className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
						/>
						<SubTitle
							name={t('loads.organizationChartMaintenance.subtitle')}
							className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1">
							<Button
								variant="ghost"
								size="icon"
								disabled={!chartReady || scale <= MIN_ZOOM}
								onClick={() => changeZoom(-ZOOM_STEP)}
								aria-label={t('loads.organizationChartMaintenance.toolbar.zoomOut')}
								title={t('loads.organizationChartMaintenance.toolbar.zoomOut')}>
								<MagnifyingGlassMinusIcon className="h-4 w-4" />
							</Button>
							<span className="w-12 text-center text-xs font-medium text-zinc-600">
								{Math.round(scale * 100)}%
							</span>
							<Button
								variant="ghost"
								size="icon"
								disabled={!chartReady || scale >= MAX_ZOOM}
								onClick={() => changeZoom(ZOOM_STEP)}
								aria-label={t('loads.organizationChartMaintenance.toolbar.zoomIn')}
								title={t('loads.organizationChartMaintenance.toolbar.zoomIn')}>
								<MagnifyingGlassPlusIcon className="h-4 w-4" />
							</Button>
						</div>

						<Button variant="surface" size="sm" disabled={!chartReady} onClick={handleExpandAll}>
							<ArrowsPointingOutIcon className="h-4 w-4" />
							<span>{t('loads.organizationChartMaintenance.toolbar.expandAll')}</span>
						</Button>
						<Button variant="surface" size="sm" disabled={!chartReady} onClick={handleCollapseAll}>
							<ArrowsPointingInIcon className="h-4 w-4" />
							<span>{t('loads.organizationChartMaintenance.toolbar.collapseAll')}</span>
						</Button>

						<Button
							variant="surface"
							size="sm"
							disabled={!chartReady || exporting}
							loading={exportingKind === 'png'}
							onClick={() => handleExport('png')}>
							<PhotoIcon className="h-4 w-4" />
							<span>{t('loads.organizationChartMaintenance.toolbar.exportPng')}</span>
						</Button>
						<Button
							variant="surface"
							size="sm"
							disabled={!chartReady || exporting}
							loading={exportingKind === 'pdf'}
							onClick={() => handleExport('pdf')}>
							<DocumentArrowDownIcon className="h-4 w-4" />
							<span>{t('loads.organizationChartMaintenance.toolbar.exportPdf')}</span>
						</Button>
					</div>
				</div>

				{renderChartArea()}
			</div>

			{menu && (
				<ChartNodeMenu
					node={menu.node}
					x={menu.x}
					y={menu.y}
					onEdit={() => {
						setDialog({ mode: 'edit', node: menu.node });
						closeMenu();
					}}
					onAddChild={() => {
						setDialog({ mode: 'create', node: menu.node });
						closeMenu();
					}}
					onDelete={() => {
						setPendingDelete(menu.node);
						closeMenu();
					}}
					onClose={closeMenu}
				/>
			)}

			<ChartNodeDialog
				open={dialog != null}
				mode={dialog?.mode ?? 'create'}
				node={dialog?.node ?? null}
				onClose={() => setDialog(null)}
				onSaved={() => {
					setDialog(null);
					showToast('loads.organizationChartMaintenance.toast.saved', 'success');
				}}
			/>

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('loads.organizationChartMaintenance.delete.title')}
				message={t('loads.organizationChartMaintenance.delete.message')}
				confirmLabel={t('loads.organizationChartMaintenance.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirmDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={remove.isPending}
			/>

			<Dialog
				open={blockedReasons != null}
				onOpenChange={(open) => {
					if (!open) setBlockedReasons(null);
				}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-2 text-red-700">
							<ExclamationTriangleIcon className="h-5 w-5" />
							<DialogTitle>
								{t('loads.organizationChartMaintenance.delete.blockedTitle')}
							</DialogTitle>
						</div>
						<DialogDescription>
							{t('loads.organizationChartMaintenance.delete.blockedSubtitle')}
						</DialogDescription>
					</DialogHeader>
					<ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
						{(blockedReasons ?? []).map((reason) => (
							<li key={reason}>{tryTranslate(t, reason)}</li>
						))}
					</ul>
					<DialogFooter showCloseButton />
				</DialogContent>
			</Dialog>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);

	function renderNotice(message: string) {
		return (
			<div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
				<p className="text-sm text-zinc-500">{message}</p>
			</div>
		);
	}
}
