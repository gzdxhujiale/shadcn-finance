<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { 
  PieChart, 
  Layers, 
  Banknote, 
  LayoutGrid, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  TrendingUp, 
  TrendingDown,
  User,
  Calendar,
  Wallet
} from 'lucide-vue-next';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import DateRangeFilter from '@/components/shared/DateRangeFilter.vue'

// UI Components
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigation } from '@/composables/useNavigation.js';

// ================= 0. 导航控制 =================
const { setDetailTitle, detailTitle } = useNavigation();

// 监听面包屑导航返回
watch(detailTitle, (newVal) => {
  if (!newVal && selectedAmeba.value) {
    handleGoBack();
  }
});

// ================= 1. 核心数据定义 (Mock) =================
const EXTRACTED_OPS_DATA = [
  { name: '运营部-淘宝', income: 7200000, profit: 1200000, manager: '张三' },
  { name: '运营部-抖音', income: 7600000, profit: 1350000, manager: '李四' },
  { name: '运营部-快手', income: 6800000, profit: 1050000, manager: '王五' }
];

const COST_CENTERS = [
  { name: '商品部', income: 450000, profit: -50000, manager: '赵六' },
  { name: '开发部', income: 0, profit: -800000, manager: '钱七' },
  { name: '产研部', income: 0, profit: -1200000, manager: '孙八' },
  { name: '客服部', income: 0, profit: -300000, manager: '周九' },
  { name: '仓储部', income: 200000, profit: -150000, manager: '吴十' },
  { name: '人事部', income: 0, profit: -250000, manager: '郑十一' },
  { name: '财务部', income: 0, profit: -200000, manager: '卫十二' },
];

// ================= 2. 状态管理 =================
const dateRange = ref({
  start: new CalendarDate(2025, 1, 1),
  end: new CalendarDate(2025, 12, 31)
})
const selectedAmeba = ref(null);
const currentRole = ref('admin'); 
const activeTab = ref('statement'); // 详情页 Tab 状态: statement | trend | structure
const detailModalItem = ref(null);
const modalVisible = ref(false);

// 日期筛选应用回调
const onDateRangeApply = (range) => {
  dateRange.value = range
  console.log('日期范围已更新:', range)
}

// 图表 DOM 引用
const trendChartRef = ref(null);
const pieChartRef = ref(null);
let trendChartInstance = null;
let pieChartInstance = null;

// ================= 3. 计算属性与逻辑 =================
const isSensitiveHidden = computed(() => currentRole.value === 'operation');

const periodLabel = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return '全年'
  const startMonth = dateRange.value.start.month
  const endMonth = dateRange.value.end.month
  if (startMonth === 1 && endMonth === 12) return `${dateRange.value.start.year}年 全年`
  return `${dateRange.value.start.year}年 ${startMonth}月-${endMonth}月`
});

// 工具函数：数字格式化
const safeLocaleString = (val) => (val !== undefined && val !== null) ? val.toLocaleString() : '0';

// 主列表数据计算
const currentAmebaData = computed(() => {
  // 根据日期范围计算比例因子
  let factor = 1
  if (dateRange.value.start && dateRange.value.end) {
    const startMonth = dateRange.value.start.month
    const endMonth = dateRange.value.end.month
    const monthsDiff = endMonth - startMonth + 1
    factor = monthsDiff / 12
  }
  const allDepts = [...EXTRACTED_OPS_DATA, ...COST_CENTERS];

  return allDepts.map((dept, index) => {
    let income = Math.floor(dept.income * factor);
    let directCost, allocatedCost;
    if (dept.name.includes('运营')) {
      directCost = Math.floor(income * 0.75); 
      allocatedCost = Math.floor(income * 0.08);
    } else {
      const baseLoss = Math.abs(dept.profit * factor);
      directCost = Math.floor(baseLoss * 0.7);
      allocatedCost = Math.floor(baseLoss * 0.3);
    }
    const totalCost = directCost + allocatedCost;
    const profit = income - totalCost;

    return {
      id: index + 1,
      group: dept.name,
      manager: dept.manager,
      income,
      directCost,
      allocatedCost,
      totalCost,
      profit,
      ratio: income > 0 ? (profit / income * 100).toFixed(1) + '%' : '0%',
    };
  }).sort((a, b) => b.profit - a.profit);
});

