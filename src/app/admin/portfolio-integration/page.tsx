import dynamic from 'next/dynamic';

const AdminPortfolioIntegrationPage = dynamic(() =>
	import('@/modules/admin/portfolio-integration').then((m) => m.AdminPortfolioIntegrationPage),
);

export default AdminPortfolioIntegrationPage;
