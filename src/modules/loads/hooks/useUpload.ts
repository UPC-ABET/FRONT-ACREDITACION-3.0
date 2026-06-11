import { useMutation } from '@tanstack/react-query';
import { rollbackUpload, uploadFile } from '../services';
import type { RollbackPayload, UploadPayload, UploadResult } from '../types';

export function useUpload(typeCode: string) {
	return useMutation<UploadResult, Error, UploadPayload>({
		mutationFn: (payload) => uploadFile(typeCode, payload),
	});
}

export function useRollback(typeCode: string) {
	return useMutation<{ success: boolean }, Error, RollbackPayload>({
		mutationFn: (payload) => rollbackUpload(typeCode, payload),
	});
}
