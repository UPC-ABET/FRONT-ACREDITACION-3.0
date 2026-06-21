import dynamic from 'next/dynamic';

const AdminIamPage = dynamic(() => import('@/modules/admin/iam').then((m) => m.AdminIamPage));

export default AdminIamPage;
