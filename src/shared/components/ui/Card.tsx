'use client';
import React from 'react';

interface CardProps {
    title?: string,
    children: React.ReactNode,
    description?: string,
    className?: string,
    style?: { minHeight: string; aspectRatio: string } | { aspectRatio: string }
}

function Card({title, children, description, className = "", style}: CardProps) {
    return (
        <div
            className={`bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden ${className}`}
            style={style}
        >
            {(title || description) && (
                <div className="p-4 border-b border-zinc-100">
                    {title && <h3 className="text-sm font-bold text-zinc-800">{title}</h3>}
                    {description && <p className="text-xs text-zinc-500">{description}</p>}
                </div>
            )}
            <div className="p-4 text-zinc-600 text-sm">
                {children}
            </div>
        </div>
    );
}

export {Card};