// 全局 KPI
const totalProfit = computed(() => currentAmebaData.value.reduce((acc, curr) => acc + curr.profit, 0));
const totalRevenue = computed(() => currentAmebaData.value.reduce((acc, curr) => acc + curr.income, 0));
const totalCost = computed(() => currentAmebaData.value.reduce((acc, curr) => acc + curr.totalCost, 0));
const avgRatio = computed(() => {
  const count = currentAmebaData.value.filter(d => d.income > 0).length;
  if (count === 0) return 0;
  const totalR = currentAmebaData.value.reduce((acc, curr) => acc + (curr.income > 0 ? parseFloat(curr.ratio) : 0), 0);
  return parseFloat((totalR / count).toFixed(1));
});

// KPI 卡片配置
const metricCards = computed(() => [
  { 
    key: 'units', 
    title: '核算单元总数', 
    value: currentAmebaData.value.length + ' 个', 
    icon: Layers, 
    bgClass: 'bg-white', 
    textClass: 'text-gray-600', 
    iconClass: 'text-blue-600 bg-blue-50' 
  },
  { 
    key: 'revenue', 
    title: '总收入', 
    value: isSensitiveHidden.value ? '***' : `¥ ${safeLocaleString(totalRevenue.value)}`, 
    icon: TrendingUp, 
    bgClass: 'bg-white', 
    textClass: 'text-gray-600', 
    iconClass: 'text-blue-600 bg-blue-50' 
  },
  { 
    key: 'cost', 
    title: '总成本', 
    value: isSensitiveHidden.value ? '***' : `¥ ${safeLocaleString(totalCost.value)}`, 
    icon: TrendingDown, 
    bgClass: 'bg-white', 
    textClass: 'text-gray-600', 
    iconClass: 'text-red-500 bg-red-50' 
  },
  { 
    key: 'profit', 
    title: '累计核算利润', 
    value: isSensitiveHidden.value ? '***' : `¥ ${safeLocaleString(totalProfit.value)}`, 
    icon: Banknote, 
    bgClass: 'bg-white', 
    textClass: 'text-gray-600', 
    iconClass: 'text-emerald-600 bg-emerald-50' 
  },
  { 
    key: 'ratio', 
    title: '平均利润率', 
    value: isSensitiveHidden.value ? '***' : `${avgRatio.value}%`, 
    icon: LayoutGrid, 
    bgClass: 'bg-white', 
    textClass: 'text-gray-600', 
    iconClass: 'text-orange-600 bg-orange-50' 
  }
]);

