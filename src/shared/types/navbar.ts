export type ProgramOption = {
	value: string;
	label?: string;
	labelKey?: string;
};

export type NavbarProps = {
	schoolName?: string;
	programType?: string;
	programOptions?: ProgramOption[];
	userName?: string;
	userRole?: string;
	userInitials?: string;
};

export type StoredUser = {
	first_name?: string;
	last_name?: string;
	is_admin?: boolean;
};
