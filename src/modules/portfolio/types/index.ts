/**
 * Portfolio file manager — S3-backed types.
 *
 * S3 has no real folders: a "folder" is a key ending with `/`. Files are keys
 * that do not end with `/`.
 */

export type S3Entry = {
	key: string;
	name: string;
	isFolder: boolean;
	size: number;
	lastModified: string | null;
};

export type S3ListResponse = {
	prefix: string;
	folders: S3Entry[];
	files: S3Entry[];
};

export type BreadcrumbSegment = {
	name: string;
	prefix: string;
};