// 详情页数据 Mock
const detailData = computed(() => {
  if (!selectedAmeba.value) return null;
  const item = selectedAmeba.value;
  
  // 根据日期范围计算因子
  let monthsCount = 12
  if (dateRange.value.start && dateRange.value.end) {
    const startMonth = dateRange.value.start.month
    const endMonth = dateRange.value.end.month
    monthsCount = endMonth - startMonth + 1
  }
  
  // 模拟月度趋势
  const trend = Array.from({ length: 12 }, (_, i) => {
    const baseIncome = item.income / (monthsCount === 12 ? 1 : 12);
    const mIncome = Math.floor((baseIncome / 12) * (0.8 + Math.random() * 0.4));
    const mCost = Math.floor(mIncome * 0.85);
    return { 
      month: `${i + 1}月`, 
      income: mIncome, 
      cost: mCost, 
      profit: mIncome - mCost 
    };
  });

  // 模拟成本结构
  const costStructure = [
    { name: '人力成本', value: 40, itemStyle: { color: '#165DFF' } }, 
    { name: '营销推广', value: 30, itemStyle: { color: '#00B42A' } }, 
    { name: '办公分摊', value: 15, itemStyle: { color: '#FF7D00' } }, 
    { name: '其他杂项', value: 15, itemStyle: { color: '#86909C' } }
  ];

  // 模拟 P&L 树形表格数据
  const budgetFactor = 1.05; 
  const lastYearFactor = 0.9; 

  const createRow = (key, name, value, isGroup = false, children = null) => {
    const budget = Math.floor(value * budgetFactor);
    const lastYear = Math.floor(value * lastYearFactor);
    return {
      key,
      name,
      value,
      budget,
      lastYear,
      diff: value - budget, 
      yoy: ((value - lastYear) / lastYear * 100).toFixed(1),
      isGroup,
      children
    };
  };

  const incomeRow = createRow('1', '一、经营收入', item.income, true);
  
  const costChildren = [
    createRow('2-1', '人力成本', Math.floor(item.directCost * 0.6)),
    createRow('2-2', '业务费用', Math.floor(item.directCost * 0.3)),
    createRow('2-3', '其他直接支出', Math.floor(item.directCost * 0.1)),
  ];
  const costRow = createRow('2', '二、可控成本', item.directCost, true, costChildren);
  
  const marginRow = createRow('3', '三、边际贡献', item.income - item.directCost, true); 
  
  const allocatedRow = createRow('4', '四、分摊/交易成本', item.allocatedCost, true);
  
  const profitRow = createRow('5', '五、核算利润', item.profit, true); 

  // 平铺 P&L 数据用于表格显示 (简单展开)
  const flattenPnl = [
    incomeRow,
    costRow,
    ...costChildren.map(c => ({...c, isChild: true})),
    marginRow,
    allocatedRow,
    profitRow
  ];

  return { 
    trend, 
    costStructure, 
    pnlTable: flattenPnl 
  };
});

const modalTableData = computed(() => {
  if (!detailModalItem.value) return [];
  const total = detailModalItem.value.value;
  const name = detailModalItem.value.name;
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    date: `2025-10-${10 + i}`,
    desc: `${name} - 专项业务明细 #${1001 + i}`,
    type: name.includes('收入') ? '入账' : '支出',
    user: ['张三', '李四', '王五'][i % 3],
    amount: Math.floor(total / 10 * (0.8 + Math.random() * 0.4))
  }));
});

// ================= 5. ECharts 渲染逻辑 =================
const renderCharts = () => {
  if (!detailData.value) return;

  // 使用 setTimeout 确保 Tab 切换后 DOM 渲染完毕
  setTimeout(() => {
    // 1. 趋势图
    if (trendChartRef.value) {
      if (trendChartInstance) {
         try { trendChartInstance.dispose(); } catch(e) {}
         trendChartInstance = null;
      }
      trendChartInstance = echarts.init(trendChartRef.value);
      
      const xData = detailData.value.trend.map(d => d.month);
      const incomeData = detailData.value.trend.map(d => d.income);
      const costData = detailData.value.trend.map(d => d.cost);
      const profitData = detailData.value.trend.map(d => d.profit);

      const option = {
        title: { text: '月度经营趋势', left: 'center' },
        tooltip: { trigger: 'axis' },
        legend: { data: ['收入', '成本', '利润'], bottom: 0 },
        grid: { top: 40, left: 10, right: 10, bottom: 30, containLabel: true },
        xAxis: { type: 'category', data: xData },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
        series: [
          { name: '收入', type: 'line', data: incomeData, smooth: true, itemStyle: { color: '#165DFF' }, lineStyle: { width: 3 } },
          !isSensitiveHidden.value ? { name: '成本', type: 'line', data: costData, smooth: true, itemStyle: { color: '#F53F3F' }, lineStyle: { type: 'dashed' } } : null,
          !isSensitiveHidden.value ? { name: '利润', type: 'bar', data: profitData, itemStyle: { color: '#00B42A' }, barWidth: 12, itemStyle: { borderRadius: [4, 4, 0, 0] } } : null
        ].filter(Boolean)
      };
      trendChartInstance.setOption(option);
    }

    // 2. 饼图
    if (pieChartRef.value) {
      if (pieChartInstance) {
        try { pieChartInstance.dispose(); } catch(e) {}
        pieChartInstance = null;
      }
      pieChartInstance = echarts.init(pieChartRef.value);
      
      const optionPie = {
        title: { text: '成本结构分布', left: 'center' },
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left', bottom: 10 },
        series: [
          {
            name: '成本结构',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            labelLine: { show: false },
            data: detailData.value.costStructure
          }
        ]
      };
      pieChartInstance.setOption(optionPie);
    }
  }, 100);
};

