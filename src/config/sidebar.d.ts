import type { LucideIcon } from 'lucide-vue-next'

export interface SidebarUser {
    name: string
    email: string
    avatar: string
}

export interface SidebarTeam {
    name: string
    logo: LucideIcon
    plan: string
}

export interface SidebarNavItem {
    title: string
    url: string
    icon?: LucideIcon
    defaultOpen?: boolean
    items?: {
        title: string
        url: string
    }[]
}

export interface SidebarProject {
    name: string
    url: string
    icon: LucideIcon
}

export interface SidebarConfig {
    user: SidebarUser
    teams: SidebarTeam[]
    navMain: SidebarNavItem[]
    projects: SidebarProject[]
}

export const sidebarConfig: SidebarConfig
