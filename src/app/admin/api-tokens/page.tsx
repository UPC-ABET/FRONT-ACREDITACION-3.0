import dynamic from 'next/dynamic';

const AdminApiTokensPage = dynamic(() =>
	import('@/modules/admin/api-tokens').then((m) => m.AdminApiTokensPage),
);

export default AdminApiTokensPage;
