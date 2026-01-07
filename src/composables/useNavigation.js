import { ref, computed } from 'vue'

// 导航状态
const currentMainNav = ref('工作台')
const currentSubNav = ref('待办清单')
const detailTitle = ref(null) // 存储详情页标题（第三级面包屑）
const historyFilter = ref(null) // 存储要传递给历史记录页面的筛选参数

/**
 * 导航状态管理 Composable
 * 用于管理当前选中的导航项和面包屑
 */
export function useNavigation() {
    // 设置当前导航
    const setNavigation = (mainNav, subNav) => {
        currentMainNav.value = mainNav
        currentSubNav.value = subNav
    }

    // 设置详情标题（用于第三级面包屑）
    const setDetailTitle = (title) => {
        detailTitle.value = title
    }

    // 设置历史记录筛选参数
    const setHistoryFilter = (filter) => {
        historyFilter.value = filter
    }

    // 清除历史记录筛选参数
    const clearHistoryFilter = () => {
        historyFilter.value = null
    }

    // 导航到历史记录页面并设置筛选
    const navigateToHistory = (shop) => {
        historyFilter.value = { shop }
        currentMainNav.value = '工作台'
        currentSubNav.value = '历史记录'
        detailTitle.value = null
    }

    // 计算面包屑数据
    const breadcrumbs = computed(() => ({
        main: currentMainNav.value,
        sub: currentSubNav.value,
        detail: detailTitle.value,
    }))

    // 计算当前页面组件名称
    const currentPage = computed(() => {
        // 将中文标题映射到组件名
        const pageMap = {
            // 工作台
            '待办清单': 'TodoList',
            '历史记录': 'History',
            // 经营仓
            '公司经营仓': 'ReportCompany',
            '阿米巴经营仓': 'ReportAmeba',
            '店铺经营仓': 'ReportStore',
            // 数据看板
            '自助报表': 'SelfServiceBi',
            '对比分析': 'DashboardCompare',
            // 权限中心
            '用户管理': 'RbacUser',
            '角色管理': 'RbacRole',
            '权限配置': 'RbacPermission',
            '权限申请': 'RbacApply',
            '操作日志': 'RbacLog',
            // 系统设置
            '配置管理': 'DimensionManagement',
            '通知设置': 'NotificationSettings',
            // 项目
            '数据字典': 'DataDictionary',
            '用户操作手册': 'UserManual',
        }

        return pageMap[currentSubNav.value] || 'TodoList'
    })

    return {
        currentMainNav,
        currentSubNav,
        detailTitle,
        historyFilter,
        breadcrumbs,
        currentPage,
        setNavigation,
        setDetailTitle,
        setHistoryFilter,
        clearHistoryFilter,
        navigateToHistory,
    }
}
