'use client';
import React from 'react';

type BadgeVariant = 'default' | 'danger' | 'success' | 'outline';

interface BadgeProps {
    children: React.ReactNode,
    variant?: BadgeVariant,
    className?: string
}

function Badge({children, variant = 'default', className}: BadgeProps) {
    const variants = {
        default: 'bg-zinc-100 text-zinc-700',
        danger: 'bg-red-100 text-red-700',
        success: 'bg-emerald-100 text-emerald-700',
        outline: 'border border-zinc-200 text-zinc-600'
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${variants[variant]} ${className ?? ''}`}>
      {children}
    </span>
    );
}

export {Badge};
