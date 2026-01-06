<script setup>
import { ref, computed, watch } from 'vue'
import { Building2, ChevronDown, ChevronRight, Expand, Shrink, Info, Pencil, Save, Users, Folders } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// --- 筛选状态 ---
const selectedYear = ref('2025')
const selectedMonth = ref('all')
const activeTab = ref('balance')
const expandedKeys = ref(new Set())
const isBudgetEditing = ref(false)

// --- 财务数据 ---
const FULL_COMPANY_REPORTS = {
  balance: [
    { id: 'asset', name: '一、资产总计', value: 58420000, beginValue: 55200000, level: 1, children: [
      { id: 'asset-current', name: '流动资产', value: 32500000, beginValue: 30100000, level: 2, children: [
        { id: 'c1', name: '货币资金', value: 15200000, beginValue: 14000000, level: 3 },
        { id: 'c2', name: '交易性金融资产', value: 2000000, beginValue: 1800000, level: 3 },
        { id: 'c3', name: '应收账款', value: 8300000, beginValue: 7800000, level: 3 },
        { id: 'c4', name: '预付款项', value: 1800000, beginValue: 1600000, level: 3 },
        { id: 'c5', name: '其他应收款', value: 1200000, beginValue: 1100000, level: 3 },
        { id: 'c6', name: '存货', value: 4000000, beginValue: 3800000, level: 3 }
      ]},
      { id: 'asset-fixed', name: '非流动资产', value: 25920000, beginValue: 25100000, level: 2, children: [
        { id: 'f1', name: '固定资产', value: 12500000, beginValue: 12200000, level: 3 },
        { id: 'f2', name: '在建工程', value: 4500000, beginValue: 4200000, level: 3 },
        { id: 'f3', name: '无形资产', value: 7800000, beginValue: 7600000, level: 3 },
        { id: 'f4', name: '长期待摊费用', value: 1120000, beginValue: 1100000, level: 3 }
      ]}
    ]},
    { id: 'liability', name: '二、负债合计', value: 21300000, beginValue: 20500000, level: 1, children: [
      { id: 'liab-current', name: '流动负债', value: 15100000, beginValue: 14600000, level: 2, children: [
        { id: 'l1', name: '短期借款', value: 5200000, beginValue: 5000000, level: 3 },
        { id: 'l2', name: '应付票据', value: 1800000, beginValue: 1700000, level: 3 },
        { id: 'l3', name: '应付账款', value: 6200000, beginValue: 6000000, level: 3 },
        { id: 'l4', name: '应付职工薪酬', value: 1400000, beginValue: 1400000, level: 3 },
        { id: 'l5', name: '应交税费', value: 500000, beginValue: 500000, level: 3 }
      ]},
      { id: 'liab-long', name: '非流动负债', value: 6200000, beginValue: 5900000, level: 2, children: [
        { id: 'll1', name: '长期借款', value: 6200000, beginValue: 5900000, level: 3 }
      ]}
    ]},
    { id: 'equity', name: '三、所有者权益', value: 37120000, beginValue: 34700000, level: 1, children: [
      { id: 'e1', name: '实收资本', value: 20000000, beginValue: 20000000, level: 2 },
      { id: 'e2', name: '资本公积', value: 5000000, beginValue: 5000000, level: 2 },
      { id: 'e3', name: '盈余公积', value: 2120000, beginValue: 1900000, level: 2 },
      { id: 'e4', name: '未分配利润', value: 10000000, beginValue: 7800000, level: 2 }
    ]}
  ],
  profit: [
    { id: 'income', name: '一、营业收入', value: 85600000, beginValue: 78500000, level: 1, children: [
      { id: 'inc-main', name: '主营业务收入', value: 80400000, beginValue: 74000000, level: 2, children: [
        { id: 'im1', name: '线上销售收入', value: 60200000, beginValue: 55000000, level: 3 },
        { id: 'im2', name: '分销收入', value: 20200000, beginValue: 19000000, level: 3 }
      ]},
      { id: 'inc-other', name: '其他业务收入', value: 5200000, beginValue: 4500000, level: 2 }
    ]},
    { id: 'cost', name: '二、营业成本', value: 45800000, beginValue: 42000000, level: 1, children: [
      { id: 'cost-main', name: '主营业务成本', value: 42500000, beginValue: 39000000, level: 2 },
      { id: 'cost-other', name: '其他业务成本', value: 3300000, beginValue: 3000000, level: 2 }
    ]},
    { id: 'tax', name: '三、税金及附加', value: 550000, beginValue: 500000, level: 1 },
    { id: 'expense', name: '四、期间费用', value: 25600000, beginValue: 23500000, level: 1, children: [
      { id: 'ex-sale', name: '销售费用', value: 15500000, beginValue: 14200000, level: 2, children: [
        { id: 'es1', name: '广告推广费', value: 8200000, beginValue: 7500000, level: 3 },
        { id: 'es2', name: '平台佣金', value: 5100000, beginValue: 4700000, level: 3 },
        { id: 'es3', name: '物流运输费', value: 2200000, beginValue: 2000000, level: 3 }
      ]},
      { id: 'ex-manage', name: '管理费用', value: 8100000, beginValue: 7400000, level: 2, children: [
        { id: 'em1', name: '行政薪资', value: 5200000, beginValue: 4800000, level: 3 },
        { id: 'em2', name: '办公租赁费', value: 1800000, beginValue: 1700000, level: 3 },
        { id: 'em3', name: '差旅交通', value: 1100000, beginValue: 900000, level: 3 }
      ]},
      { id: 'ex-rd', name: '研发费用', value: 1600000, beginValue: 1500000, level: 2 },
      { id: 'ex-fin', name: '财务费用', value: 400000, beginValue: 400000, level: 2 }
    ]},
    { id: 'profit-op', name: '五、营业利润', value: 13650000, beginValue: 12500000, level: 1 },
    { id: 'profit-total', name: '六、利润总额', value: 14050000, beginValue: 12900000, level: 1 },
    { id: 'profit-net', name: '七、净利润', value: 10537500, beginValue: 9675000, level: 1 }
  ],
  cash: [
    { id: 'c-op', name: '一、经营活动产生的现金流量', value: 12500000, beginValue: 11200000, level: 1, children: [
      { id: 'cop-in', name: '销售商品、提供劳务收到的现金', value: 91000000, beginValue: 83000000, level: 2 },
      { id: 'cop-out', name: '购买商品、接受劳务支付的现金', value: -78500000, beginValue: -71800000, level: 2 }
    ]},
    { id: 'c-inv', name: '二、投资活动产生的现金流量', value: -5200000, beginValue: -4800000, level: 1, children: [
      { id: 'cinv-in', name: '收回投资收到的现金', value: 1200000, beginValue: 1000000, level: 2 },
      { id: 'cinv-out', name: '购建固定资产支付的现金', value: -6400000, beginValue: -5800000, level: 2 }
    ]},
    { id: 'c-fin', name: '三、筹资活动产生的现金流量', value: 2800000, beginValue: 2500000, level: 1, children: [
      { id: 'cfin-in', name: '吸收投资收到的现金', value: 5000000, beginValue: 4500000, level: 2 },
      { id: 'cfin-out', name: '偿还债务支付的现金', value: -2200000, beginValue: -2000000, level: 2 }
    ]},
    { id: 'c-net', name: '四、现金及现金等价物净增加额', value: 10100000, beginValue: 8900000, level: 1 }
  ],
  budget: [
    { id: 1, subject: '销售费用', budget: 16000000, actual: 15500000 },
    { id: 2, subject: '管理费用', budget: 8500000, actual: 8100000 },
    { id: 3, subject: '研发费用', budget: 2000000, actual: 1600000 },
    { id: 4, subject: '财务费用', budget: 500000, actual: 400000 },
    { id: 5, subject: '人力成本', budget: 12000000, actual: 11500000 },
    { id: 6, subject: '办公行政', budget: 3000000, actual: 1800000 },
    { id: 7, subject: '市场推广费', budget: 5000000, actual: 4800000 },
    { id: 8, subject: '物流仓储费', budget: 4000000, actual: 2200000 },
  ]
}

