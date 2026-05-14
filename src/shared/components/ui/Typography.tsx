'use client'
import React from 'react'

interface TitleProps {
    title: string
    icon?: React.ReactNode
    className?: string
}

interface SubTitleProps {
    name: string
    icon?: React.ReactNode
    className?: string
}

export const Title = ({ title, icon = null, className = "" }: TitleProps) => {
    return (
        <div className={`flex items-center ${className}`}>
            {icon}
            <h2 className="text-2xl font-semibold text-gray-900 py-3">
                {title}
            </h2>
        </div>
    )
}

export const SubTitle = ({ name, icon = null, className = "" }: SubTitleProps) => {
    return (
        <div className={`flex items-center ${className}`}>
            {icon}
            <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
        </div>
    )
}
