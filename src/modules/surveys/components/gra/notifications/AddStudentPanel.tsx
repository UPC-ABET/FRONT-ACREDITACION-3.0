'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Input, Button, Toast } from '@/shared/components';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { useGRAStudentSearch } from '../../../hooks';

const SEARCH_DEBOUNCE_MS = 250;

interface AddStudentPanelProps {
	readonly programId: number;
	readonly academicPeriodId: number;
	readonly onStudentAdded?: () => void;
}

export function AddStudentPanel({
	programId,
	academicPeriodId,
	onStudentAdded,
}: AddStudentPanelProps) {
	const { t } = useI18n();
	const { result, suggestions, loading, error, searchPrefix, selectSuggestion, add, reset } =
		useGRAStudentSearch();
	const [studentCode, setStudentCode] = useState('');
	const [adding, setAdding] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const listboxId = useId();

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	function handleChange(value: string) {
		setStudentCode(value);
		reset();
		setActiveIndex(-1);
		if (!value.trim()) {
			setShowDropdown(false);
			return;
		}
		setShowDropdown(true);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			searchPrefix(value.trim());
		}, SEARCH_DEBOUNCE_MS);
	}

	function handleSelect(student: (typeof suggestions)[number]) {
		setStudentCode(student.code);
		selectSuggestion(student);
		setShowDropdown(false);
		setActiveIndex(-1);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (!showDropdown || suggestions.length === 0) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setActiveIndex((current) => (current + 1) % suggestions.length);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
		} else if (event.key === 'Enter' && activeIndex >= 0) {
			event.preventDefault();
			handleSelect(suggestions[activeIndex]);
		} else if (event.key === 'Escape') {
			setShowDropdown(false);
			setActiveIndex(-1);
		}
	}

	async function handleAdd() {
		if (!result) return;
		setAdding(true);
		await add(
			{
				studentId: result.studentId,
				programId: programId,
				academicPeriodId: academicPeriodId,
			},
			() => {
				setToast({
					open: true,
					type: 'success',
					msg: t('surveys.gra.notifications.toast.studentAdded').replace('{{name}}', result.name),
				});
				setStudentCode('');
				reset();
				onStudentAdded?.();
			},
		);
		setAdding(false);
	}

	const dropdownOpen = showDropdown && suggestions.length > 0;
	const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

	return (
		<div className="space-y-4">
			<h4 className="text-sm font-bold text-zinc-700">
				{t('surveys.gra.notifications.addStudentTitle')}
			</h4>

			<div className="relative" ref={wrapperRef}>
				<Input
					placeholder={t('surveys.gra.notifications.studentCodePlaceholder')}
					value={studentCode}
					onChange={(event) => handleChange(event.target.value)}
					onFocus={() => {
						if (suggestions.length > 0) setShowDropdown(true);
					}}
					onKeyDown={handleKeyDown}
					role="combobox"
					aria-expanded={dropdownOpen}
					aria-controls={listboxId}
					aria-autocomplete="list"
					aria-activedescendant={activeOptionId}
				/>
				{dropdownOpen && (
					<ul
						id={listboxId}
						role="listbox"
						className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-56 overflow-y-auto">
						{suggestions.map((student, index) => (
							<li
								key={student.studentId}
								id={`${listboxId}-option-${index}`}
								role="option"
								aria-selected={index === activeIndex}>
								<button
									type="button"
									className={`w-full text-left px-3 py-2 text-sm flex justify-between gap-2 ${
										index === activeIndex ? 'bg-zinc-100' : 'hover:bg-zinc-50'
									}`}
									onMouseDown={() => handleSelect(student)}>
									<span className="font-mono text-zinc-700">{student.code}</span>
									<span className="text-zinc-500 truncate">{student.name}</span>
								</button>
							</li>
						))}
					</ul>
				)}
				{showDropdown && !loading && suggestions.length === 0 && studentCode.trim().length > 0 && (
					<div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg px-3 py-2 text-sm text-zinc-400">
						{t('surveys.gra.notifications.studentNotFound')}
					</div>
				)}
			</div>

			{error && (
				<p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
					{tryTranslate(t, error)}
				</p>
			)}

			{result && (
				<div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<span className="text-xs text-zinc-500 block">
								{t('surveys.gra.notifications.studentName')}
							</span>
							<span className="font-medium text-zinc-800">{result.name}</span>
						</div>
						<div>
							<span className="text-xs text-zinc-500 block">
								{t('surveys.gra.notifications.studentCode')}
							</span>
							<span className="font-medium text-zinc-800">{result.code}</span>
						</div>
						<div>
							<span className="text-xs text-zinc-500 block">Email</span>
							<span className="font-medium text-zinc-800">{result.email}</span>
						</div>
						<div>
							<span className="text-xs text-zinc-500 block">
								{t('surveys.gra.notifications.studentCareer')}
							</span>
							<span className="font-medium text-zinc-800">{result.career}</span>
						</div>
					</div>

					<Button onClick={handleAdd} disabled={adding} size="sm">
						<UserPlusIcon className="h-4 w-4 mr-1" />
						{adding
							? t('surveys.gra.notifications.adding')
							: t('surveys.gra.notifications.addButton')}
					</Button>
				</div>
			)}

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
