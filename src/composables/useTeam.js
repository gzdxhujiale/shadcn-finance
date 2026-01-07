import { ref, computed } from 'vue'
import { sidebarConfig } from '@/config/sidebar'

// 全局共享的团队列表（响应式）
const teams = ref([...sidebarConfig.teams])

// 全局共享的当前团队状态
const activeTeam = ref(teams.value[0])

/**
 * 团队切换 composable
 * 用于管理当前选中的团队，并根据团队权限过滤导航菜单
 */
export function useTeam() {
    // 切换团队
    const setActiveTeam = (team) => {
        activeTeam.value = team
    }

    // 添加新团队
    const addTeam = (team) => {
        teams.value.push(team)
        // 自动切换到新团队
        activeTeam.value = team
    }

    // 删除团队
    const removeTeam = (teamName) => {
        const index = teams.value.findIndex(t => t.name === teamName)
        if (index > -1) {
            teams.value.splice(index, 1)
            // 如果删除的是当前团队，切换到第一个
            if (activeTeam.value.name === teamName && teams.value.length > 0) {
                activeTeam.value = teams.value[0]
            }
        }
    }

    // 根据当前团队过滤主导航菜单
    const filteredNavMain = computed(() => {
        const permissions = activeTeam.value?.permissions

        // 如果没有配置权限或者是 'all'，显示所有菜单
        if (!permissions || permissions.navMain === 'all') {
            return sidebarConfig.navMain
        }

        // 根据权限配置过滤菜单
        return sidebarConfig.navMain
            .filter(nav => permissions.navMain.includes(nav.id))
            .map(nav => {
                // 如果有子项过滤配置
                if (permissions.navItems && permissions.navItems[nav.id]) {
                    return {
                        ...nav,
                        items: nav.items.filter(item =>
                            permissions.navItems[nav.id].includes(item.id)
                        )
                    }
                }
                return nav
            })
    })

    // 根据当前团队过滤项目列表（文档）
    const filteredProjects = computed(() => {
        const permissions = activeTeam.value?.permissions

        // 如果没有配置权限或者是 'all'，显示所有项目
        if (!permissions || permissions.projects === 'all') {
            return sidebarConfig.projects
        }

        // 根据权限配置过滤项目
        return sidebarConfig.projects.filter(project =>
            permissions.projects.includes(project.id)
        )
    })

    // 获取所有可配置的导航项（用于权限配置界面）
    const allNavItems = computed(() => sidebarConfig.navMain)
    const allProjects = computed(() => sidebarConfig.projects)

    return {
        activeTeam,
        setActiveTeam,
        addTeam,
        removeTeam,
        filteredNavMain,
        filteredProjects,
        allNavItems,
        allProjects,
        teams,
        user: sidebarConfig.user
    }
}
