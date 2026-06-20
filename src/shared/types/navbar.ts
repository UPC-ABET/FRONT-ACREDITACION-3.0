import type { ReactNode } from 'react';

export type ProgramOption = {
	value: string;
	label?: string;
	labelKey?: string;
};

export type NavbarFiltersLayout = 'mobile' | 'tablet' | 'desktop';

export type NavbarProps = {
	schoolName?: string;
	programType?: string;
	programOptions?: ProgramOption[];
	userName?: string;
	userRole?: string;
	userInitials?: string;
	filtersSlot?: (layout: NavbarFiltersLayout) => ReactNode;
};
