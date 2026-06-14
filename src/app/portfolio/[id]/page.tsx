import { PortfolioDetailPage } from '@/modules/portfolio';

interface Params {
	params: Promise<{ id: string }>;
}

export default async function Page({ params }: Params) {
	const { id } = await params;
	return <PortfolioDetailPage projectId={id} />;
}

export const metadata = {
	title: 'Project Detail | ABET',
};
