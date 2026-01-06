import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Eye,
    Users
} from 'lucide-vue-next'

// 核心指标配置定义
export const METRIC_TYPES = {
    GMV: 'gmv',
    GROSS_MARGIN: 'grossMargin',
    NET_MARGIN: 'netMargin',
    RETURN_RATE: 'returnRate',
    AOV: 'aov',
    CONVERSION: 'conversionRate'
}

/**
 * 店铺列表视图配置
 * layout: 布局配置
 * metrics: 指标列表
 */
export const storeListConfig = {
    layout: {
        columns: 4, // 一行显示多少个卡片
        height: 'auto' // 卡片高度，例如 '120px' 或 'auto'
    },
    metrics: [
        {
            id: METRIC_TYPES.GMV,
            label: '总 GMV',
            icon: DollarSign,
            field: 'gmv',
            format: 'currency',
            color: 'default',
            formula: '∑(各渠道销售额)'
        },
        {
            id: METRIC_TYPES.GROSS_MARGIN,
            label: '平均毛利率',
            icon: TrendingUp,
            field: 'grossMargin',
            format: 'percent',
            color: 'text-emerald-600',
            formula: '(收入-成本)/收入'
        },
        {
            id: METRIC_TYPES.NET_MARGIN,
            label: '平均净利率',
            icon: TrendingUp,
            field: 'netMargin',
            format: 'percent',
            color: 'text-indigo-600',
            formula: '(毛利-费用)/收入'
        },
        {
            id: METRIC_TYPES.RETURN_RATE,
            label: '平均退货率',
            icon: TrendingDown,
            field: 'returnRate',
            format: 'percent',
            color: 'text-amber-600',
            formula: '退货单数 / 发货单数'
        }
    ]
}

/**
 * 店铺详情视图配置
 */
export const storeDetailConfig = {
    layout: {
        columns: 6, // 一行显示多少个卡片
        height: 'auto' // 卡片高度
    },
    metrics: [
        {
            id: 'gmv',
            label: '累计 GMV',
            icon: DollarSign,
            field: 'gmv',
            prefix: '¥ ',
            suffix: '',
            color: 'default'
        },
        {
            id: 'netProfit',
            label: '净利润',
            icon: TrendingUp,
            field: 'netProfit',
            prefix: '¥ ',
            suffix: '',
            color: 'text-indigo-600'
        },
        {
            id: 'netMargin',
            label: '净利率',
            icon: TrendingUp,
            field: 'netMargin',
            prefix: '',
            suffix: '%',
            color: 'text-indigo-600'
        },
        {
            id: 'grossMargin',
            label: '毛利率',
            icon: TrendingUp,
            field: 'grossMargin',
            prefix: '',
            suffix: '%',
            color: 'text-emerald-600'
        },
        {
            id: 'aov',
            label: '客单价',
            icon: Eye,
            field: 'aov',
            prefix: '¥ ',
            suffix: '',
            color: 'default'
        },
        {
            id: 'conversionRate',
            label: '转化率',
            icon: Users,
            field: 'conversionRate',
            prefix: '',
            suffix: '%',
            color: 'default'
        }
    ]
}
