'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarItem, SidebarNavGroup,
} from '@/shared/components'
import {
  HomeIcon, FolderIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/providers'
import { logoutUser } from '@/modules/auth/services'

type NavChild = {
  name: string
  href: string
}

type NavItem = {
  name: string
  href?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  children?: NavChild[]
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()

  const isActive = (href?: string) => (href ? pathname === href : false)

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {
      // Silencia errores de logout para no bloquear el cierre de sesión local.
    } finally {
      localStorage.removeItem('bearerToken')
      localStorage.removeItem('token')
      localStorage.removeItem('escuela')
      sessionStorage.clear()
      document.cookie.split(';').forEach(c => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
      })
      router.replace('/auth/login')
    }
  }



  const navigation: NavItem[] = [

    { name: t('nav.home'), href: '/', icon: HomeIcon },

    {
      name: t('nav.tests.label'),
      icon: Cog6ToothIcon,
      children: [
        { name: t('nav.tests.modals'), href: '/tests/modals' },
        { name: t('nav.tests.charts'), href: '/tests/charts' },
        { name: t('nav.tests.tables'), href: '/tests/tables' },
        { name: t('nav.tests.public'), href: '/tests/public' },

      ],
    },
]

  return (
      <Sidebar>
        <SidebarHeader />

        <SidebarContent>
          <SidebarGroup>
            {navigation.map((item) => {
              const childActive = item.children?.some((child) => isActive(child.href)) ?? false

              return (
                  <div key={item.name}>
                    {!item.children ? (
                        <Link href={item.href ?? '#'}>
                          <SidebarItem
                              label={item.name}
                              icon={<item.icon className="h-5 w-5" />}
                              active={isActive(item.href)}
                          />
                        </Link>
                    ) : (
                        <SidebarNavGroup
                            label={item.name}
                            icon={<item.icon className="h-5 w-5" />}
                            active={childActive}
                            defaultOpen={false}
                        >
                          {item.children.map((child) => (
                              <Link key={child.name} href={child.href}>
                                <SidebarItem
                                    label={child.name}
                                    icon={null}
                                    active={isActive(child.href)}
                                />
                              </Link>
                          ))}
                        </SidebarNavGroup>
                    )}
                  </div>
              )
            })}
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <button type="button" onClick={handleLogout} className="w-full text-left">
            <SidebarItem
                label={t('nav.logout')}
                icon={<ArrowRightStartOnRectangleIcon className="h-5 w-5" />}
            />
          </button>
        </SidebarFooter>
      </Sidebar>
  )
}

export default AppSidebar