// ================= 6. 事件处理 =================
const viewDetail = (record) => {
  selectedAmeba.value = record;
  activeTab.value = 'statement';
  setDetailTitle(record.group); // 设置三级面包屑
};

const handleGoBack = () => {
  selectedAmeba.value = null;
  
  if (detailTitle.value) setDetailTitle(null); 
  
  if (trendChartInstance) {
    try { trendChartInstance.dispose(); } catch(e) {}
    trendChartInstance = null;
  }
  if (pieChartInstance) {
    try { pieChartInstance.dispose(); } catch(e) {}
    pieChartInstance = null;
  }
};

const openDetailModal = (item) => {
  detailModalItem.value = item;
  modalVisible.value = true;
};

// 监听 Tab 切换，渲染图表
const handleTabChange = (key) => {
  activeTab.value = key;
  if (key === 'trend' || key === 'structure') {
    nextTick(() => renderCharts());
  }
};

const handleResize = () => {
  if (trendChartInstance && !trendChartInstance.isDisposed()) {
    trendChartInstance.resize();
  }
  if (pieChartInstance && !pieChartInstance.isDisposed()) {
    pieChartInstance.resize();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (trendChartInstance) {
    try { trendChartInstance.dispose(); } catch(e) {}
    trendChartInstance = null;
  }
  if (pieChartInstance) {
    try { pieChartInstance.dispose(); } catch(e) {}
    pieChartInstance = null;
  }
});
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden bg-background">
    <Teleport to="#breadcrumb-actions" defer>
      <DateRangeFilter 
        v-model="dateRange" 
        @apply="onDateRangeApply" 
      />
    </Teleport>

    <!-- 1. 列表视图 -->
    <div v-if="!selectedAmeba" class="h-full p-6 overflow-auto space-y-4">
      
      <!-- KPI 卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          v-for="metric in metricCards" 
          :key="metric.key" 
          class="hover:shadow-md transition-all duration-200 hover:border-primary/50 group relative bg-card"
        >
          <div class="p-4 flex flex-col gap-1">
            <div class="flex flex-row items-center justify-between">
              <span class="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                {{ metric.title }}
              </span>
              <component :is="metric.icon" class="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div class="text-2xl font-bold truncate" :class="metric.iconClass ? metric.iconClass.split(' ')[0] : ''">
               {{ metric.value }}
            </div>
          </div>
        </Card>
      </div>

      <!-- 主数据表格 -->
      <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow class="bg-muted/50 hover:bg-muted/50">
                <TableHead class="w-[200px]">阿米巴单元</TableHead>
                <TableHead class="text-right">总收入</TableHead>
                <TableHead class="text-right">可控成本</TableHead>
                <TableHead class="text-right">分摊成本</TableHead>
                <TableHead class="text-right">核算利润</TableHead>
                <TableHead class="text-right">利润率</TableHead>
                <TableHead class="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="record in currentAmebaData" :key="record.id" @click="viewDetail(record)" class="cursor-pointer group hover:bg-muted/50">
                <TableCell>
                  <span class="font-medium text-foreground group-hover:text-blue-600 transition-colors">{{ record.group }}</span>
                </TableCell>
                <TableCell class="text-right font-mono">
                  ¥ {{ safeLocaleString(record.income) }}
                </TableCell>
                <TableCell class="text-right font-mono text-muted-foreground">
                  ¥ {{ safeLocaleString(record.directCost) }}
                </TableCell>
                <TableCell class="text-right">
                   <span v-if="isSensitiveHidden" class="text-muted-foreground">***</span>
                   <span v-else class="font-mono text-muted-foreground">{{ safeLocaleString(record.allocatedCost) }}</span>
                </TableCell>
                <TableCell class="text-right">
                   <span v-if="isSensitiveHidden" class="text-muted-foreground">***</span>
                   <span v-else class="font-mono font-bold" :class="record.profit >= 0 ? 'text-foreground' : 'text-red-500'">
                      ¥ {{ safeLocaleString(record.profit) }}
                    </span>
                </TableCell>
                <TableCell class="text-right">
                    <span v-if="isSensitiveHidden" class="text-muted-foreground">***</span>
                    <span v-else :class="{
                      'text-emerald-600': parseFloat(record.ratio) > 20,
                      'text-orange-500': parseFloat(record.ratio) > 0 && parseFloat(record.ratio) <= 20,
                      'text-red-500': parseFloat(record.ratio) <= 0
                    }" class="font-medium">
                      {{ record.ratio }}
                    </span>
                </TableCell>
                <TableCell class="text-center">
                   <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                     <ChevronRight class="w-4 h-4" />
                   </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
      </div>
    </div>

    <!-- 2. 详情视图 -->
    <div v-else class="h-full flex flex-col overflow-hidden">
       <!-- 详情页头部 -->
       <!-- 详情页头部 (优化版) -->
       <div class="px-6 py-4 border-b bg-card/50 backdrop-blur-sm shrink-0 z-10 relative overflow-hidden group">
          <!-- 背景装饰 -->
          <div class="absolute top-0 right-0 p-4 -mr-4 -mt-4 opacity-[0.03] pointer-events-none">
              <Layers class="w-32 h-32" />
          </div>

          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                 <Layers class="w-5 h-5" />
              </div>
              <div class="space-y-1">
                 <div class="flex items-center gap-3">
                    <h2 class="text-lg font-bold tracking-tight">{{ selectedAmeba.group }}</h2>
                    <Badge variant="secondary" class="h-5 px-2 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">
                      已结账
                    </Badge>
                 </div>
                 <div class="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                    <div class="flex items-center gap-1.5 hover:text-foreground transition-colors">
                       <User class="w-3.5 h-3.5" />
                       <span class="truncate max-w-[100px]">{{ selectedAmeba.manager }}</span>
                    </div>
                    <span class="w-px h-3 bg-border"></span>
                    <div class="flex items-center gap-1.5 hover:text-foreground transition-colors">
                       <Calendar class="w-3.5 h-3.5" />
                       <span>{{ periodLabel }}</span>
                    </div>
                    <span class="w-px h-3 bg-border"></span>
                    <div class="flex items-center gap-1.5 hover:text-foreground transition-colors">
                       <Wallet class="w-3.5 h-3.5" />
                       <span>CNY</span>
                    </div>
                 </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
               <div class="hidden lg:flex flex-col items-end mr-2 text-xs text-muted-foreground">
                  <span>最后更新</span>
                  <span class="font-mono">{{ new Date().toLocaleDateString() }}</span>
               </div>
               <Button variant="outline" size="sm" class="h-8 text-xs gap-1.5 bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
                  <Download class="w-3.5 h-3.5" /> 导出报表
               </Button>
            </div>
          </div>
       </div>

       <!-- 详情内容区 Tab -->
       <div class="flex-1 min-h-0 overflow-hidden p-6 bg-muted/20">
          <Tabs v-model="activeTab" class="h-full flex flex-col" @update:modelValue="handleTabChange">
             <TabsList class="w-fit mb-4">
                <TabsTrigger value="statement">经营损益表 (P&L)</TabsTrigger>
                <TabsTrigger value="trend">经营趋势分析</TabsTrigger>
                <TabsTrigger value="structure">成本结构分析</TabsTrigger>
             </TabsList>

             <div class="flex-1 min-h-0 overflow-hidden bg-background rounded-lg border shadow-sm">
                <!-- Tab 1: P&L Table -->
                <TabsContent value="statement" class="h-full mt-0 overflow-auto data-[state=active]:flex data-[state=active]:flex-col">
                   <Table>
                      <TableHeader class="sticky top-0 bg-background z-10">
                         <TableRow>
                            <TableHead class="w-[300px]">核算科目</TableHead>
                            <TableHead class="text-right">本期实际</TableHead>
                            <TableHead class="text-right">本期预算</TableHead>
                            <TableHead class="text-right">预算差异</TableHead>
                            <TableHead class="text-right">去年同期</TableHead>
                            <TableHead class="text-right w-[120px]">同比增长</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         <TableRow 
                            v-for="row in detailData.pnlTable" 
                            :key="row.key"
                            class="hover:bg-muted/50"
                            :class="{'bg-muted/10': row.isGroup}"
                            @click="!row.isGroup && openDetailModal(row)"
                         >
                            <TableCell>
                               <div :class="{'font-bold text-foreground': row.isGroup, 'pl-6 text-muted-foreground': row.isChild}">
                                  {{ row.name }}
                               </div>
                            </TableCell>
                            <TableCell class="text-right font-mono">
                               <span :class="{'font-bold': row.isGroup}">¥ {{ safeLocaleString(row.value) }}</span>
                            </TableCell>
                            <TableCell class="text-right font-mono text-muted-foreground">
                               ¥ {{ safeLocaleString(row.budget) }}
                            </TableCell>
                            <TableCell class="text-right font-mono">
                               <span :class="row.diff >= 0 ? 'text-emerald-600' : 'text-red-500'">
                                  {{ row.diff >= 0 ? '+' : '' }}{{ safeLocaleString(row.diff) }}
                               </span>
                            </TableCell>
                            <TableCell class="text-right font-mono text-muted-foreground">
                               ¥ {{ safeLocaleString(row.lastYear) }}
                            </TableCell>
                            <TableCell class="text-right font-mono">
                               <div class="flex items-center justify-end gap-1" :class="parseFloat(row.yoy) >= 0 ? 'text-red-500' : 'text-emerald-600'">
                                  {{ row.yoy }}%
                                  <TrendingUp v-if="parseFloat(row.yoy) >= 0" class="w-3 h-3" />
                                  <TrendingDown v-else class="w-3 h-3" />
                               </div>
                            </TableCell>
                         </TableRow>
                      </TableBody>
                   </Table>
                </TabsContent>

                <!-- Tab 2: Trend Chart -->
                <TabsContent value="trend" class="h-full mt-0 p-6 data-[state=active]:flex data-[state=active]:flex-col">
                   <div ref="trendChartRef" class="w-full flex-1 min-h-[400px]"></div>
                </TabsContent>

                <!-- Tab 3: Structure Chart -->
                <TabsContent value="structure" class="h-full mt-0 p-6 data-[state=active]:flex data-[state=active]:items-center data-[state=active]:justify-center">
                   <div ref="pieChartRef" class="w-[80%] h-full min-h-[400px]"></div>
                </TabsContent>
             </div>
          </Tabs>
       </div>
    </div>

    <!-- 3. 三级明细弹窗 (Modal) -->
    <Dialog v-model:open="modalVisible">
      <DialogContent class="max-w-[700px]">
        <DialogHeader>
           <DialogTitle>{{ detailModalItem?.name }}</DialogTitle>
           <DialogDescription>科目流水明细查询</DialogDescription>
        </DialogHeader>
        
        <div class="border rounded-md">
           <Table>
              <TableHeader>
                 <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>摘要</TableHead>
                    <TableHead>经办人</TableHead>
                    <TableHead class="text-right">金额</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 <TableRow v-for="item in modalTableData" :key="item.id">
                    <TableCell class="font-mono">{{ item.date }}</TableCell>
                    <TableCell>{{ item.desc }}</TableCell>
                    <TableCell>
                       <Badge variant="outline" class="font-normal">{{ item.user }}</Badge>
                    </TableCell>
                    <TableCell class="text-right font-mono">
                       <span :class="item.type==='入账' ? 'text-emerald-600' : 'text-foreground'">
                          {{ item.type==='入账' ? '+' : '-' }} ¥ {{ safeLocaleString(item.amount) }}
                       </span>
                    </TableCell>
                 </TableRow>
              </TableBody>
           </Table>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
