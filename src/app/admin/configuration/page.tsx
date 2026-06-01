import dynamic from 'next/dynamic';

const AdminConfigurationPage = dynamic(() =>
	import('@/modules/admin/configuration').then((m) => m.AdminConfigurationPage),
);

export default function Page() {
	return <AdminConfigurationPage />;
}