const AMEBA_DEPARTMENTS = ['运营部-淘宝', '运营部-抖音', '运营部-快手', '商品部', '开发部', '产研部', '客服部', '仓储部', '人事部', '财务部']

// --- 计算属性 ---
const dateFactor = computed(() => selectedMonth.value === 'all' ? 1 : 1 / 12)
const scaleValue = (val) => Math.floor(val * dateFactor.value)

const flattenData = (data, parentExpanded = true) => {
  const result = []
  const process = (items, depth = 0, visible = true) => {
    items.forEach(item => {
      const isExpanded = expandedKeys.value.has(item.id)
      const hasChildren = item.children && item.children.length > 0
      result.push({
        ...item,
        value: scaleValue(item.value),
        beginValue: scaleValue(item.beginValue || 0),
        depth,
        visible,
        isExpanded,
        hasChildren
      })
      if (hasChildren) {
        process(item.children, depth + 1, visible && isExpanded)
      }
    })
  }
  process(data)
  return result.filter(item => item.visible)
}

const balanceData = computed(() => flattenData(FULL_COMPANY_REPORTS.balance))
const profitData = computed(() => flattenData(FULL_COMPANY_REPORTS.profit))
const cashData = computed(() => flattenData(FULL_COMPANY_REPORTS.cash))

