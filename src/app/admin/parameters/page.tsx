import dynamic from 'next/dynamic';

const AdminParametersPage = dynamic(() =>
	import('@/modules/admin/parameters').then((m) => m.AdminParametersPage),
);

export default AdminParametersPage;
