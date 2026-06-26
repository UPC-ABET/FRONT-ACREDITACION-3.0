'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
	Plus,
	Save,
	Trash2,
} from 'lucide-react';
import {
	Alert,
	Button,
	Card,
	Checkbox,
	DataTable,
	Input,
	PageHeader,
	Select,
	TextArea,
} from '@/shared/components/ui';
import { useABET, useI18n } from '@/providers';
import { useCampuses, useProgramsByModality } from '@/modules/academic';
import {
	useArdDelegateCandidates,
	useArdGuestCandidates,
	useArdMeeting,
	useArdMutations,
	useArdOrgChartCourses,
	useArdCourseProfessors,
} from '../hooks';
import type {
	ArdComment,
	ArdMeetingDetail,
	ArdParticipant,
	ArdSaveMeetingDto,
	ArdStudentOption,
} from '../types';

type RegistrationStep = 'home' | 'header' | 'attendance' | 'comments';
type ArdDraft = {
	meetingDate: string;
	campusId: number | null;
	programId: number | null;
	participants: ArdParticipant[];
	comments: ArdComment[];
};

function todayIsoDate() {
	return new Date().toISOString().slice(0, 10);
}

function createEmptyDraft(): ArdDraft {
	return {
		meetingDate: todayIsoDate(),
		campusId: null,
		programId: null,
		participants: [],
		comments: [],
	};
}

function normalizeParticipant(row: ArdParticipant): ArdParticipant {
	return {
		...row,
		id: row.id || `${row.kind}:${row.studentCode}:${row.sectionId ?? 'none'}`,
		present: Boolean(row.present),
	};
}

function buildSaveMeetingDto(draft: ArdDraft): ArdSaveMeetingDto | null {
	if (draft.campusId === null || draft.programId === null || draft.meetingDate === '') return null;

	const details = draft.comments.map((comment) => ({
		enrollmentStudentId: comment.enrollmentStudentId,
		courseId: comment.courseId,
		professorId: comment.professorId,
		comment: comment.comment,
	}));

	return {
		meetingDate: draft.meetingDate,
		campusId: draft.campusId,
		programId: draft.programId,
		details,
	};
}

export function ArdRegistrationPage() {
	const { t } = useI18n();
	const { academicPeriodId, schoolId } = useABET();
	const [step, setStep] = useState<RegistrationStep>('home');
	const [meetingId, setMeetingId] = useState<number | null>(null);
	const [draft, setDraft] = useState<ArdDraft>(() => createEmptyDraft());
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const { create, update } = useArdMutations();

	const detailQuery = useArdMeeting(meetingId);
	const detail = detailQuery.data ?? null;

	const startCreate = () => {
		setMeetingId(null);
		setDraft(createEmptyDraft());
		setSuccessMessage(null);
		setStep('header');
	};

	const saveMeeting = async (comments: ArdComment[]) => {
		const nextDraft = { ...draft, comments };
		const body = buildSaveMeetingDto(nextDraft);

		if (body === null || academicPeriodId === null || schoolId === null) return;

		const saved =
			meetingId === null
				? await create.mutateAsync(body)
				: await update.mutateAsync({ id: meetingId, body });

		if (saved?.id != null) {
			setSuccessMessage(t('ard.messages.meetingSaved'));
			setStep('home');
			setMeetingId(null);
			setDraft(createEmptyDraft());
		}
	};

	return (
		<div className="space-y-6">
			{successMessage && (
				<Alert variant="success" className="flex items-center justify-between">
					<span>{successMessage}</span>
					<button
						type="button"
						className="text-lg font-bold"
						aria-label={t('ard.actions.closeMessage')}
						onClick={() => setSuccessMessage(null)}>
						×
					</button>
				</Alert>
			)}
			{academicPeriodId === null && step !== 'home' && (
				<Alert variant="warning">{t('ard.messages.selectAcademicPeriod')}</Alert>
			)}

			{step === 'home' ? (
				<>
					<PageHeader
						title={t('ard.registration.title')}
						description={t('ard.registration.description')}
						action={
							<Button onClick={startCreate}>
								<Plus className="h-4 w-4" />
								{t('ard.actions.new')}
							</Button>
						}
					/>
					<Card>
						<div className="flex flex-col items-center justify-center gap-4 py-12">
							<p className="text-zinc-500">{t('ard.menu.registrationDescription')}</p>
							<Button onClick={startCreate}>{t('ard.actions.go')}</Button>
						</div>
					</Card>
				</>
			) : (
				<>
					<PageHeader
						title={t(
							step === 'header'
								? 'ard.registration.title'
								: step === 'attendance'
									? 'ard.attendance.title'
									: 'ard.comments.title',
						)}
						description={t('ard.registration.description')}
					/>
					{step === 'header' && (
						<ArdHeaderStep
							draft={draft}
							detail={detail}
							onBack={() => setStep('home')}
							onSaved={(headerDraft) => {
								setDraft((current) => ({ ...current, ...headerDraft }));
								setSuccessMessage(t('ard.messages.headerCaptured'));
								setStep('attendance');
							}}
						/>
					)}
					{step === 'attendance' && draft.campusId !== null && (
						<ArdAttendanceStep
							draft={draft}
							detail={detail}
							onBack={() => setStep('header')}
							onSaved={(participants) => {
								setDraft((current) => ({ ...current, participants }));
								setSuccessMessage(t('ard.messages.attendanceCaptured'));
								setStep('comments');
							}}
						/>
					)}
					{step === 'comments' && draft.campusId !== null && (
						<ArdCommentsStep
							draft={draft}
							detail={detail}
							onBack={() => setStep('attendance')}
							onSaved={(comments) => void saveMeeting(comments)}
							isSaving={create.isPending || update.isPending}
							canSave={academicPeriodId !== null && schoolId !== null}
						/>
					)}
				</>
			)}
		</div>
	);
}

