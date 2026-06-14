import dynamic from 'next/dynamic';

const PortfolioFileManagerPage = dynamic(() =>
	import('@/modules/portfolio').then((m) => m.PortfolioFileManagerPage),
);

export default PortfolioFileManagerPage;

export const metadata = {
	title: 'Portfolio | ABET',
};
