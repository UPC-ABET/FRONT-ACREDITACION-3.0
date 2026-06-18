import type { I18nText } from '@/shared/types';

export interface LinkedTeacher {
	staffId: number;
	code: string | null;
	firstName: string;
	lastName: string;
}

export interface IamUser {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	documentTypeId: number | null;
	documentCode: string | null;
	isActive: boolean;
	staffId: number | null;
	linkedTeacher: LinkedTeacher | null;
	extra: Record<string, unknown> | null;
}

export interface UserCreateBody {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	documentTypeId?: number;
	documentCode?: string;
	isActive?: boolean;
	staffId?: number | null;
	extra?: Record<string, unknown>;
}

export type UserUpdateBody = Partial<UserCreateBody>;

export interface UserFilters {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	documentTypeId?: number;
	documentCode?: string;
	isActive?: boolean;
}

export interface UserListParams {
	page: number;
	pageSize: number;
	search?: string;
	unlinkedOnly?: boolean;
}

export interface UserListResult {
	items: IamUser[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface AdminRole {
	id: number;
	code: string;
	name: I18nText;
	description: I18nText | null;
	isActive: boolean;
	extra: Record<string, unknown> | null;
}

export interface RoleCreateBody {
	code: string;
	name: I18nText;
	description?: I18nText;
	isActive?: boolean;
	extra?: Record<string, unknown>;
}

export type RoleUpdateBody = Partial<RoleCreateBody>;

export interface UserRole {
	id: number;
	userId: number;
	roleId: number;
	isActive: boolean;
}

export interface RoleModulePermission {
	id: number;
	roleId: number;
	moduleTypeId: number;
	permissionTypeId: number;
	isActive: boolean;
}

export interface IamType {
	id: number;
	typeGroupId: number;
	code: string;
	name: I18nText;
	description: I18nText | null;
	extra: IamTypeExtra | null;
}

export interface IamTypeExtra {
	route?: string;
	module?: string;
}

export interface ModuleTypeCreateBody {
	typeGroupId: number;
	name: I18nText;
	extra: Required<IamTypeExtra>;
}

export interface PermissionTypeCreateBody {
	typeGroupId: number;
	name: I18nText;
}

export interface TypeUpdateBody {
	name?: I18nText;
	extra?: IamTypeExtra;
}

export interface MatrixCell {
	moduleTypeId: number;
	permissionTypeId: number;
}

export interface UserFormValues {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	documentTypeId: number | null;
	documentCode: string;
	roleIds: number[];
}

export interface UserFormErrors {
	firstName?: string;
	lastName?: string;
	email?: string;
}

export interface RoleFormValues {
	code: string;
	name: I18nText;
	description: I18nText;
	cells: MatrixCell[];
}

export interface RoleFormErrors {
	code?: string;
	name?: string;
}

export interface ModuleTypeFormValues {
	name: I18nText;
	route: string;
	module: string;
}

export interface PermissionTypeFormValues {
	name: I18nText;
}

export interface TypeFormErrors {
	name?: string;
	route?: string;
	module?: string;
}
