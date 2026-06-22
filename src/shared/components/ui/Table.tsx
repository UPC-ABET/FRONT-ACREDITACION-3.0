'use client';
import * as React from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	RowData,
	useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib';
import { Skeleton, SubTitle, Title, Button, Input, DEFAULT_PAGE_SIZE } from '@/shared';
import { useI18n } from '@/providers';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TData/TValue must match the library's generic signature for declaration merging
	interface ColumnMeta<TData extends RowData, TValue> {
		cellClassName?: string;
		headerClassName?: string;
	}
}

function Table({ className, ...props }: React.ComponentProps<'table'>) {
	return (
		<div
			data-slot="table-container"
			className="relative w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
			<table
				data-slot="table"
				className={cn('w-full caption-bottom text-sm border-collapse', className)}
				{...props}
			/>
		</div>
	);
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
	return (
		<thead
			data-slot="table-header"
			className={cn('bg-zinc-50/100 [&_tr]:border-b border-zinc-200', className)}
			{...props}
		/>
	);
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
	return (
		<tbody
			data-slot="table-body"
			className={cn(
				'[&_tr:last-child]:border-0 [&_tr:nth-child(odd)]:bg-white [&_tr:nth-child(even)]:bg-zinc-50/40 [&_tr:hover]:!bg-zinc-50/70',
				className,
			)}
			{...props}
		/>
	);
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
	return (
		<tr
			data-slot="table-row"
			className={cn(
				'border-b border-zinc-100 transition-colors data-[state=selected]:bg-zinc-100',
				className,
			)}
			{...props}
		/>
	);
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
	return (
		<th
			data-slot="table-head"
			scope="col"
			className={cn(
				'h-12 px-6 text-left align-middle font-bold text-zinc-500 uppercase text-[13px] tracking-wider whitespace-nowrap',
				className,
			)}
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
	return (
		<td
			data-slot="table-cell"
			className={cn(
				'px-6 py-4 align-middle whitespace-nowrap text-[13px] text-zinc-600 font-medium break-words max-w-md',
				className,
			)}
			{...props}
		/>
	);
}

interface DataTableAction {
	label: string;
	onClick: () => void;
	icon?: React.ReactNode;
	showLabel?: boolean;
	buttonProps?: Omit<React.ComponentProps<typeof Button>, 'onClick' | 'children'>;
}

interface ServerPagination {
	page: number;
	pageCount: number;
	total: number;
	onPageChange: (page: number) => void;
	isFetching?: boolean;
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	pageSize?: number;
	title?: string;
	description?: string;
	showSearch?: boolean;
	searchPlaceholder?: string;
	searchColumnId?: string;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	actions?: DataTableAction[];
	showPagination?: boolean;
	serverPagination?: ServerPagination;
	isLoading?: boolean;
	errorMessage?: string;
	emptyMessage?: string;
	tableClassName?: string;
	'aria-label'?: string;
}

const SKELETON_ROW_COUNT = 5;

export function DataTable<TData, TValue>({
	columns,
	data,
	pageSize = DEFAULT_PAGE_SIZE,
	title,
	description,
	showSearch = true,
	searchPlaceholder,
	searchColumnId,
	searchValue: controlledSearchValue,
	onSearchChange,
	actions = [],
	showPagination = true,
	serverPagination,
	isLoading = false,
	errorMessage,
	emptyMessage,
	tableClassName,
	'aria-label': ariaLabel,
}: DataTableProps<TData, TValue>) {
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = React.useState('');
	const { t } = useI18n();

	const isServer = serverPagination !== undefined;
	const clientPaginated = !isServer && showPagination;

	// eslint-disable-next-line react-hooks/incompatible-library -- @tanstack/react-table owns a mutable instance the React Compiler can't analyze
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: clientPaginated ? getPaginationRowModel() : undefined,
		getFilteredRowModel: getFilteredRowModel(),
		manualPagination: isServer,
		pageCount: isServer ? serverPagination.pageCount : undefined,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		state: {
			columnFilters,
			globalFilter,
		},
		globalFilterFn: (row, columnId, filterValue) => {
			const value = row.getValue(columnId);
			return String(value ?? '')
				.toLowerCase()
				.includes(String(filterValue ?? '').toLowerCase());
		},
		initialState: {
			pagination: { pageSize: clientPaginated ? pageSize : Math.max(data.length, 1) },
		},
	});

	const isControlledSearch = onSearchChange !== undefined;
	const searchValue = isControlledSearch
		? (controlledSearchValue ?? '')
		: searchColumnId
			? ((table.getColumn(searchColumnId)?.getFilterValue() as string) ?? '')
			: globalFilter;

	const placeholderText = searchPlaceholder ?? t('table.search.placeholder');

	const handleSearchChange = (value: string) => {
		if (isControlledSearch) {
			onSearchChange(value);
			return;
		}
		if (searchColumnId) {
			table.getColumn(searchColumnId)?.setFilterValue(value);
			return;
		}
		setGlobalFilter(value);
	};

	const hasRows = table.getRowModel().rows.length > 0;
	const showFooter = (clientPaginated || isServer) && hasRows && !isLoading && !errorMessage;

	const currentPage = isServer ? serverPagination.page : table.getState().pagination.pageIndex + 1;
	const pageCount = isServer ? serverPagination.pageCount : table.getPageCount();
	const totalCount = isServer ? serverPagination.total : table.getFilteredRowModel().rows.length;
	const isFetching = isServer ? Boolean(serverPagination.isFetching) : false;
	const canPreviousPage = isServer ? currentPage > 1 : table.getCanPreviousPage();
	const canNextPage = isServer ? currentPage < pageCount : table.getCanNextPage();

	const goToPreviousPage = () => {
		if (isServer) {
			serverPagination.onPageChange(currentPage - 1);
			return;
		}
		table.previousPage();
	};

	const goToNextPage = () => {
		if (isServer) {
			serverPagination.onPageChange(currentPage + 1);
			return;
		}
		table.nextPage();
	};

	return (
		<div className="space-y-4">
			{(title || description) && (
				<div className="space-y-1 px-1">
					{title && (
						<Title
							title={title}
							className="[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-zinc-800 [&_h2]:uppercase"
						/>
					)}
					{description && (
						<SubTitle
							name={description}
							className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-500"
						/>
					)}
				</div>
			)}

			{(showSearch || actions?.length > 0) && (
				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
					{showSearch ? (
						<Input
							placeholder={placeholderText}
							value={searchValue}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="max-w-sm"
						/>
					) : (
						<div />
					)}

					{(actions ?? []).length > 0 && (
						<div className="flex flex-wrap items-center gap-2 sm:justify-end">
							{(actions ?? []).map((action) => (
								<Button
									key={action.label}
									onClick={action.onClick}
									aria-label={action.label}
									{...action.buttonProps}>
									{action.icon && (
										<span
											className={
												action.showLabel === false ? 'flex items-center' : 'mr-2 flex items-center'
											}>
											{action.icon}
										</span>
									)}
									{action.showLabel !== false && action.label}
								</Button>
							))}
						</div>
					)}
				</div>
			)}

			<Table
				aria-label={ariaLabel}
				aria-rowcount={showPagination ? data.length : undefined}
				className={cn(isFetching && 'opacity-60 transition-opacity', tableClassName)}>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead
									key={header.id}
									className={header.column.columnDef.meta?.headerClassName}>
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{isLoading ? (
						Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
							<TableRow key={`skeleton-row-${rowIndex}`}>
								{columns.map((_, columnIndex) => (
									<TableCell key={`skeleton-cell-${rowIndex}-${columnIndex}`}>
										<Skeleton className="h-4 w-[80%]" />
									</TableCell>
								))}
							</TableRow>
						))
					) : errorMessage ? (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center font-medium text-red-600">
								{errorMessage}
							</TableCell>
						</TableRow>
					) : hasRows ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className={cell.column.columnDef.meta?.cellClassName}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-32 text-center text-zinc-400 font-medium italic">
								{emptyMessage ?? t('table.empty')}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{showFooter && (
				<div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-xs text-zinc-500">
						{totalCount} {t('table.pagination.results')}
					</p>
					<div className="flex items-center justify-center gap-3">
						<Button
							variant="surface"
							size="sm"
							onClick={goToPreviousPage}
							disabled={!canPreviousPage || isFetching}
							aria-label={t('table.pagination.previous')}>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="text-sm text-zinc-600">
							{t('table.pagination.page')} {currentPage} / {Math.max(pageCount, 1)}
						</span>
						<Button
							variant="surface"
							size="sm"
							onClick={goToNextPage}
							disabled={!canNextPage || isFetching}
							aria-label={t('table.pagination.next')}>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
