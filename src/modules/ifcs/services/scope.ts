import { TYPE_CODES } from '@/shared/constants';
import type { IFCRow } from '../types';

// A null `ifc` becomes the UNREGISTERED type code (frontend-only label).
export function effectiveStatus(row: IFCRow): string {
	if (row.ifc === null) return TYPE_CODES.IFC_STATUS.UNREGISTERED;
	return row.ifc.statusCode ?? TYPE_CODES.IFC_STATUS.SAVED;
}