const amebaBudgetData = computed(() => {
  return AMEBA_DEPARTMENTS.map((name, index) => {
    const baseBudget = name.includes('运营') ? 5000000 : 1000000
    const budget = scaleValue(Math.floor(baseBudget * (1 + Math.random() * 0.5)))
    const actual = scaleValue(Math.floor(budget * (0.7 + Math.random() * 0.3)))
    return {
      id: index + 1,
      group: name,
      budget,
      actual,
      percent: budget > 0 ? Math.round(actual / budget * 100) : 0
    }
  }).sort((a, b) => b.budget - a.budget)
})

const companyBudgetData = computed(() => {
  return FULL_COMPANY_REPORTS.budget.map(item => {
    const b = scaleValue(item.budget)
    const a = scaleValue(item.actual)
    return { ...item, budget: b, actual: a, percent: b > 0 ? Math.round(a / b * 100) : 0 }
  })
})

// --- 弹窗状态 ---
const detailDialogOpen = ref(false)
const detailData = ref(null)

const amebaDetailVisible = ref(false)
const selectedAmeba = ref(null)

const subjectDetailVisible = ref(false)
const selectedSubject = ref(null)

const expenseDetailVisible = ref(false)
const expenseDetailTitle = ref('')
const expenseDetailData = ref([])

const amebaDetailData = computed(() => {
  if (!selectedAmeba.value) return []
  return FULL_COMPANY_REPORTS.budget.slice(0, 6).map((b, i) => ({
    id: i,
    subject: b.subject,
    actual: Math.floor(selectedAmeba.value.actual * 0.15 * (1 + Math.random())),
    percent: Math.floor(Math.random() * 40 + 60)
  }))
})

const subjectDetailData = computed(() => {
  if (!selectedSubject.value) return []
  return AMEBA_DEPARTMENTS.slice(0, 8).map(dept => ({
    dept,
    value: Math.floor(selectedSubject.value.actual / 8 * (0.8 + Math.random() * 0.4)),
    percent: Math.floor(Math.random() * 80 + 20)
  })).sort((a, b) => b.value - a.value)
})

const getMockExpenseDetails = (dept, subj) => {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    date: `2025-10-${10 + i}`,
    desc: `${dept}-${subj}-报销单${i + 1}`,
    user: ['张三', '李四'][i % 2],
    amount: Math.floor(Math.random() * 5000) + 200
  }))
}

const openAmebaDetail = (record) => {
  selectedAmeba.value = record
  amebaDetailVisible.value = true
}

const openSubjectDetail = (record) => {
  selectedSubject.value = record
  subjectDetailVisible.value = true
}

const openExpenseDetail = (scope1, scope2) => {
  expenseDetailTitle.value = `${scope1} - ${scope2} 费用明细`
  expenseDetailData.value = getMockExpenseDetails(scope1, scope2)
  expenseDetailVisible.value = true
}

