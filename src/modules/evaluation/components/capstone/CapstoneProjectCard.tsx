'use client';

import { useI18n } from '@/providers';
import type { CapstoneProject } from '../../types/capstone';

interface CapstoneProjectCardProps {
	project: CapstoneProject;
	selected?: boolean;
	onSelect: (project: CapstoneProject) => void;
}

const SVG_RADIUS = 22;

export default function CapstoneProjectCard({
	project,
	selected,
	onSelect,
}: CapstoneProjectCardProps) {
	const { t } = useI18n();
	const pct =
		project.total_students > 0
			? Math.round((project.graded_students / project.total_students) * 100)
			: 0;
	const circumference = 2 * Math.PI * SVG_RADIUS;
	const dashOffset = circumference - (pct / 100) * circumference;

	return (
		<button
			type="button"
			onClick={() => onSelect(project)}
			className={`w-full rounded-lg border bg-white p-4 text-left shadow-sm transition-colors ${
				selected ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200 hover:border-red-300'
			}`}>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold text-gray-900">{project.name}</p>
					<p className="mt-1 truncate text-xs text-gray-500">
						{project.course_code} · {project.section_code}
					</p>
				</div>
				<svg width="56" height="56" className="shrink-0">
					<circle cx="28" cy="28" r={SVG_RADIUS} stroke="#e5e7eb" strokeWidth="6" fill="none" />
					<circle
						cx="28"
						cy="28"
						r={SVG_RADIUS}
						stroke={pct === 100 ? '#16a34a' : '#dc2626'}
						strokeWidth="6"
						fill="none"
						strokeDasharray={circumference}
						strokeDashoffset={dashOffset}
						strokeLinecap="round"
						transform="rotate(-90 28 28)"
						style={{ transition: 'stroke-dashoffset 400ms ease-out' }}
					/>
					<text x="28" y="32" textAnchor="middle" className="text-xs font-semibold" fill="#374151">
						{pct}%
					</text>
				</svg>
			</div>
			<p className="mt-3 text-xs text-gray-600">
				{project.graded_students} {t('capstone.card.gradedOf')} {project.total_students}{' '}
				{t('capstone.card.students')}
			</p>
		</button>
	);
}
