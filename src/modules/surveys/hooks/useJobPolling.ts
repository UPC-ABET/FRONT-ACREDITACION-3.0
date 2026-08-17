'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/shared/lib';

/** How often a running job is re-polled. */
const POLL_INTERVAL_MS = 1_000;

/** Hard stop for a job that never reports "done" — e.g. the backend restarted and lost the
 *  in-process job map, so its status endpoint will never say the work finished. Without this
 *  the progress dialogs (non-dismissible while running) would poll forever and the user's only
 *  escape would be a page reload. */
const POLL_TIMEOUT_MS = 10 * 60 * 1_000;

/** i18n key surfaced as the error when {@link POLL_TIMEOUT_MS} elapses. */
export const JOB_POLL_TIMEOUT_ERROR = 'error.survey.jobPollTimeout';

export interface UseJobPollingParams<TStatus> {
	/** Query-key prefix identifying the job family, e.g. `['ppp-upload-status']`. Job ids are
	 *  globally unique, so the key needs no `useABET()` scope variables — a given id can only
	 *  ever describe one job, in one period, for one school. */
	scope: readonly unknown[];
	/** `null` while nothing is running. Setting it starts the poll; `reset` clears it. */
	jobId: string | null;
	fetchStatus: (jobId: string) => Promise<TStatus>;
	isDone: (status: TStatus) => boolean;
	/** Reported until the first poll resolves, so a progress dialog opens at 0% rather than empty.
	 *  Keep it referentially stable (module constant or `useMemo`). */
	pendingStatus?: TStatus | null;
	/** Fired exactly once per job, when it finishes or fails. */
	onSettled?: (outcome: { status: TStatus | null; error: string | null }) => void;
}

export interface JobPollingResult<TStatus> {
	status: TStatus | null;
	/** True from the moment `jobId` is set until the job finishes, fails, or times out. */
	running: boolean;
	error: string | null;
}

/**
 * Polls a background job's status endpoint until it reports done.
 *
 * Shared by PPP's bulk upload and GRA's/LCFC's notification sends, which previously each
 * carried their own `useEffect` + `setInterval` copy. Building on `useQuery` is what
 * `docs/POLICIES.md` → Data Fetching asks for, and it also removes two failure modes those
 * copies had: TanStack de-duplicates in-flight fetches, so a status call slower than the
 * interval can no longer overlap itself and apply a stale response over a newer one, and
 * polling is cancelled automatically on unmount.
 */
export function useJobPolling<TStatus>({
	scope,
	jobId,
	fetchStatus,
	isDone,
	pendingStatus = null,
	onSettled,
}: UseJobPollingParams<TStatus>): JobPollingResult<TStatus> {
	const onSettledRef = useRef(onSettled);
	const settledForRef = useRef<string | null>(null);

	// Kept in a ref so callers can pass an inline closure without restarting the poll. This
	// effect is declared first so the ref is current by the time the settle effect below runs.
	useEffect(() => {
		onSettledRef.current = onSettled;
	});

	const [timedOutJobId, setTimedOutJobId] = useState<string | null>(null);
	const timedOut = jobId !== null && timedOutJobId === jobId;

	const query = useQuery({
		queryKey: [...scope, jobId],
		queryFn: () => fetchStatus(jobId as string),
		enabled: Boolean(jobId) && !timedOut,
		retry: false,
		refetchOnWindowFocus: false,
		refetchInterval: (q) => {
			const data = q.state.data;
			if (data !== undefined && isDone(data)) return false;
			return POLL_INTERVAL_MS;
		},
	});

	const polled = query.data ?? null;
	const done = polled !== null && isDone(polled);

	// A wall-clock deadline rather than a poll counter: what matters is how long the user has
	// been staring at the dialog, not how many requests happened to resolve in that time.
	useEffect(() => {
		if (!jobId || done) return;
		const timerId = setTimeout(() => setTimedOutJobId(jobId), POLL_TIMEOUT_MS);
		return () => clearTimeout(timerId);
	}, [jobId, done]);

	let error: string | null = null;
	if (query.error) error = getErrorMessage(query.error);
	else if (timedOut && !done) error = JOB_POLL_TIMEOUT_ERROR;

	const status = polled ?? (jobId ? pendingStatus : null);
	const running = Boolean(jobId) && !done && error === null;

	useEffect(() => {
		if (!jobId || (!done && error === null)) return;
		if (settledForRef.current === jobId) return;
		settledForRef.current = jobId;
		onSettledRef.current?.({ status: polled, error });
	}, [jobId, done, error, polled]);

	return { status, running, error };
}
