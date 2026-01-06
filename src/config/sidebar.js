import {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
} from 'lucide-vue-next'

/**
 * 侧边栏配置
 * 你可以在这里修改侧边栏的内容，包括团队信息、用户信息、导航菜单和项目列表
 * 
 * 导航项配置说明:
 * - title: 导航项标题
 * - icon: 导航项图标（Lucide Vue Next 图标）
 * - defaultOpen: 初始化时是否展开该导航项（默认为 false）
 * - items: 子导航项列表
 */
export const sidebarConfig = {
    // 用户信息
    user: {
        name: 'HJL',
        email: '2063994160@qq.com',
        avatar: '/avatars/shadcn.jpg',
    },

    // 团队列表
    teams: [
        {
            name: '家乐',
            logo: GalleryVerticalEnd,
            plan: '超级管理员',
        },
        {
            name: 'Acme Corp.',
            logo: AudioWaveform,
            plan: 'Startup',
        },
        {
            name: 'Evil Corp.',
            logo: Command,
            plan: 'Free',
        },
    ],

    // 主导航菜单
    navMain: [
        {
            title: '工作台',
            url: '#',
            icon: SquareTerminal,
            defaultOpen: true, // 默认展开
            items: [
                {
                    title: '待办清单',
                    url: '#',
                },
                {
                    title: '历史记录',
                    url: '#',
                },
            ],
        },
        {
            title: '经营仓',
            url: '#',
            icon: Bot,
            defaultOpen: false, // 默认收起
            items: [
                {
                    title: '公司经营仓',
                    url: '#',
                },
                {
                    title: '阿米巴经营仓',
                    url: '#',
                },
                {
                    title: '店铺经营仓',
                    url: '#',
                },
            ],
        },
        {
            title: '数据看板',
            url: '#',
            icon: BookOpen,
            defaultOpen: false, // 默认收起
            items: [
                {
                    title: '自助报表',
                    url: '#',
                },
                {
                    title: '对比分析',
                    url: '#',
                },
            ],
        },
        {
            title: '权限中心',
            url: '#',
            icon: Settings2,
            defaultOpen: false, // 默认收起
            items: [
                {
                    title: '用户管理',
                    url: '#',
                },
                {
                    title: '角色管理',
                    url: '#',
                },
                {
                    title: '权限配置',
                    url: '#',
                },
                {
                    title: '权限申请',
                    url: '#',
                },
                {
                    title: '操作日志',
                    url: '#',
                },
            ],
        },
        {
            title: '系统设置',
            url: '#',
            icon: Settings2,
            defaultOpen: false, // 默认收起
            items: [
                {
                    title: '配置管理',
                    url: '#',
                },
                {
                    title: '通知设置',
                    url: '#',
                },
            ],
        },
    ],

    // 项目列表
    projects: [
        {
            name: '数据字典',
            url: '#',
            icon: Frame,
        },
        {
            name: '用户操作手册',
            url: '#',
            icon: PieChart,
        },
    ],
}
