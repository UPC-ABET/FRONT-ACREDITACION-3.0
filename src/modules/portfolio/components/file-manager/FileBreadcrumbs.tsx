'use client';

import { Fragment } from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import type { BreadcrumbSegment } from '../../types';

type Props = {
	segments: BreadcrumbSegment[];
	onNavigate: (prefix: string) => void;
};

export function FileBreadcrumbs({ segments, onNavigate }: Props) {
	return (
		<nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumb">
			{segments.map((segment, index) => {
				const isLast = index === segments.length - 1;
				return (
					<Fragment key={segment.prefix || 'root'}>
						{index > 0 && <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-300" />}
						<button
							type="button"
							disabled={isLast}
							onClick={() => onNavigate(segment.prefix)}
							className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
								isLast
									? 'cursor-default text-zinc-900'
									: 'text-zinc-500 hover:bg-zinc-100 hover:text-red-600'
							}`}>
							{index === 0 && <HomeIcon className="h-4 w-4" />}
							{segment.name}
						</button>
					</Fragment>
				);
			})}
		</nav>
	);
}
