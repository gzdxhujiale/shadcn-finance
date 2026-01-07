import { Ref, ComputedRef } from 'vue'

export interface Team {
    name: string
    logo: any
    plan: string
    permissions: {
        navMain: string[] | 'all'
        navItems?: Record<string, string[]>
        projects: string[] | 'all'
    }
}

export function useTeam(): {
    activeTeam: Ref<Team>
    setActiveTeam: (team: Team) => void
    addTeam: (team: Team) => void
    removeTeam: (teamName: string) => void
    filteredNavMain: ComputedRef<any[]>
    filteredProjects: ComputedRef<any[]>
    allNavItems: ComputedRef<any[]>
    allProjects: ComputedRef<any[]>
    teams: Ref<Team[]>
    user: { name: string; email: string; avatar: string }
}
