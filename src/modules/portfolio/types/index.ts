/**
 * Portfolio file manager — S3-backed types.
 *
 * S3 has no real folders: a "folder" is a key ending with `/`. Files are keys
 * that do not end with `/`.
 */

export type S3Entry = {
	/** Full S3 key. Folders end with a trailing slash. */
	key: string;
	/** Display name (last path segment). */
	name: string;
	isFolder: boolean;
	/** Size in bytes. 0 for folders. */
	size: number;
	/** ISO timestamp. Null for folders (S3 does not track folder dates). */
	lastModified: string | null;
};

export type S3ListResponse = {
	/** The prefix that was listed (current folder). */
	prefix: string;
	folders: S3Entry[];
	files: S3Entry[];
};

export type BreadcrumbSegment = {
	name: string;
	/** S3 prefix this breadcrumb points to (ends with `/`, or `''` for root). */
	prefix: string;
};
