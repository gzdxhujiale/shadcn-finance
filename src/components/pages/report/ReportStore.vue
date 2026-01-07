<script setup>
import { ref, computed, watch, reactive, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { Store, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Eye, ChevronRight, Download, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown, ListFilter, CircleHelp } from 'lucide-vue-next'
import DateRangeFilter from '@/components/shared/DateRangeFilter.vue'
// 导入新的指标配置（包含布局）
import { storeListConfig, storeDetailConfig } from '@/config/storeMetrics'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useNavigation } from '@/composables/useNavigation.js'
import { ECOMMERCE_DATA } from './ecommerce_data.js'

// --- 导航 ---
const { setDetailTitle, detailTitle } = useNavigation()

// --- 筛选状态 ---
const selectedYear = ref('2025')
const selectedMonth = ref('all')
const currentStore = ref(null)
const chartMode = ref('scale')

// 平台多选筛选
const platformFilters = ref(['淘宝', '抖音', '快手'])
const allPlatforms = ['淘宝', '抖音', '快手']

// 排序
const sortField = ref('gmv')
const sortDirection = ref('desc')

// 分页
const currentPage = ref(1)
const pageSize = 13

// 下钻状态 - 页面级时间维度
const viewState = reactive({ month: null, day: null })

// 日期范围选择器状态
const dateRange = ref({
  start: new CalendarDate(2025, 1, 1),
  end: new CalendarDate(2025, 12, 31)
})

// 日期筛选应用回调
const onDateRangeApply = (range) => {
  dateRange.value = range
  // 这里可以添加数据刷新逻辑
  console.log('日期范围已更新:', range)
}
const df = new DateFormatter('zh-CN', { dateStyle: 'short' })

// 当前时间维度描述
const currentTimeLevel = computed(() => {
  if (viewState.day) return 'day'
  if (viewState.month) return 'month'
  return 'year'
})

const currentTimePeriodLabel = computed(() => {
  if (viewState.day) return `${viewState.month} ${viewState.day}`
  if (viewState.month) return viewState.month
  return '年度'
})

// ECharts refs
const mainChartRef = ref(null)
const costChartRef = ref(null)
let mainChartInstance = null
let costChartInstance = null

// 弹窗状态
const dayDetailDialogOpen = ref(false)
const orderDetailDialogOpen = ref(false)
const selectedDay = ref(null)
const selectedOrder = ref(null)

// --- 监听面包屑返回 ---
watch(detailTitle, (newVal) => {
  if (newVal === null && currentStore.value) {
    currentStore.value = null
  }
})

// --- 伪随机数生成器 (与源文件一致) ---
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// --- 计算数据 ---
const dateFactor = computed(() => selectedMonth.value === 'all' ? 1 : 1 / 12)

// 店铺列表聚合
const storeList = computed(() => {
  const storeMap = {}
  
  ECOMMERCE_DATA.forEach(row => {
    const shopName = row['店铺名称']
    if (!storeMap[shopName]) {
      storeMap[shopName] = {
        shopName,
        customer: row['客户'],
        platform: row['平台'],
        gmv: 0,
        cost: 0,
        profit: 0,
        orders: 0,
        visitors: 0,
        adCost: 0,
        platformFee: 0,
        shipping: 0,
        otherCost: 0,
        refund: 0
      }
    }
    const s = storeMap[shopName]
    s.gmv += row['GMV']
    s.cost += row['商品成本']
    s.profit += row['GMV'] - row['商品成本']
    s.orders += row['订单数']
    s.visitors += row['访客数']
    s.adCost += row['广告费']
    s.platformFee += row['平台费用']
    s.shipping += row['运费']
    s.otherCost += row['其他费用']
    s.refund += row['退款金额']
  })
  
  return Object.values(storeMap).map(s => {
    const factor = dateFactor.value
    const gmv = Math.round(s.gmv * factor)
    const cost = Math.round(s.cost * factor)
    const totalCost = cost + Math.round(gmv * 0.05)
    const orders = Math.round(s.orders * factor)
    const visitors = Math.round(s.visitors * factor)
    
    return {
      shopName: s.shopName,
      customer: s.customer,
      platform: s.platform,
      gmv,
      cost,
      profit: gmv - cost,
      orders,
      visitors,
      adCost: Math.round(s.adCost * factor),
      platformFee: Math.round(s.platformFee * factor),
      shipping: Math.round(s.shipping * factor),
      otherCost: Math.round(s.otherCost * factor),
      refund: Math.round(s.refund * factor),
      grossMargin: gmv > 0 ? ((gmv - cost) / gmv * 100).toFixed(1) : '0.0',
      netMargin: gmv > 0 ? ((gmv - totalCost) / gmv * 100).toFixed(1) : '0.0',
      roi: (gmv / (gmv * 0.2)).toFixed(1),
      aov: orders > 0 ? Math.round(gmv / orders) : 0,
      conversionRate: visitors > 0 ? ((orders / visitors) * 100).toFixed(2) : '0.00'
    }
  })
})

