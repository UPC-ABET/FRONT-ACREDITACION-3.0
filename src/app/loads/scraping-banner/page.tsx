import dynamic from 'next/dynamic';

const ScrapingBannerUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.ScrapingBannerUploadPage));

export default ScrapingBannerUploadPage;