const saveBudget = () => {
  isBudgetEditing.value = false
  // 这里可以添加实际的保存逻辑
}

// --- 方法 ---
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString('zh-CN')
}

const getProgressColor = (percent) => {
  if (percent > 95) return 'bg-red-500'
  if (percent > 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

const getProgressTextColor = (percent) => {
  if (percent > 95) return 'text-red-600'
  if (percent > 80) return 'text-amber-600'
  return 'text-emerald-600'
}

const toggleExpand = (id) => {
  if (expandedKeys.value.has(id)) {
    expandedKeys.value.delete(id)
  } else {
    expandedKeys.value.add(id)
  }
  expandedKeys.value = new Set(expandedKeys.value)
}

const getAllKeys = (data) => {
  const keys = []
  const traverse = (items) => {
    items.forEach(item => {
      keys.push(item.id)
      if (item.children) traverse(item.children)
    })
  }
  traverse(data)
  return keys
}

const expandAll = () => {
  let data = []
  if (activeTab.value === 'balance') data = FULL_COMPANY_REPORTS.balance
  else if (activeTab.value === 'profit') data = FULL_COMPANY_REPORTS.profit
  else if (activeTab.value === 'cash') data = FULL_COMPANY_REPORTS.cash
  expandedKeys.value = new Set(getAllKeys(data))
}

const collapseAll = () => {
  expandedKeys.value = new Set()
}

const handleRowClick = (record) => {
  if (record.hasChildren) {
    toggleExpand(record.id)
  } else {
    // 叶子节点打开明细
    detailData.value = {
      name: record.name,
      value: record.value,
      details: Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        date: `2025-10-${10 + i}`,
        docNo: `PZ-${100 + i}`,
        summary: `${record.name}-业务明细-${i + 1}`,
        type: ['银行转账', '报销单', '付款单', '收款单'][i % 4],
        debit: Math.floor(record.value / 6 * (0.8 + Math.random() * 0.4)),
        credit: 0
      }))
    }
    detailDialogOpen.value = true
  }
}

// 初始展开
watch(activeTab, () => {
  setTimeout(expandAll, 0)
}, { immediate: true })
</script>