function ArdHeaderStep({
	draft,
	detail,
	onBack,
	onSaved,
}: {
	draft: ArdDraft;
	detail: ArdMeetingDetail | null;
	onBack: () => void;
	onSaved: (headerDraft: Pick<ArdDraft, 'meetingDate' | 'campusId' | 'programId'>) => void;
}) {
	const { t, locale } = useI18n();
	const { modalityTypeId } = useABET();
	const [meetingDate, setMeetingDate] = useState(draft.meetingDate);
	const [campusId, setCampusId] = useState<number | null>(draft.campusId);
	const [programId, setProgramId] = useState<number | null>(draft.programId);
	const { data: campuses = [] } = useCampuses();
	const { data: programs = [] } = useProgramsByModality(modalityTypeId);

	useEffect(() => {
		if (!detail) return;
		setMeetingDate(detail.meetingDate.slice(0, 10)); // eslint-disable-line react-hooks/set-state-in-effect -- edit mode hydrates the form from the loaded ARD detail
		setCampusId(detail.campusId);  
	}, [detail]);

	const campusOptions = campuses.map((campus) => ({
		label: campus.name[locale],
		value: campus.id,
	}));

	const programOptions = programs.map((program) => ({
		label: program.name[locale],
		value: program.id,
	}));

	const selectedCampus = campusOptions.find((option) => option.value === campusId) ?? null;
	const selectedProgram = programOptions.find((option) => option.value === programId) ?? null;
	const canSave = meetingDate !== '' && campusId !== null && programId !== null;

	const handleSave = () => {
		if (!canSave) return;
		onSaved({ meetingDate, campusId, programId });
	};

	return (
		<Card title={t('ard.header.sectionTitle')}>
			<div className="grid gap-6 md:grid-cols-3">
				<Input
					type="date"
					label={t('ard.header.meetingDate')}
					value={meetingDate}
					onChange={(event) => setMeetingDate(event.target.value)}
				/>
				<Select
					label={t('ard.header.campus')}
					value={selectedCampus}
					options={campusOptions}
					onChange={(_, option) => {
						const selected = Array.isArray(option) ? option[0] : option;
						setCampusId(selected ? Number(selected.value) : null);
					}}
				/>
				<Select
					label={t('ard.header.program')}
					value={selectedProgram}
					options={programOptions}
					onChange={(_, option) => {
						const selected = Array.isArray(option) ? option[0] : option;
						setProgramId(selected ? Number(selected.value) : null);
					}}
				/>
			</div>
			<div className="mt-8 flex justify-between">
				<Button variant="surface" onClick={onBack}>
					{t('ard.actions.cancel')}
				</Button>
				<Button onClick={handleSave} disabled={!canSave}>
					<Save className="h-4 w-4" />
					{t('ard.actions.saveContinue')}
				</Button>
			</div>
		</Card>
	);
}