// 筛选并排序后的列表
const filteredAndSortedList = computed(() => {
  let list = storeList.value
  
  // 平台筛选
  if (platformFilters.value.length < allPlatforms.length) {
    list = list.filter(s => platformFilters.value.includes(s.platform))
  }
  
  // 排序
  const field = sortField.value
  const dir = sortDirection.value === 'asc' ? 1 : -1
  
  return [...list].sort((a, b) => {
    let aVal = a[field]
    let bVal = b[field]
    if (typeof aVal === 'string' && !isNaN(parseFloat(aVal))) {
      aVal = parseFloat(aVal)
      bVal = parseFloat(bVal)
    }
    return (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) * dir
  })
})

// 分页后的数据
const paginatedStoreList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredAndSortedList.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(filteredAndSortedList.value.length / pageSize))

// 重置分页
watch([platformFilters, sortField, sortDirection], () => {
  currentPage.value = 1
}, { deep: true })

// 排序切换
const toggleSort = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'desc'
  }
}

// 平台筛选切换
const togglePlatformFilter = (platform) => {
  const current = [...platformFilters.value]
  const idx = current.indexOf(platform)
  if (idx > -1) {
    if (current.length > 1) {
      current.splice(idx, 1)
      platformFilters.value = current
    }
  } else {
    platformFilters.value = [...current, platform]
  }
}

// 全选/取消全选
const selectAllPlatforms = () => {
  if (platformFilters.value.length === allPlatforms.length) {
    platformFilters.value = [allPlatforms[0]] // 至少保留一个
  } else {
    platformFilters.value = [...allPlatforms]
  }
}

// 总体指标
const totalMetrics = computed(() => {
  const total = storeList.value.reduce((acc, s) => ({
    gmv: acc.gmv + s.gmv,
    cost: acc.cost + s.cost,
    profit: acc.profit + s.profit
  }), { gmv: 0, cost: 0, profit: 0 })
  
  return {
    gmv: total.gmv,
    grossMargin: total.gmv > 0 ? ((total.gmv - total.cost) / total.gmv * 100).toFixed(1) : '0.0',
    netMargin: total.gmv > 0 ? ((total.gmv - total.cost * 1.2) / total.gmv * 100).toFixed(1) : '0.0',
    returnRate: '6.7',
    storeCount: storeList.value.length
  }
})

// 店铺详情指标 - 根据时间维度使用真实数据
const storeDetailMetrics = computed(() => {
  if (!currentStore.value) return []
  const s = currentStore.value
  
  // 筛选当前店铺的原始数据
  const rawData = ECOMMERCE_DATA.filter(row => row['店铺名称'] === s.shopName)
  
  let filteredData = rawData
  
  // 根据时间维度筛选数据
  if (viewState.day && viewState.month) {
    // 日维度 - 筛选特定日期
    const monthIdx = months.indexOf(viewState.month)
    const monthNum = String(monthIdx + 1).padStart(2, '0')
    const dayNum = viewState.day.replace('日', '').padStart(2, '0')
    const dateStr = `2025-${monthNum}-${dayNum}`
    filteredData = rawData.filter(row => row['日期'] === dateStr)
  } else if (viewState.month) {
    // 月维度 - 筛选特定月份
    const monthIdx = months.indexOf(viewState.month)
    const monthNum = String(monthIdx + 1).padStart(2, '0')
    filteredData = rawData.filter(row => row['日期'].substring(5, 7) === monthNum)
  }
  // 年维度使用全部数据
  
  // 聚合数据
  const agg = filteredData.reduce((acc, row) => ({
    gmv: acc.gmv + (row['GMV'] || 0),
    cost: acc.cost + (row['商品成本'] || 0),
    adCost: acc.adCost + (row['广告费'] || 0),
    platformFee: acc.platformFee + (row['平台费用'] || 0),
    shipping: acc.shipping + (row['运费'] || 0),
    otherCost: acc.otherCost + (row['其他费用'] || 0),
    orders: acc.orders + (row['订单数'] || 0),
    visitors: acc.visitors + (row['访客数'] || 0),
    refund: acc.refund + (row['退款金额'] || 0)
  }), { gmv: 0, cost: 0, adCost: 0, platformFee: 0, shipping: 0, otherCost: 0, orders: 0, visitors: 0, refund: 0 })
  
  const totalCost = agg.cost + agg.adCost + agg.platformFee + agg.shipping + agg.otherCost
  const profit = agg.gmv - totalCost
  const grossMargin = agg.gmv > 0 ? ((agg.gmv - agg.cost) / agg.gmv * 100).toFixed(1) : '0.0'
  const netMargin = agg.gmv > 0 ? (profit / agg.gmv * 100).toFixed(1) : '0.0'
  const aov = agg.orders > 0 ? Math.round(agg.gmv / agg.orders) : 0
  const conversionRate = agg.visitors > 0 ? ((agg.orders / agg.visitors) * 100).toFixed(2) : '0.00'
  
  const trend = () => (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 20)
  
  // 建立数值映射
  const values = {
    gmv: formatNumber(Math.round(agg.gmv)),
    netProfit: formatNumber(Math.round(profit)),
    netMargin: netMargin,
    grossMargin: grossMargin,
    aov: aov,
    conversionRate: conversionRate
  }

  // 根据配置生成指标数组
  return storeDetailConfig.metrics.map(config => ({
    ...config,
    value: values[config.field] || '0', // 动态取值
    trend: trend() // 保持原有的随机趋势逻辑
  }))
})