<template>
  <!-- 筛选器 Teleport 到面包屑右侧 -->
  <Teleport to="#breadcrumb-actions" defer>
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1 px-3 py-1 bg-muted/50 rounded-full text-sm">
        <span class="text-muted-foreground">年份</span>
        <Select v-model="selectedYear">
          <SelectTrigger class="h-6 w-16 border-0 bg-transparent p-0 text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-1 px-3 py-1 bg-muted/50 rounded-full text-sm">
        <span class="text-muted-foreground">期间</span>
        <Select v-model="selectedMonth">
          <SelectTrigger class="h-6 w-16 border-0 bg-transparent p-0 text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全年</SelectItem>
            <SelectItem v-for="m in 12" :key="m" :value="String(m)">{{ m }}月</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </Teleport>

  <div class="h-full p-6">
    <div class="bg-background rounded-lg border h-full flex flex-col">
      <!-- Tabs -->
      <Tabs v-model="activeTab" class="flex-1 flex flex-col">
        <div class="flex items-center justify-between border-b px-6">
          <TabsList class="h-12 w-auto bg-transparent p-0 justify-start gap-6">
            <TabsTrigger 
              value="balance" 
              class="relative h-12 rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              资产负债表
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info class="ml-1 h-3 w-3 text-muted-foreground/70" /></TooltipTrigger>
                  <TooltipContent>数据来源: ads_BalanceSheet</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsTrigger>
            <TabsTrigger 
              value="profit" 
              class="relative h-12 rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              利润表
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info class="ml-1 h-3 w-3 text-muted-foreground/70" /></TooltipTrigger>
                  <TooltipContent>数据来源: ads_IncomeStatement</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsTrigger>
            <TabsTrigger 
              value="cash" 
              class="relative h-12 rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              现金流量表
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info class="ml-1 h-3 w-3 text-muted-foreground/70" /></TooltipTrigger>
                  <TooltipContent>数据来源: ads_CashFlowStatement</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsTrigger>
            <TabsTrigger 
              value="budget" 
              class="relative h-12 rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              全面预算监控
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info class="ml-1 h-3 w-3 text-muted-foreground/70" /></TooltipTrigger>
                  <TooltipContent>数据来源: ads_BudgetMonitoring</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsTrigger>
          </TabsList>
          
          <!-- 展开/收起按钮 -->
          <div v-if="['balance', 'profit', 'cash'].includes(activeTab)" class="flex gap-2">
            <Button variant="outline" size="sm" @click="expandAll">
              <Expand class="h-4 w-4 mr-1" /> 全部展开
            </Button>
            <Button variant="outline" size="sm" @click="collapseAll">
              <Shrink class="h-4 w-4 mr-1" /> 全部收起
            </Button>
          </div>
        </div>

        <!-- 资产负债表 -->
        <TabsContent value="balance" class="flex-1 overflow-auto p-0 mt-0">
          <Table class="w-full">
            <TableHeader>
              <TableRow class="bg-muted/50">
                <TableHead class="w-[400px] pl-6">项目名称</TableHead>
                <TableHead class="text-right">期初金额</TableHead>
                <TableHead class="text-right pr-6">期末余额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow 
                v-for="row in balanceData" 
                :key="row.id"
                class="cursor-pointer hover:bg-muted/30"
                @click="handleRowClick(row)"
              >
                <TableCell :style="{ paddingLeft: `${row.depth * 24 + 24}px` }">
                  <div class="flex items-center gap-2">
                    <button 
                      v-if="row.hasChildren" 
                      class="w-4 h-4 flex items-center justify-center"
                      @click.stop="toggleExpand(row.id)"
                    >
                      <ChevronDown v-if="row.isExpanded" class="h-4 w-4" />
                      <ChevronRight v-else class="h-4 w-4" />
                    </button>
                    <span v-else class="w-4"></span>
                    <span :class="{ 'font-semibold': row.level === 1 }">{{ row.name }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-right font-mono text-muted-foreground">
                  ¥ {{ formatNumber(row.beginValue) }}
                </TableCell>
                <TableCell class="text-right font-mono pr-6" :class="row.level === 1 ? 'text-primary font-semibold' : 'text-muted-foreground'">
                  ¥ {{ formatNumber(row.value) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>

        <!-- 利润表 -->
        <TabsContent value="profit" class="flex-1 overflow-auto p-0 mt-0">
          <Table class="w-full">
            <TableHeader>
              <TableRow class="bg-muted/50">
                <TableHead class="w-[400px] pl-6">项目名称</TableHead>
                <TableHead class="text-right">上期金额</TableHead>
                <TableHead class="text-right pr-6">本期金额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow 
                v-for="row in profitData" 
                :key="row.id"
                class="cursor-pointer hover:bg-muted/30"
                @click="handleRowClick(row)"
              >
                <TableCell :style="{ paddingLeft: `${row.depth * 24 + 24}px` }">
                  <div class="flex items-center gap-2">
                    <button 
                      v-if="row.hasChildren" 
                      class="w-4 h-4 flex items-center justify-center"
                      @click.stop="toggleExpand(row.id)"
                    >
                      <ChevronDown v-if="row.isExpanded" class="h-4 w-4" />
                      <ChevronRight v-else class="h-4 w-4" />
                    </button>
                    <span v-else class="w-4"></span>
                    <span :class="{ 'font-semibold': row.level === 1 }">{{ row.name }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-right font-mono" :class="row.beginValue < 0 ? 'text-red-600' : 'text-muted-foreground'">
                  ¥ {{ formatNumber(row.beginValue) }}
                </TableCell>
                <TableCell class="text-right font-mono pr-6" :class="[row.level === 1 ? 'text-primary font-semibold' : 'text-muted-foreground', row.value < 0 ? 'text-red-600' : '']">
                  ¥ {{ formatNumber(row.value) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>

        <!-- 现金流量表 -->
        <TabsContent value="cash" class="flex-1 overflow-auto p-0 mt-0">
          <Table class="w-full">
            <TableHeader>
              <TableRow class="bg-muted/50">
                <TableHead class="w-[400px] pl-6">项目名称</TableHead>
                <TableHead class="text-right">上期金额</TableHead>
                <TableHead class="text-right pr-6">本期金额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow 
                v-for="row in cashData" 
                :key="row.id"
                class="cursor-pointer hover:bg-muted/30"
                @click="handleRowClick(row)"
              >
                <TableCell :style="{ paddingLeft: `${row.depth * 24 + 16}px` }">
                  <div class="flex items-center gap-2">
                    <button 
                      v-if="row.hasChildren" 
                      class="w-4 h-4 flex items-center justify-center"
                      @click.stop="toggleExpand(row.id)"
                    >
                      <ChevronDown v-if="row.isExpanded" class="h-4 w-4" />
                      <ChevronRight v-else class="h-4 w-4" />
                    </button>
                    <span v-else class="w-4"></span>
                    <span :class="{ 'font-semibold': row.level === 1 }">{{ row.name }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-right font-mono" :class="row.beginValue < 0 ? 'text-red-600' : 'text-muted-foreground'">
                  ¥ {{ formatNumber(row.beginValue) }}
                </TableCell>
                <TableCell class="text-right font-mono" :class="[row.level === 1 ? 'text-emerald-600 font-semibold' : 'text-muted-foreground', row.value < 0 ? 'text-red-600' : '']">
                  ¥ {{ formatNumber(row.value) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>

        <!-- 预算监控 -->
        <TabsContent value="budget" class="flex-1 overflow-auto p-6 mt-0">
          <!-- 状态栏 & 工具栏 -->
          <div class="flex justify-between items-center bg-muted/50 rounded-lg px-4 py-3 mb-6">
            <div class="flex items-center gap-3">
              <Badge class="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-normal">执行中</Badge>
              <span class="text-sm text-muted-foreground">版本: V2025-03-A</span>
            </div>
            <div class="flex items-center gap-2">
              <template v-if="!isBudgetEditing">
                <Button variant="outline" size="sm" class="h-8 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800" @click="isBudgetEditing = true">
                  <Pencil class="h-3.5 w-3.5 mr-1" /> 调整预算
                </Button>
              </template>
              <template v-else>
                <Button variant="ghost" size="sm" class="h-8" @click="isBudgetEditing = false">
                  取消
                </Button>
                <Button size="sm" class="h-8 bg-primary" @click="saveBudget">
                  <Save class="h-3.5 w-3.5 mr-1" /> 保存生效
                </Button>
              </template>
            </div>
          </div>

          <!-- 双列布局 -->
          <div class="grid grid-cols-2 gap-6">
            <!-- 阿米巴单元预算 -->
            <div class="border rounded-lg bg-card text-card-foreground shadow-sm">
              <div class="bg-muted/30 px-4 py-3 border-b font-semibold flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Users class="h-4 w-4 text-muted-foreground" />
                  阿米巴单元预算
                </div>
                <span class="text-xs text-muted-foreground font-normal">点击查看详情</span>
              </div>
              <div class="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>单元名称</TableHead>
                      <TableHead>预算执行情况</TableHead>
                      <TableHead class="text-right w-16">率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow 
                      v-for="row in amebaBudgetData" 
                      :key="row.id" 
                      class="hover:bg-muted/50 cursor-pointer"
                      @click="!isBudgetEditing && openAmebaDetail(row)"
                    >
                      <TableCell class="font-medium">{{ row.group }}</TableCell>
                      <TableCell>
                        <div class="space-y-1">
                          <div class="flex justify-between text-xs items-center h-5">
                            <span class="font-mono font-semibold">¥{{ formatNumber(row.actual) }}</span>
                            <!-- 编辑模式下显示输入框 -->
                            <div v-if="isBudgetEditing" @click.stop>
                              <Input 
                                type="number" 
                                v-model="row.budget" 
                                class="h-6 w-24 text-right font-mono text-xs px-1"
                              />
                            </div>
                            <span v-else class="text-muted-foreground font-mono">/ {{ formatNumber(row.budget) }}</span>
                          </div>
                          <Progress v-if="!isBudgetEditing" :model-value="Math.min(row.percent, 100)" class="h-1.5" :class="getProgressColor(row.percent)" />
                        </div>
                      </TableCell>
                      <TableCell class="text-right font-mono font-bold" :class="getProgressTextColor(row.percent)">
                        {{ row.percent }}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <!-- 财务科目预算 -->
            <div class="border rounded-lg bg-card text-card-foreground shadow-sm">
              <div class="bg-muted/30 px-4 py-3 border-b font-semibold flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Folders class="h-4 w-4 text-muted-foreground" />
                  财务科目预算
                </div>
                <span class="text-xs text-muted-foreground font-normal">点击查看详情</span>
              </div>
              <div class="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>科目名称</TableHead>
                      <TableHead>预算消耗趋势</TableHead>
                      <TableHead class="text-right w-16">率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow 
                      v-for="row in companyBudgetData" 
                      :key="row.id" 
                      class="hover:bg-muted/50 cursor-pointer"
                      @click="openSubjectDetail(row)"
                    >
                      <TableCell class="font-medium">{{ row.subject }}</TableCell>
                      <TableCell>
                        <div class="space-y-1">
                          <div class="flex justify-between text-xs items-center h-5">
                            <span class="font-mono font-semibold">¥{{ formatNumber(row.actual) }}</span>
                            <span class="text-muted-foreground font-mono">/ {{ formatNumber(row.budget) }}</span>
                          </div>
                          <Progress :model-value="Math.min(row.percent, 100)" class="h-1.5" :class="getProgressColor(row.percent)" />
                        </div>
                      </TableCell>
                      <TableCell class="text-right font-mono font-bold" :class="getProgressTextColor(row.percent)">
                        {{ row.percent }}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>

  <!-- 明细弹窗 (Balance/Profit/Cash) -->
  <Dialog v-model:open="detailDialogOpen">
    <DialogContent class="sm:max-w-[90vw] w-fit min-w-[800px] max-h-[85vh] overflow-hidden flex flex-col p-0">
      <DialogHeader class="px-6 py-4 border-b shrink-0">
        <DialogTitle>📄 {{ detailData?.name }} - 明细账簿</DialogTitle>
        <DialogDescription>查看科目的明细记录和账簿信息</DialogDescription>
      </DialogHeader>
      
      <div v-if="detailData" class="flex-1 overflow-y-auto p-6">
        <div class="bg-muted/30 border rounded-lg px-6 py-4 mb-6 flex justify-between items-center shadow-sm shrink-0">
          <div class="flex flex-col gap-1">
            <span class="text-sm text-muted-foreground">当前科目余额</span>
            <span class="text-xs text-muted-foreground">截至 {{ selectedYear }}-{{ selectedMonth === 'all' ? '12' : selectedMonth }}</span>
          </div>
          <div class="text-right">
            <span class="font-mono font-bold text-2xl tracking-tight">¥ {{ formatNumber(detailData.value) }}</span>
          </div>
        </div>

        <div class="rounded-md border overflow-x-auto relative">
          <Table>
            <TableHeader class="bg-muted/90 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead class="w-[120px]">日期</TableHead>
                <TableHead class="w-[120px]">凭证号</TableHead>
                <TableHead class="min-w-[200px]">摘要</TableHead>
                <TableHead class="w-[100px]">类型</TableHead>
                <TableHead class="text-right w-[150px]">借方</TableHead>
                <TableHead class="text-right w-[150px]">贷方</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="d in detailData.details" :key="d.id">
                <TableCell class="font-mono text-sm">{{ d.date }}</TableCell>
                <TableCell class="font-mono text-sm">{{ d.docNo }}</TableCell>
                <TableCell class="text-sm">{{ d.summary }}</TableCell>
                <TableCell>
                  <Badge :variant="d.type === '收款单' ? 'default' : 'secondary'" class="text-xs font-normal">
                    {{ d.type }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right font-mono">{{ d.debit > 0 ? formatNumber(d.debit) : '-' }}</TableCell>
                <TableCell class="text-right font-mono">{{ d.credit > 0 ? formatNumber(d.credit) : '-' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Modal: Ameba Details -->
  <Dialog v-model:open="amebaDetailVisible">
    <DialogContent class="sm:max-w-[700px] w-full p-0 overflow-hidden flex flex-col max-h-[80vh]">
      <DialogHeader class="px-6 py-4 border-b shrink-0">
        <DialogTitle class="flex items-center gap-2">
          <Users class="h-5 w-5 text-muted-foreground" />
          {{ selectedAmeba?.group }} - 预算执行详情
        </DialogTitle>
      </DialogHeader>
      <div class="flex-1 overflow-y-auto p-0">
        <Table>
          <TableHeader class="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead>费用科目</TableHead>
              <TableHead class="text-right">实际支出</TableHead>
              <TableHead class="w-[200px]">执行进度</TableHead>
              <TableHead class="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="row in amebaDetailData" 
              :key="row.id" 
              class="cursor-pointer hover:bg-muted/50"
              @click="openExpenseDetail(selectedAmeba?.group, row.subject)"
            >
              <TableCell>{{ row.subject }}</TableCell>
              <TableCell class="text-right font-mono font-bold">¥ {{ formatNumber(row.actual) }}</TableCell>
              <TableCell>
                <Progress :model-value="Math.min(row.percent, 100)" class="h-2" :class="getProgressColor(row.percent)" />
              </TableCell>
              <TableCell>
                <ChevronRight class="h-4 w-4 text-muted-foreground/50" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Modal: Subject Details -->
  <Dialog v-model:open="subjectDetailVisible">
    <DialogContent class="sm:max-w-[700px] w-full p-0 overflow-hidden flex flex-col max-h-[80vh]">
      <DialogHeader class="px-6 py-4 border-b shrink-0">
        <DialogTitle class="flex items-center gap-2">
          <Folders class="h-5 w-5 text-muted-foreground" />
          {{ selectedSubject?.subject }} - 部门消耗详情
        </DialogTitle>
      </DialogHeader>
      <div class="flex-1 overflow-y-auto p-0">
        <Table>
          <TableHeader class="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead>部门名称</TableHead>
              <TableHead class="text-right">实际支出</TableHead>
              <TableHead class="w-[200px]">执行进度</TableHead>
              <TableHead class="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="row in subjectDetailData" 
              :key="row.dept" 
              class="cursor-pointer hover:bg-muted/50"
              @click="openExpenseDetail(row.dept, selectedSubject?.subject)"
            >
              <TableCell>{{ row.dept }}</TableCell>
              <TableCell class="text-right font-mono font-bold">¥ {{ formatNumber(row.value) }}</TableCell>
              <TableCell>
                <Progress :model-value="Math.min(row.percent, 100)" class="h-2" :class="getProgressColor(row.percent)" />
              </TableCell>
              <TableCell>
                <ChevronRight class="h-4 w-4 text-muted-foreground/50" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Modal: Expense Details (Final Drilldown) -->
  <Dialog v-model:open="expenseDetailVisible">
    <DialogContent class="sm:max-w-[700px] w-full p-0 overflow-hidden flex flex-col max-h-[80vh]">
      <DialogHeader class="px-6 py-4 border-b shrink-0">
        <DialogTitle>📄 {{ expenseDetailTitle }}</DialogTitle>
      </DialogHeader>
      <div class="flex-1 overflow-y-auto p-0">
        <Table>
          <TableHeader class="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>摘要</TableHead>
              <TableHead>报销人</TableHead>
              <TableHead class="text-right">金额</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in expenseDetailData" :key="row.id" class="hover:bg-muted/30">
              <TableCell class="font-mono text-sm">{{ row.date }}</TableCell>
              <TableCell class="text-sm">{{ row.desc }}</TableCell>
              <TableCell>{{ row.user }}</TableCell>
              <TableCell class="text-right font-mono">¥ {{ formatNumber(row.amount) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Progress 条颜色覆盖 */
:deep(.bg-red-500 [data-slot="progress-indicator"]) {
  background-color: rgb(239 68 68);
}
:deep(.bg-amber-500 [data-slot="progress-indicator"]) {
  background-color: rgb(245 158 11);
}
:deep(.bg-emerald-500 [data-slot="progress-indicator"]) {
  background-color: rgb(16 185 129);
}
</style>