function ArdAttendanceStep({
	draft,
	detail,
	onBack,
	onSaved,
}: {
	draft: ArdDraft;
	detail: ArdMeetingDetail | null;
	onBack: () => void;
	onSaved: (participants: ArdParticipant[]) => void;
}) {
	const { t } = useI18n();
	const campusId = draft.campusId;
	const programId = draft.programId;
	const [participants, setParticipants] = useState<ArdParticipant[]>([]);
	const [guestSearch, setGuestSearch] = useState('');
	const delegatesQuery = useArdDelegateCandidates(campusId, programId);
	const guestsQuery = useArdGuestCandidates(campusId, programId, guestSearch);

	useEffect(() => {
		if (draft.participants.length) {
			setParticipants(draft.participants); // eslint-disable-line react-hooks/set-state-in-effect -- returning to this step restores the editable draft rows
			return;
		}
		if (detail?.participants?.length) {
			setParticipants(detail.participants.map(normalizeParticipant));  
			return;
		}
		if (delegatesQuery.data?.length) {
			setParticipants(delegatesQuery.data.map(normalizeParticipant));  
		}
	}, [delegatesQuery.data, detail, draft.participants]);

	const delegateRows = participants.filter((participant) => participant.kind === 'delegate');
	const guestRows = participants.filter((participant) => participant.kind === 'guest');

	const togglePresence = (id: string, present: boolean) => {
		setParticipants((current) =>
			current.map((participant) =>
				participant.id === id ? { ...participant, present } : participant,
			),
		);
	};

	const addGuest = (student: ArdStudentOption) => {
		if (campusId === null || participants.some((row) => row.studentCode === student.studentCode)) {
			return;
		}

		const guest: ArdParticipant = normalizeParticipant({
			id: `guest:${student.enrolledStudentId}`,
			kind: 'guest',
			enrolledStudentId: student.enrolledStudentId,
			studentCode: student.studentCode,
			fullName: student.fullName,
			present: true,
		});

		setParticipants((current) => [...current, guest]);
		setGuestSearch('');
	};

	const removeGuest = (id: string) => {
		setParticipants((current) => current.filter((participant) => participant.id !== id));
	};

	const columns = useMemo<ColumnDef<ArdParticipant>[]>(
		() => [
			{ accessorKey: 'studentCode', header: t('ard.table.code') },
			{ accessorKey: 'fullName', header: t('ard.table.fullName') },
			{
				accessorKey: 'present',
				header: t('ard.attendance.present'),
				cell: ({ row }) => (
					<Checkbox
						checked={row.original.present}
						aria-label={`${t('ard.attendance.present')} ${row.original.fullName}`}
						onCheckedChange={(checked) => togglePresence(row.original.id, checked === true)}
					/>
				),
			},
		],
		[t],
	);

	const guestColumns = useMemo<ColumnDef<ArdParticipant>[]>(
		() => [
			...columns,
			{
				id: 'actions',
				header: t('ard.table.actions'),
				cell: ({ row }) => (
					<Button
						variant="surface"
						size="icon"
						title={t('ard.actions.remove')}
						aria-label={t('ard.actions.remove')}
						onClick={() => removeGuest(row.original.id)}>
						<Trash2 className="h-4 w-4" />
					</Button>
				),
			},
		],
		[columns, t],
	);

	const handleSave = () => {
		onSaved(participants);
	};

	return (
		<div className="space-y-6">
			<Card title={t('ard.attendance.delegates')}>
				{delegatesQuery.isLoading && (
					<div className="py-4 text-center text-zinc-500">{t('ard.table.loading')}</div>
				)}
				{delegatesQuery.isError && (
					<div className="py-4 text-center text-red-500">{t('ard.table.error')}</div>
				)}
				{delegatesQuery.data && delegatesQuery.data.length === 0 && (
					<div className="py-4 text-center text-zinc-500">{t('ard.table.empty')}</div>
				)}
				<DataTable
					columns={columns}
					data={delegateRows}
					showSearch
					emptyMessage={t('ard.table.empty')}
					isLoading={delegatesQuery.isLoading}
					aria-label={t('ard.attendance.delegates')}
				/>
			</Card>

			<Card title={t('ard.attendance.guests')}>
				<div className="mb-4">
					<Select
						label={t('ard.attendance.guestStudent')}
						options={(guestsQuery.data ?? []).map((student) => ({
							label: `${student.studentCode} - ${student.fullName}`,
							value: student.studentCode,
						}))}
						value={null}
						isSearchable
						onInputChange={setGuestSearch}
						onChange={(_, option) => {
							const selected = Array.isArray(option) ? option[0] : option;
							const student = (guestsQuery.data ?? []).find(
								(row) => row.studentCode === selected?.value,
							);
							if (student) void addGuest(student);
						}}
					/>
				</div>
				<DataTable
					columns={guestColumns}
					data={guestRows}
					showSearch
					emptyMessage={t('ard.table.empty')}
					aria-label={t('ard.attendance.guests')}
				/>
			</Card>

			<Card>
				<div className="flex justify-between">
					<Button variant="surface" onClick={onBack}>
						{t('ard.actions.backToHeader')}
					</Button>
					<Button onClick={handleSave}>{t('ard.actions.saveContinue')}</Button>
				</div>
			</Card>
		</div>
	);
}

