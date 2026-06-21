'use client';
import React from 'react';

interface TitleProps {
	title: string;
	icon?: React.ReactNode;
	className?: string;
	as?: 'h1' | 'h2';
}

interface SubTitleProps {
	name: string;
	icon?: React.ReactNode;
	className?: string;
}

export const Title = ({ title, icon = null, className = '', as: Heading = 'h2' }: TitleProps) => {
	return (
		<div className={`flex items-center ${className}`}>
			{icon}
			<Heading className="text-2xl font-semibold text-gray-900">{title}</Heading>
		</div>
	);
};

export const SubTitle = ({ name, icon = null, className = '' }: SubTitleProps) => {
	return (
		<div className={`flex items-center ${className}`}>
			{icon}
			<h3 className="text-xl font-semibold text-gray-500">{name}</h3>
		</div>
	);
};
