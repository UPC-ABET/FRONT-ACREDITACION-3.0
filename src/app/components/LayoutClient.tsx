'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { Navbar } from '@/shared/components'
import AppSidebar from '@/app/components/app-sidebar'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthGuard } from '@/shared/hooks'
import { ABETProvider, SidebarProvider } from '@/providers'

type LayoutClientProps = {
    children: ReactNode
}

export default function LayoutClient({ children }: LayoutClientProps) {
    const pathname = usePathname()
    const isAuthRoute = pathname?.startsWith('/auth') ?? false
    const router = useRouter()
    const [authRedirecting, setAuthRedirecting] = useState(false)

    const checking = useAuthGuard(!isAuthRoute)

    useEffect(() => {
        if (!isAuthRoute) {
            setAuthRedirecting(false)
            return
        }
        const token = localStorage.getItem('bearerToken')
        if (token) {
            setAuthRedirecting(true)
            router.replace('/')
        } else {
            setAuthRedirecting(false)
        }
    }, [isAuthRoute, router])

    if (isAuthRoute) {
        if (authRedirecting) {
            return <div>Cargando...</div>
        }
        return <>{children}</>
    }

    return (
        <ABETProvider>
            <SidebarProvider>
                <div className="flex h-screen w-full overflow-hidden">
                    <div data-layout-sidebar="true">
                        <AppSidebar />
                    </div>

                    <div className="flex flex-col flex-1 h-full overflow-hidden">
                        <div data-layout-navbar="true">
                            <Navbar />
                        </div>

                        <main className="flex-1 p-8 overflow-y-auto bg-white">
                            <div className="max-w-7xl mx-auto">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </ABETProvider>
    )
}