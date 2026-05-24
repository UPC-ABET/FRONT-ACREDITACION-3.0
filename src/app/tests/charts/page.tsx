import dynamic from 'next/dynamic';

const ChartsPage = dynamic(() => import('@/modules/tests').then((m) => m.ChartsPage), {
	ssr: false,
});

export const metadata = {
	title: 'Graficos',
};

export default ChartsPage;
