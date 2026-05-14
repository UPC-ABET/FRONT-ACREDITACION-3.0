'use client'

import LayoutClient from '@/app/components/LayoutClient'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return <LayoutClient>{children}</LayoutClient>
}
