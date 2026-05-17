'use client';
import * as React from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/shared/lib/utils';
import { Button } from './Button';
import { Input } from './Input';
import { useI18n } from '@/providers';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';

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

// MOTOR DATA TABLE ---

interface DataTableAction {
	label: string;
	onClick: () => void;
	icon?: React.ReactNode;
	showLabel?: boolean;
	buttonProps?: Omit<React.ComponentProps<typeof Button>, 'onClick' | 'children'>;
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	pageSize?: number;
	title?: string;
	dataPage?: {
		page: number;
		totalPages: number;
	};
	showSearch?: boolean;
	searchPlaceholder?: string;
	searchColumnId?: string;
	actions?: DataTableAction[];
	showPagination?: boolean;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	pageSize = DEFAULT_PAGE_SIZE,
	title,
	showSearch = true,
	searchPlaceholder,
	searchColumnId,
	actions = [],
	showPagination = true,
}: DataTableProps<TData, TValue>) {
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = React.useState('');
	const { t } = useI18n();

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
		getFilteredRowModel: getFilteredRowModel(),
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
			pagination: { pageSize: showPagination ? pageSize : Math.max(data.length, 1) },
		},
	});

	const searchValue = searchColumnId
		? ((table.getColumn(searchColumnId)?.getFilterValue() as string) ?? '')
		: globalFilter;

	const placeholderText = searchPlaceholder ?? t('table.search.placeholder');

	const handleSearchChange = (value: string) => {
		if (searchColumnId) {
			table.getColumn(searchColumnId)?.setFilterValue(value);
			return;
		}
		setGlobalFilter(value);
	};

	return (
		<div className="space-y-4">
			{title && (
				<h3 className="text-lg font-bold text-zinc-800 px-1 uppercase tracking-tight">{title}</h3>
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

			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
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
								{t('table.empty')}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{/* PAGINACIÓN */}
			{showPagination && (
				<div className="flex items-center justify-center gap-4 py-4">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						className="rounded-md bg-red-50 px-4 py-2 text-sm font-bold text-red-600 border-none hover:bg-red-100 disabled:bg-zinc-100 disabled:text-zinc-400 transition-all">
						{t('table.pagination.previous')}
					</Button>

					<div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest bg-zinc-100 px-3 py-1 rounded-full">
						{t('table.pagination.page')} {table.getState().pagination.pageIndex + 1}{' '}
						{t('table.pagination.of')} {table.getPageCount()}
					</div>

					<Button
						variant="secondary"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						className="rounded-md bg-red-50 px-4 py-2 text-sm font-bold text-red-600 border-none hover:bg-red-100 disabled:bg-zinc-100 disabled:text-zinc-400 transition-all">
						{t('table.pagination.next')}
					</Button>
				</div>
			)}
		</div>
	);
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