// --- 图表数据 (使用真实数据) ---
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const monthMap = { '01': '1月', '02': '2月', '03': '3月', '04': '4月', '05': '5月', '06': '6月', 
                   '07': '7月', '08': '8月', '09': '9月', '10': '10月', '11': '11月', '12': '12月' }

// 当前店铺的原始数据（按日期）
const storeRawData = computed(() => {
  if (!currentStore.value) return []
  return ECOMMERCE_DATA.filter(row => row['店铺名称'] === currentStore.value.shopName)
})

// 月度聚合数据（真实数据）
const trendChartData = computed(() => {
  if (!currentStore.value || storeRawData.value.length === 0) return []
  
  // 按月份分组聚合
  const monthlyMap = {}
  months.forEach(m => {
    monthlyMap[m] = { gmv: 0, cost: 0, adCost: 0, platformFee: 0, shipping: 0, otherCost: 0, 
                      orders: 0, visitors: 0, refund: 0 }
  })
  
  storeRawData.value.forEach(row => {
    const monthKey = row['日期'].substring(5, 7) // "2025-06-01" -> "06"
    const monthLabel = monthMap[monthKey]
    if (monthLabel && monthlyMap[monthLabel]) {
      monthlyMap[monthLabel].gmv += row['GMV'] || 0
      monthlyMap[monthLabel].cost += row['商品成本'] || 0
      monthlyMap[monthLabel].adCost += row['广告费'] || 0
      monthlyMap[monthLabel].platformFee += row['平台费用'] || 0
      monthlyMap[monthLabel].shipping += row['运费'] || 0
      monthlyMap[monthLabel].otherCost += row['其他费用'] || 0
      monthlyMap[monthLabel].orders += row['订单数'] || 0
      monthlyMap[monthLabel].visitors += row['访客数'] || 0
      monthlyMap[monthLabel].refund += row['退款金额'] || 0
    }
  })
  
  return months.map(month => {
    const m = monthlyMap[month]
    const totalCost = m.cost + m.adCost + m.platformFee + m.shipping + m.otherCost
    const profit = m.gmv - totalCost
    const roi = m.adCost > 0 ? parseFloat((m.gmv / m.adCost).toFixed(2)) : 0
    const aov = m.orders > 0 ? Math.round(m.gmv / m.orders) : 0
    
    return {
      label: month,
      income: Math.round(m.gmv),
      cost: Math.round(totalCost),
      profit: Math.round(profit),
      aov,
      roi,
      orders: m.orders,
      visitors: m.visitors
    }
  })
})

// 图表配置
const barChartConfig = {
  income: { label: '收入', color: '#6366f1' },
  cost: { label: '成本', color: '#f97316' },
  profit: { label: '利润', color: '#10b981' }
}

// 饼图数据 - 根据时间维度使用真实数据
const pieChartData = computed(() => {
  if (!currentStore.value) return []
  const s = currentStore.value
  
  // 筛选当前店铺的原始数据
  const rawData = ECOMMERCE_DATA.filter(row => row['店铺名称'] === s.shopName)
  
  let filteredData = rawData
  
  // 根据时间维度筛选数据
  if (viewState.day && viewState.month) {
    const monthIdx = months.indexOf(viewState.month)
    const monthNum = String(monthIdx + 1).padStart(2, '0')
    const dayNum = viewState.day.replace('日', '').padStart(2, '0')
    const dateStr = `2025-${monthNum}-${dayNum}`
    filteredData = rawData.filter(row => row['日期'] === dateStr)
  } else if (viewState.month) {
    const monthIdx = months.indexOf(viewState.month)
    const monthNum = String(monthIdx + 1).padStart(2, '0')
    filteredData = rawData.filter(row => row['日期'].substring(5, 7) === monthNum)
  }
  
  // 聚合成本数据
  const agg = filteredData.reduce((acc, row) => ({
    cost: acc.cost + (row['商品成本'] || 0),
    adCost: acc.adCost + (row['广告费'] || 0),
    platformFee: acc.platformFee + (row['平台费用'] || 0),
    shipping: acc.shipping + (row['运费'] || 0),
    otherCost: acc.otherCost + (row['其他费用'] || 0)
  }), { cost: 0, adCost: 0, platformFee: 0, shipping: 0, otherCost: 0 })
  
  return [
    { name: '商品成本', value: Math.round(agg.cost), color: '#6366f1' },
    { name: '广告费用', value: Math.round(agg.adCost), color: '#f59e0b' },
    { name: '平台费用', value: Math.round(agg.platformFee), color: '#3b82f6' },
    { name: '物流运费', value: Math.round(agg.shipping), color: '#10b981' },
    { name: '其他费用', value: Math.round(agg.otherCost), color: '#94a3b8' },
  ]
})

// 当前视图级别
const isMonthly = computed(() => viewState.month && !viewState.day)
const isDaily = computed(() => viewState.month && viewState.day)

// 获取月份对应的数字 (1月 -> 01)
const getMonthNumber = (monthLabel) => {
  const idx = months.indexOf(monthLabel)
  return idx >= 0 ? String(idx + 1).padStart(2, '0') : null
}