function ArdCommentsStep({
	draft,
	detail,
	onBack,
	onSaved,
	isSaving,
	canSave,
}: {
	draft: ArdDraft;
	detail: ArdMeetingDetail | null;
	onBack: () => void;
	onSaved: (comments: ArdComment[]) => void;
	isSaving: boolean;
	canSave: boolean;
}) {
	const { t } = useI18n();
	const programId = draft.programId;
	const campusId = draft.campusId;
	const participants = useMemo(
		() => draft.participants.filter((participant) => participant.present),
		[draft.participants],
	);
	const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
	const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
	const [selectedProfessorId, setSelectedProfessorId] = useState<number | null>(null);
	const [comment, setComment] = useState('');
	const [comments, setComments] = useState<ArdComment[]>([]);

	const coursesQuery = useArdOrgChartCourses(programId, campusId);
	const selectedParticipant =
		participants.find((participant) => participant.id === selectedParticipantId) ?? null;
	const professorsQuery = useArdCourseProfessors(selectedCourseId, programId, campusId);

	useEffect(() => {
		if (draft.comments.length) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- returning to this step restores the editable draft comments
			setComments(draft.comments);
			return;
		}
		if (detail?.comments) {
			 
			setComments(detail.comments);
		}
	}, [detail, draft.comments]);

	useEffect(() => {
		if (!selectedParticipant) {
			setSelectedCourseId(null); // eslint-disable-line react-hooks/set-state-in-effect -- reset form when no participant selected
			setSelectedProfessorId(null);  
			setComment('');  
			return;
		}

		if (selectedParticipant.kind === 'delegate' && selectedParticipant.courseId) {
			setSelectedCourseId(selectedParticipant.courseId);  
			setSelectedProfessorId(selectedParticipant.professorId ?? null);  
		} else {
			setSelectedCourseId(null);  
			setSelectedProfessorId(null);  
		}

		const existing = comments.find((row) => row.participantId === selectedParticipant.id);
		setComment(existing?.comment ?? '');  
	}, [comments, selectedParticipant]);

	const courseOptions = (coursesQuery.data ?? []).map((course) => ({
		label: `${course.code} - ${course.name}`,
		value: course.id,
	}));

	const professorOptions = (professorsQuery.data ?? []).map((professor) => ({
		label: `${professor.code} - ${professor.fullName}`,
		value: professor.id,
	}));

	const selectedCourse = coursesQuery.data?.find((course) => course.id === selectedCourseId);
	const selectedProfessor = professorsQuery.data?.find(
		(professor) => professor.id === selectedProfessorId,
	);

	const participantOptions = participants.map((participant) => {
		const sectionInfo =
			participant.kind === 'delegate' && participant.sectionCode
				? ` (${participant.sectionCode})`
				: '';
		return {
			label: `${participant.studentCode} - ${participant.fullName}${sectionInfo}`,
			value: participant.id,
		};
	});

	const commentColumns = useMemo<ColumnDef<ArdComment>[]>(
		() => [
			{ accessorKey: 'studentCode', header: t('ard.table.code') },
			{ accessorKey: 'fullName', header: t('ard.table.fullName') },
			{ accessorKey: 'courseName', header: t('ard.comments.course') },
			{ accessorKey: 'professorName', header: t('ard.comments.professor') },
			{ accessorKey: 'comment', header: t('ard.comments.comment') },
		],
		[t],
	);

	const upsertComment = () => {
		if (!selectedParticipant || !selectedCourse || !selectedProfessor || comment.trim() === '')
			return;

		const nextComment: ArdComment = {
			id: `comment:${selectedParticipant.id}`,
			participantId: selectedParticipant.id,
			enrollmentStudentId:
				selectedParticipant.studentSectionEnrollmentId ??
				selectedParticipant.enrolledStudentId ??
				0,
			studentCode: selectedParticipant.studentCode,
			fullName: selectedParticipant.fullName,
			courseId: selectedCourse.id,
			courseName: selectedCourse.name,
			professorId: selectedProfessor.id,
			professorName: selectedProfessor.fullName,
			comment: comment.trim(),
		};

		setComments((current) => [
			...current.filter((row) => row.participantId !== nextComment.participantId),
			nextComment,
		]);
	};

	const handleSave = () => {
		onSaved(comments);
	};

	return (
		<div className="space-y-6">
			<Card title={t('ard.comments.sectionTitle')}>
				<div className="grid gap-6 lg:grid-cols-2">
					<Select
						label={t('ard.comments.participant')}
						value={
							participantOptions.find((option) => option.value === selectedParticipantId) ?? null
						}
						options={participantOptions}
						onChange={(_, option) => {
							const selected = Array.isArray(option) ? option[0] : option;
							setSelectedParticipantId(selected ? String(selected.value) : null);
						}}
					/>
					<Select
						label={t('ard.comments.course')}
						value={courseOptions.find((option) => option.value === selectedCourseId) ?? null}
						options={courseOptions}
						isSearchable
						isDisabled={!selectedParticipant}
						onChange={(_, option) => {
							const selected = Array.isArray(option) ? option[0] : option;
							setSelectedCourseId(selected ? Number(selected.value) : null);
							setSelectedProfessorId(null);
						}}
					/>
					<Select
						label={t('ard.comments.professor')}
						value={
							professorOptions.find((option) => option.value === selectedProfessorId) ?? null
						}
						options={professorOptions}
						isSearchable
						isDisabled={!selectedCourseId}
						onChange={(_, option) => {
							const selected = Array.isArray(option) ? option[0] : option;
							setSelectedProfessorId(selected ? Number(selected.value) : null);
						}}
					/>
					<div className="lg:col-span-2">
						<TextArea
							label={t('ard.comments.comment')}
							value={comment}
							onChange={(event) => setComment(event.target.value)}
						/>
					</div>
				</div>
				<div className="mt-5 flex justify-end">
					<Button
						onClick={upsertComment}
						disabled={
							!selectedParticipant || !selectedCourse || !selectedProfessor || comment.trim() === ''
						}>
						{t('ard.actions.addComment')}
					</Button>
				</div>
			</Card>

			<DataTable
				columns={commentColumns}
				data={comments}
				showSearch
				emptyMessage={t('ard.comments.empty')}
				aria-label={t('ard.comments.sectionTitle')}
			/>

			<Card>
				<div className="flex justify-between">
					<Button variant="surface" onClick={onBack}>
						{t('ard.actions.backToAttendance')}
					</Button>
					<Button onClick={handleSave} loading={isSaving} disabled={!canSave}>
						{t('ard.actions.finish')}
					</Button>
				</div>
			</Card>
		</div>
	);
}
