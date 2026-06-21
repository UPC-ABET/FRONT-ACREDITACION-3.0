import dynamic from 'next/dynamic';

const AdminNotificationsPage = dynamic(() =>
	import('@/modules/admin/notifications').then((m) => m.AdminNotificationsPage),
);

export default AdminNotificationsPage;