// ECharts 图表数据 - 三级视图（使用真实数据）
const chartData = computed(() => {
  if (!currentStore.value) return []
  
  // 日视图 - 显示24小时数据（小时数据没有原始数据，使用模拟分布）
  if (isDaily.value) {
    // 获取当天的真实数据
    const monthNum = getMonthNumber(viewState.month)
    const dayNum = viewState.day.replace('日', '').padStart(2, '0')
    const dateStr = `2025-${monthNum}-${dayNum}`
    
    const dayData = storeRawData.value.find(row => row['日期'] === dateStr)
    
    if (!dayData) {
      // 如果没有当天数据，返回空或模拟数据
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${i}:00`,
        income: 0, cost: 0, profit: 0, aov: 0, roi: 0, orders: 0, visitors: 0
      }))
    }
    
    // 基于当天真实总量，按小时分布
    const dayGmv = dayData['GMV'] || 0
    const dayCost = (dayData['商品成本'] || 0) + (dayData['广告费'] || 0) + 
                    (dayData['平台费用'] || 0) + (dayData['运费'] || 0) + (dayData['其他费用'] || 0)
    const dayOrders = dayData['订单数'] || 0
    const dayVisitors = dayData['访客数'] || 0
    
    return Array.from({ length: 24 }, (_, i) => {
      // 模拟小时分布：9:00-22:00 高峰期
      const hourFactor = (i >= 9 && i <= 22) ? (0.06 + seededRandom(i) * 0.02) : (0.01 + seededRandom(i) * 0.01)
      const income = Math.round(dayGmv * hourFactor)
      const cost = Math.round(dayCost * hourFactor)
      
      return {
        label: `${i}:00`,
        income,
        cost,
        profit: income - cost,
        aov: dayOrders > 0 ? Math.round(dayGmv / dayOrders) : 0,
        roi: dayData['ROI'] || 0,
        orders: Math.round(dayOrders * hourFactor),
        visitors: Math.round(dayVisitors * hourFactor)
      }
    })
  }
  
  // 月度视图 - 显示每日真实数据
  if (isMonthly.value) {
    const monthNum = getMonthNumber(viewState.month)
    if (!monthNum) return []
    
    // 筛选该月的所有日数据
    const monthData = storeRawData.value.filter(row => {
      return row['日期'].substring(5, 7) === monthNum
    })
    
    // 按日期分组
    const dailyMap = {}
    monthData.forEach(row => {
      const day = parseInt(row['日期'].substring(8, 10))
      if (!dailyMap[day]) {
        dailyMap[day] = { gmv: 0, cost: 0, adCost: 0, platformFee: 0, shipping: 0, 
                          otherCost: 0, orders: 0, visitors: 0, roi: 0 }
      }
      dailyMap[day].gmv += row['GMV'] || 0
      dailyMap[day].cost += row['商品成本'] || 0
      dailyMap[day].adCost += row['广告费'] || 0
      dailyMap[day].platformFee += row['平台费用'] || 0
      dailyMap[day].shipping += row['运费'] || 0
      dailyMap[day].otherCost += row['其他费用'] || 0
      dailyMap[day].orders += row['订单数'] || 0
      dailyMap[day].visitors += row['访客数'] || 0
      dailyMap[day].roi = row['ROI'] || dailyMap[day].roi
    })
    
    // 生成1-31日的数据
    const daysInMonth = Object.keys(dailyMap).length > 0 ? Math.max(...Object.keys(dailyMap).map(Number)) : 30
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const d = dailyMap[day] || { gmv: 0, cost: 0, adCost: 0, platformFee: 0, shipping: 0, otherCost: 0, orders: 0, visitors: 0, roi: 0 }
      const totalCost = d.cost + d.adCost + d.platformFee + d.shipping + d.otherCost
      
      return {
        label: `${day}日`,
        income: Math.round(d.gmv),
        cost: Math.round(totalCost),
        profit: Math.round(d.gmv - totalCost),
        aov: d.orders > 0 ? Math.round(d.gmv / d.orders) : 0,
        roi: d.adCost > 0 ? parseFloat((d.gmv / d.adCost).toFixed(2)) : 0,
        orders: d.orders,
        visitors: d.visitors
      }
    })
  }
  
  // 年度视图 - 显示每月数据
  return trendChartData.value
})

// 模拟订单数据
const dayOrderList = computed(() => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `ORD-${20251001 + i}`,
    time: `${10 + i % 12}:${23 + i * 3}`,
    product: `SKU-ITEM-${1000 + i}`,
    status: i % 3 === 0 ? '已退款' : '已结算',
    amount: Math.floor(50 + seededRandom(i * 11) * 200)
  }))
})

// --- 弹窗状态 ---
const metricDialogOpen = ref(false)
const selectedMetric = ref(null)

// --- 方法 ---
const formatNumber = (num) => num ? num.toLocaleString('zh-CN') : '0'

const getPlatformVariant = (platform) => {
  if (platform === '淘宝') return 'default'
  if (platform === '抖音') return 'secondary'
  return 'destructive'
}

const getPlatformColor = (platform) => {
  if (platform === '淘宝') return 'bg-orange-500'
  if (platform === '抖音') return 'bg-blue-500'
  return 'bg-red-500'
}

const enterStoreDetail = (store) => {
  currentStore.value = store
  viewState.month = null
  viewState.day = null
  setDetailTitle(store.shopName)
}

const showMetricDetail = (metric) => {
  selectedMetric.value = metric
  metricDialogOpen.value = true
}

// ECharts 点击事件处理 - 三级下钻
const handleChartClick = (params) => {
  const label = params.name
  if (!viewState.month) {
    // 从年度视图下钻到月度
    viewState.month = label
    viewState.day = null
  } else if (!viewState.day) {
    // 从月度视图下钻到日视图
    viewState.day = label
  } else {
    // 日视图点击 - 打开订单弹窗
    selectedDay.value = label
    dayDetailDialogOpen.value = true
  }
}

const openOrderDetail = (order) => {
  selectedOrder.value = {
    ...order,
    sku: 'SKU-88842-X',
    cost: (order.amount * 0.4).toFixed(2)
  }
  orderDetailDialogOpen.value = true
}

// 导航函数
const navigateToYear = () => {
  viewState.month = null
  viewState.day = null
}

const navigateToMonth = () => {
  viewState.day = null
}

// --- ECharts 初始化和更新 ---
const initCharts = () => {
  if (!currentStore.value) return
  
  if (mainChartRef.value) {
    mainChartInstance = echarts.init(mainChartRef.value)
    mainChartInstance.on('click', handleChartClick)
    updateMainChart()
  }
  
  if (costChartRef.value) {
    costChartInstance = echarts.init(costChartRef.value)
    updateCostChart()
  }
  
  window.addEventListener('resize', resizeCharts)
}

const resizeCharts = () => {
  mainChartInstance?.resize()
  costChartInstance?.resize()
}

const disposeCharts = () => {
  window.removeEventListener('resize', resizeCharts)
  mainChartInstance?.dispose()
  costChartInstance?.dispose()
  mainChartInstance = null
  costChartInstance = null
}

const updateMainChart = () => {
  if (!mainChartInstance) return
  
  const xData = chartData.value.map(d => d.label)
  const mode = chartMode.value
  
  let series = []
  let yAxis = []
  
  if (mode === 'scale') {
    yAxis = [{ type: 'value', name: '金额' }]
    series = [
      {
        name: '利润',
        type: 'bar',
        data: chartData.value.map(d => d.profit),
        itemStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#34D399' },
            { offset: 1, color: '#10B981' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 30
      },
      {
        name: '收入',
        type: 'line',
        data: chartData.value.map(d => d.income),
        itemStyle: { color: '#6366f1' },
        smooth: true,
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '成本',
        type: 'line',
        data: chartData.value.map(d => d.cost),
        itemStyle: { color: '#FF7D00' },
        smooth: true,
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  } else if (mode === 'efficiency') {
    yAxis = [
      { type: 'value', name: '客单价', position: 'left' },
      { type: 'value', name: 'ROI', position: 'right', splitLine: { show: false } }
    ]
    series = [
      {
        name: '客单价',
        type: 'bar',
        data: chartData.value.map(d => d.aov),
        itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 30,
        yAxisIndex: 0
      },
      {
        name: 'ROI',
        type: 'line',
        data: chartData.value.map(d => d.roi),
        itemStyle: { color: '#8B5CF6' },
        smooth: true,
        yAxisIndex: 1
      }
    ]
  } else if (mode === 'order') {
    yAxis = [
      { type: 'value', name: '订单数', position: 'left' },
      { type: 'value', name: '访客数', position: 'right', splitLine: { show: false } }
    ]
    series = [
      {
        name: '订单数',
        type: 'bar',
        data: chartData.value.map(d => d.orders),
        itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 30,
        yAxisIndex: 0
      },
      {
        name: '访客数',
        type: 'line',
        data: chartData.value.map(d => d.visitors),
        itemStyle: { color: '#94A3B8' },
        lineStyle: { type: 'dashed' },
        smooth: true,
        yAxisIndex: 1
      }
    ]
  }
  
  const option = {
    grid: { top: 40, right: 50, bottom: 40, left: 50, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C' }
    },
    yAxis,
    series
  }
  
  mainChartInstance.setOption(option, true)
}

const updateCostChart = () => {
  if (!costChartInstance) return
  
  const data = pieChartData.value
  
  costChartInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center', icon: 'circle' },
    series: [{
      name: '成本构成',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: data.map(d => ({ 
        value: d.value, 
        name: d.name, 
        itemStyle: { color: d.color } 
      }))
    }]
  })
}

// 监听 store 变化
watch(() => currentStore.value, (val) => {
  if (val) {
    setTimeout(() => {
      initCharts()
    }, 300)
  } else {
    disposeCharts()
  }
})

// 监听图表模式和数据变化
watch([chartData, chartMode], () => {
  if (mainChartInstance) updateMainChart()
})

// 监听时间维度变化 - 更新所有图表
watch([() => viewState.month, () => viewState.day], () => {
  if (mainChartInstance) {
    nextTick(() => updateMainChart())
  }
  if (costChartInstance) {
    nextTick(() => updateCostChart())
  }
})

onUnmounted(() => {
  disposeCharts()
})
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden bg-background">
    <Teleport to="#breadcrumb-actions" defer>
      <DateRangeFilter 
        v-model="dateRange" 
        @apply="onDateRangeApply" 
      />
    </Teleport>
    <transition name="fade" mode="out-in">
      <!-- 店铺列表视图 -->
      <div v-if="!currentStore" key="list" class="h-full p-6 overflow-auto space-y-4">
        <!-- 核心指标卡片 - 店铺列表概览 (配置驱动 + 动态布局) -->
        <div 
          class="grid gap-4" 
          :style="{ gridTemplateColumns: `repeat(${storeListConfig.layout.columns}, minmax(0, 1fr))` }"
        >
          <Card 
            v-for="metric in storeListConfig.metrics" 
            :key="metric.id"
            class="hover:shadow-md transition-all duration-200 hover:border-primary/50 group relative" 
            :style="{ height: storeListConfig.layout.height }"
          >
            <!-- 右上角 Tooltip 图标 -->
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="absolute top-3 right-3 cursor-help">
                    <CircleHelp class="h-4 w-4 text-muted-foreground/50 hover:text-primary transition-colors" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" class="max-w-xs">
                  <div class="text-sm">
                    <p class="font-medium mb-1">{{ metric.label }}</p>
                    <p class="text-muted-foreground">计算公式：{{ metric.formula }}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div class="p-4 flex flex-col gap-1">
              <div class="flex flex-row items-center justify-between">
                <span class="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  {{ metric.label }}
                </span>
                <component :is="metric.icon" class="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div class="text-2xl font-bold truncate" :class="metric.color !== 'default' ? metric.color : ''">
                {{ metric.format === 'currency' ? '¥ ' : '' }}
                {{ formatNumber(totalMetrics[metric.field] || 0) }}
                {{ metric.format === 'percent' ? '%' : '' }}
              </div>
            </div>
          </Card>
        </div>

        <!-- 店铺列表表格 -->
        <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[180px]">店铺名称</TableHead>
                <TableHead class="w-[100px]">
                  <Popover>
                    <PopoverTrigger class="flex items-center gap-1 cursor-pointer hover:text-primary">
                      <span>平台</span>
                      <ListFilter class="h-3.5 w-3.5" :class="platformFilters.length < allPlatforms.length ? 'text-primary' : 'opacity-50'" />
                    </PopoverTrigger>
                    <PopoverContent class="w-44 p-3">
                      <div class="space-y-3">
                        <div class="flex items-center justify-between border-b pb-2">
                          <span class="text-sm font-medium">筛选平台</span>
                          <Button variant="ghost" size="sm" class="h-6 px-2 text-xs" @click="selectAllPlatforms">
                            {{ platformFilters.length === allPlatforms.length ? '取消全选' : '全选' }}
                          </Button>
                        </div>
                        <div v-for="p in allPlatforms" :key="p" class="flex items-center gap-2">
                          <Checkbox 
                            :id="p" 
                            :checked="platformFilters.includes(p)"
                            @update:checked="togglePlatformFilter(p)"
                          />
                          <label :for="p" class="text-sm cursor-pointer flex items-center gap-2 flex-1">
                            <div class="w-2 h-2 rounded-full" :class="getPlatformColor(p)"></div>
                            {{ p }}
                          </label>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>
                <TableHead class="text-right cursor-pointer hover:text-primary" @click="toggleSort('gmv')">
                  <div class="flex items-center justify-end gap-1">
                    GMV
                    <ArrowUp v-if="sortField === 'gmv' && sortDirection === 'asc'" class="h-3 w-3" />
                    <ArrowDown v-else-if="sortField === 'gmv' && sortDirection === 'desc'" class="h-3 w-3" />
                    <ArrowUpDown v-else class="h-3 w-3 opacity-30" />
                  </div>
                </TableHead>
                <TableHead class="text-right cursor-pointer hover:text-primary" @click="toggleSort('cost')">
                  <div class="flex items-center justify-end gap-1">
                    成本
                    <ArrowUp v-if="sortField === 'cost' && sortDirection === 'asc'" class="h-3 w-3" />
                    <ArrowDown v-else-if="sortField === 'cost' && sortDirection === 'desc'" class="h-3 w-3" />
                    <ArrowUpDown v-else class="h-3 w-3 opacity-30" />
                  </div>
                </TableHead>
                <TableHead class="text-right cursor-pointer hover:text-primary" @click="toggleSort('grossMargin')">
                  <div class="flex items-center justify-end gap-1">
                    毛利率
                    <ArrowUp v-if="sortField === 'grossMargin' && sortDirection === 'asc'" class="h-3 w-3" />
                    <ArrowDown v-else-if="sortField === 'grossMargin' && sortDirection === 'desc'" class="h-3 w-3" />
                    <ArrowUpDown v-else class="h-3 w-3 opacity-30" />
                  </div>
                </TableHead>
                <TableHead class="text-right cursor-pointer hover:text-primary" @click="toggleSort('netMargin')">
                  <div class="flex items-center justify-end gap-1">
                    净利率
                    <ArrowUp v-if="sortField === 'netMargin' && sortDirection === 'asc'" class="h-3 w-3" />
                    <ArrowDown v-else-if="sortField === 'netMargin' && sortDirection === 'desc'" class="h-3 w-3" />
                    <ArrowUpDown v-else class="h-3 w-3 opacity-30" />
                  </div>
                </TableHead>
                <TableHead class="text-right cursor-pointer hover:text-primary" @click="toggleSort('aov')">
                  <div class="flex items-center justify-end gap-1">
                    客单价
                    <ArrowUp v-if="sortField === 'aov' && sortDirection === 'asc'" class="h-3 w-3" />
                    <ArrowDown v-else-if="sortField === 'aov' && sortDirection === 'desc'" class="h-3 w-3" />
                    <ArrowUpDown v-else class="h-3 w-3 opacity-30" />
                  </div>
                </TableHead>
                <TableHead class="text-right cursor-pointer hover:text-primary" @click="toggleSort('conversionRate')">
                  <div class="flex items-center justify-end gap-1">
                    转化率
                    <ArrowUp v-if="sortField === 'conversionRate' && sortDirection === 'asc'" class="h-3 w-3" />
                    <ArrowDown v-else-if="sortField === 'conversionRate' && sortDirection === 'desc'" class="h-3 w-3" />
                    <ArrowUpDown v-else class="h-3 w-3 opacity-30" />
                  </div>
                </TableHead>
                <TableHead class="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow 
                v-for="store in paginatedStoreList" 
                :key="store.shopName"
                class="cursor-pointer hover:bg-muted/50"
                @click="enterStoreDetail(store)"
              >
                <TableCell class="font-medium">{{ store.shopName }}</TableCell>
                <TableCell>
                  <Badge :variant="getPlatformVariant(store.platform)" class="text-xs">
                    {{ store.platform }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right font-mono font-semibold">¥ {{ formatNumber(store.gmv) }}</TableCell>
                <TableCell class="text-right font-mono text-muted-foreground">¥ {{ formatNumber(store.cost) }}</TableCell>
                <TableCell class="text-right text-emerald-600 font-medium">{{ store.grossMargin }}%</TableCell>
                <TableCell class="text-right font-semibold text-indigo-600">{{ store.netMargin }}%</TableCell>
                <TableCell class="text-right">¥ {{ store.aov }}</TableCell>
                <TableCell class="text-right">{{ store.conversionRate }}%</TableCell>
                <TableCell>
                  <ChevronRight class="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <!-- 分页控制 -->
          <div class="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <div class="text-sm text-muted-foreground">
              共 {{ filteredAndSortedList.length }} 个店铺，第 {{ currentPage }} / {{ totalPages }} 页
            </div>
            <div class="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <ChevronLeft class="h-4 w-4 mr-1" /> 上一页
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                :disabled="currentPage >= totalPages"
                @click="currentPage++"
              >
                下一页 <ChevronRight class="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- 店铺详情视图 -->
      <div v-else key="detail" class="h-full p-6 overflow-auto space-y-6">
        <!-- 时间维度导航条 -->
        <div class="flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/30 rounded-xl p-4 border">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <Store class="h-5 w-5 text-primary" />
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-lg font-bold">{{ currentStore.shopName }}</span>
                <Badge :variant="getPlatformVariant(currentStore.platform)">{{ currentStore.platform }}</Badge>
              </div>
              <!-- 层级面包屑导航 -->
              <nav class="flex items-center gap-1.5 text-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  class="h-7 px-2.5"
                  :class="!viewState.month ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'"
                  @click="navigateToYear"
                >
                  年度总览
                </Button>
                <template v-if="viewState.month">
                  <ChevronRight class="h-3.5 w-3.5 text-muted-foreground" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="h-7 px-2.5"
                    :class="viewState.month && !viewState.day ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'"
                    @click="navigateToMonth"
                  >
                    {{ viewState.month }}
                  </Button>
                </template>
                <template v-if="viewState.day">
                  <ChevronRight class="h-3.5 w-3.5 text-muted-foreground" />
                  <Button variant="ghost" size="sm" class="h-7 px-2.5 bg-primary/10 text-primary font-medium">
                    {{ viewState.day }}
                  </Button>
                </template>
              </nav>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="bg-white dark:bg-slate-800 text-emerald-600 border-emerald-200">
              经营正常
            </Badge>
            <Button variant="outline" size="sm" class="bg-white dark:bg-slate-800">
              <Download class="h-4 w-4 mr-1" /> 导出
            </Button>
          </div>
        </div>

        <!-- 核心指标卡片 - Shadcn Dashboard 风格 (动态布局) -->
        <div 
          class="grid gap-4" 
          :style="{ gridTemplateColumns: `repeat(${storeDetailConfig.layout.columns}, minmax(0, 1fr))` }"
        >
          <Card 
            v-for="(metric, idx) in storeDetailMetrics" 
            :key="idx" 
            class="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50 group flex flex-col justify-between"
            :style="{ height: storeDetailConfig.layout.height }"
          >
            <div class="p-3 flex flex-col gap-1">
              <div class="flex flex-row items-center justify-between">
                <span class="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">
                  {{ metric.label }}
                </span>
                <component :is="metric.icon" class="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div class="text-lg font-bold truncate" :class="metric.color">
                {{ metric.prefix }}{{ metric.value }}{{ metric.suffix }}
              </div>
              <p class="text-[10px] text-muted-foreground flex items-center gap-1">
                <span 
                  class="font-medium"
                  :class="metric.trend > 0 ? 'text-rose-500' : 'text-emerald-500'"
                >
                  {{ metric.trend > 0 ? '+' : '' }}{{ metric.trend }}%
                </span>
                <span class="opacity-70 scale-90 origin-left">同比</span>
              </p>
            </div>
          </Card>
        </div>

        <!-- 经营趋势图 -->
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <div class="flex items-center gap-2">
              <CardTitle class="text-base">
                {{ isDaily ? '小时经营分布' : isMonthly ? '日经营趋势' : '月度经营趋势' }}
              </CardTitle>
              <span v-if="!isDaily" class="text-xs text-muted-foreground">(点击柱状图下钻)</span>
            </div>
            <div class="flex gap-1">
              <Button 
                v-for="mode in [{ key: 'scale', label: '收支视图' }, { key: 'efficiency', label: '效率视图' }, { key: 'order', label: '流量视图' }]" 
                :key="mode.key"
                variant="ghost" 
                size="sm"
                :class="chartMode === mode.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground'"
                @click="chartMode = mode.key"
              >
                {{ mode.label }}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <!-- ECharts 主图表 -->
            <div ref="mainChartRef" class="h-[280px] w-full"></div>
          </CardContent>
        </Card>

        <!-- 成本与效率分析 -->
        <div class="grid grid-cols-2 gap-6">
          <!-- 成本构成饼图 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base">成本构成分析</CardTitle>
            </CardHeader>
            <CardContent>
              <!-- ECharts 饼图 -->
              <div ref="costChartRef" class="h-[200px] w-full"></div>
              <div class="grid grid-cols-3 gap-2 mt-4">
                <div v-for="item in pieChartData" :key="item.name" class="flex items-center gap-2 text-sm">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }"></div>
                  <span class="text-muted-foreground">{{ item.name }}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- 经营效率分析 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base">经营效率分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 rounded-lg bg-muted/50">
                  <div class="text-sm text-muted-foreground mb-1">ROI</div>
                  <div class="text-2xl font-bold text-indigo-600">{{ currentStore.roi }}</div>
                </div>
                <div class="p-4 rounded-lg bg-muted/50">
                  <div class="text-sm text-muted-foreground mb-1">转化率</div>
                  <div class="text-2xl font-bold text-emerald-600">{{ currentStore.conversionRate }}%</div>
                </div>
                <div class="p-4 rounded-lg bg-muted/50">
                  <div class="text-sm text-muted-foreground mb-1">退款金额</div>
                  <div class="text-2xl font-bold text-red-500">¥ {{ formatNumber(currentStore.refund) }}</div>
                </div>
                <div class="p-4 rounded-lg bg-muted/50">
                  <div class="text-sm text-muted-foreground mb-1">广告投入</div>
                  <div class="text-2xl font-bold text-amber-600">¥ {{ formatNumber(currentStore.adCost) }}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </transition>
  <!-- 指标详情弹窗 -->
  <Dialog v-model:open="metricDialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ selectedMetric?.title }}</DialogTitle>
        <DialogDescription>指标详情和计算公式</DialogDescription>
      </DialogHeader>
      <div v-if="selectedMetric" class="space-y-4">
        <div class="p-4 rounded-lg bg-muted/50 text-center">
          <div class="text-3xl font-bold">{{ selectedMetric.value }}</div>
        </div>
        <div v-if="selectedMetric.formula" class="p-4 rounded-lg border">
          <div class="text-sm text-muted-foreground mb-1">计算公式</div>
          <div class="font-mono text-sm">{{ selectedMetric.formula }}</div>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- 日订单详情弹窗 -->
  <Dialog v-model:open="dayDetailDialogOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ selectedDay }} 订单详情</DialogTitle>
        <DialogDescription>查看当日订单列表和经营数据</DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>时间</TableHead>
              <TableHead>商品</TableHead>
              <TableHead>状态</TableHead>
              <TableHead class="text-right">金额</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="order in dayOrderList" 
              :key="order.id"
              class="cursor-pointer hover:bg-muted/50"
              @click="openOrderDetail(order)"
            >
              <TableCell class="font-mono text-xs">{{ order.id }}</TableCell>
              <TableCell>{{ order.time }}</TableCell>
              <TableCell>{{ order.product }}</TableCell>
              <TableCell>
                <Badge :variant="order.status === '已退款' ? 'destructive' : 'default'" class="text-xs">
                  {{ order.status }}
                </Badge>
              </TableCell>
              <TableCell class="text-right font-mono">¥{{ order.amount }}</TableCell>
              <TableCell>
                <ChevronRight class="h-4 w-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>

  <!-- 商品详情弹窗 -->
  <Dialog v-model:open="orderDetailDialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>订单 {{ selectedOrder?.id }}</DialogTitle>
        <DialogDescription>商品成本和利润分析</DialogDescription>
      </DialogHeader>
      <div v-if="selectedOrder" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 rounded-lg bg-muted/50">
            <div class="text-sm text-muted-foreground">商品 SKU</div>
            <div class="font-mono">{{ selectedOrder.sku }}</div>
          </div>
          <div class="p-3 rounded-lg bg-muted/50">
            <div class="text-sm text-muted-foreground">订单金额</div>
            <div class="font-bold text-lg">¥{{ selectedOrder.amount }}</div>
          </div>
          <div class="p-3 rounded-lg bg-muted/50">
            <div class="text-sm text-muted-foreground">商品成本</div>
            <div class="font-mono text-orange-600">¥{{ selectedOrder.cost }}</div>
          </div>
          <div class="p-3 rounded-lg bg-muted/50">
            <div class="text-sm text-muted-foreground">毛利</div>
            <div class="font-bold text-emerald-600">¥{{ (selectedOrder.amount - selectedOrder.cost).toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
