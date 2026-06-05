import dynamic from 'next/dynamic';

const PortfolioListPage = dynamic(() =>
	import('@/modules/portfolio').then((m) => m.PortfolioListPage),
);

export default PortfolioListPage;

export const metadata = {
	title: 'Portafolio | ABET',
};
