import { apiDelete, apiGet, apiPost, apiPut, getApiData, ApiError } from '@/shared/lib';
import type {
	IamUser,
	UserCreateBody,
	UserFilters,
	UserListParams,
	UserListResult,
	UserUpdateBody,
} from '../types';

interface RawStaff {
	id: number;
	code: string | null;
	firstName: string;
	lastName: string;
}

type RawUser = Omit<IamUser, 'linkedTeacher' | 'staffId'> & {
	staff?: RawStaff | null;
	staffId?: number | null;
};

function normalizeUser(rawUser: RawUser): IamUser {
	const { staff, ...user } = rawUser;
	return {
		...user,
		id: Number(user.id),
		documentTypeId: user.documentTypeId == null ? null : Number(user.documentTypeId),
		isActive: Boolean(user.isActive),
		staffId: staff ? Number(staff.id) : null,
		linkedTeacher: staff
			? {
					staffId: Number(staff.id),
					code: staff.code,
					firstName: staff.firstName,
					lastName: staff.lastName,
				}
			: null,
	};
}

interface RawUserList {
	items: RawUser[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export async function listUsers(params: UserListParams): Promise<UserListResult> {
	const query = new URLSearchParams();
	query.set('page', String(params.page));
	query.set('pageSize', String(params.pageSize));
	if (params.search) query.set('search', params.search);
	if (params.unlinkedOnly) query.set('unlinkedOnly', 'true');

	const response = await apiGet(`/users/get-all?${query.toString()}`);
	const data = getApiData<RawUserList>(response);
	if (!data || !Array.isArray(data.items)) throw new ApiError('admin.iam.users.error.listFailed');

	return {
		items: data.items.map(normalizeUser),
		total: data.total,
		page: data.page,
		pageSize: data.pageSize,
		totalPages: data.totalPages,
	};
}

export async function getUserById(id: number): Promise<IamUser> {
	const response = await apiGet(`/users/get-by-id/${Number(id)}`);
	return normalizeUser(getApiData<RawUser>(response));
}

export async function getUsersByFilters(filters: UserFilters): Promise<IamUser[]> {
	const response = await apiPost('/users/get-by-filters', filters);
	const users = getApiData<RawUser[]>(response);
	if (!Array.isArray(users)) throw new ApiError('admin.iam.users.error.listFailed');
	return users.map(normalizeUser);
}

export async function createUser(body: UserCreateBody): Promise<IamUser> {
	const response = await apiPost('/users/create', body);
	return normalizeUser(getApiData<RawUser>(response));
}

export async function updateUser(id: number, body: UserUpdateBody): Promise<IamUser> {
	const response = await apiPut(`/users/update/${Number(id)}`, body);
	return normalizeUser(getApiData<RawUser>(response));
}

export async function deleteUser(id: number): Promise<void> {
	await apiDelete(`/users/delete/${Number(id)}`);
}
