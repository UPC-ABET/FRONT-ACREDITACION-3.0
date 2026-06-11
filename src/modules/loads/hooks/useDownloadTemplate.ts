import { useMutation } from '@tanstack/react-query';
import { downloadTemplate } from '../services';

interface DownloadTemplateVariables {
	lang: 'es' | 'en';
	fallbackFileName: string;
}

export function useDownloadTemplate(typeCode: string) {
	return useMutation<void, Error, DownloadTemplateVariables>({
		mutationFn: ({ lang, fallbackFileName }) => downloadTemplate(typeCode, lang, fallbackFileName),
	});
}
