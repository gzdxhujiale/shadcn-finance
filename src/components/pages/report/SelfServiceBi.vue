<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { 
  Calendar, User, LayoutGrid, FileText, 
  BarChart, ListOrdered, Settings,
  GripVertical, X, RefreshCw,
  ChevronDown, Download, Trash2, Check
} from 'lucide-vue-next'
import * as echarts from 'echarts'

// Dependencies
import * as aq from 'arquero'
import { createGrid, ModuleRegistry, AllCommunityModule } from 'ag-grid-community'

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule])

// Data
import { ECOMMERCE_DATA } from './ecommerce_data.js'

// Store
import { useBiStore } from '@/stores/biStore.js'
import { storeToRefs } from 'pinia'

const biStore = useBiStore()
const { 
  state, 
  activeFilters, 
  expandedFilters,
  rawData,
  dimensions,
  measures,
  chartTypes
} = storeToRefs(biStore)

const { 
  dateAggOptions, // Get constant directly from store
  initFilter, 
  removeFilter, 
  updateDateAggregation,
  toggleFilterDropdown, 
  toggleOption, 
  toggleSelectAll, 
  updateMeasureFilter,
  initializeDataSource,
  aggregateData,
  exportToCSV
} = biStore

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

// Initialize Data Source
const DIMENSIONS_CONFIG = [
  { key: '日期', type: 'date', icon: Calendar, allowAgg: true },
  { key: '客户', type: 'string', icon: User },
  { key: '平台', type: 'string', icon: LayoutGrid },
  { key: '店铺名称', type: 'string', icon: FileText }
]

const MEASURES_CONFIG = [
  { key: 'GMV', type: 'number', icon: BarChart },
  { key: '订单数', type: 'number', icon: ListOrdered },
  { key: '销售件数', type: 'number', icon: BarChart },
  { key: '退款金额', type: 'number', icon: BarChart },
  { key: '退款件数', type: 'number', icon: ListOrdered },
  { key: '支付用户数', type: 'number', icon: User },
  { key: '访客数', type: 'number', icon: User },
  { key: '浏览量', type: 'number', icon: BarChart },
  { key: '加购次数', type: 'number', icon: ListOrdered },
  { key: '收藏次数', type: 'number', icon: ListOrdered },
  { key: '商品成本', type: 'number', icon: BarChart },
  { key: '广告费', type: 'number', icon: BarChart },
  { key: '平台费用', type: 'number', icon: BarChart },
  { key: '运费', type: 'number', icon: BarChart },
  { key: '其他费用', type: 'number', icon: BarChart },
  { key: '毛利率', type: 'number', icon: BarChart },
  { key: '净利率', type: 'number', icon: BarChart },
  { key: '退货率', type: 'number', icon: BarChart },
  { key: 'ROI', type: 'number', icon: BarChart },
  { key: '客单价', type: 'number', icon: BarChart }
]

initializeDataSource(ECOMMERCE_DATA, DIMENSIONS_CONFIG, MEASURES_CONFIG)

const safeState = computed(() => state.value || {
  cols: [], rows: [], filters: {}, chartType: 'table', colorPalette: 'default'
})

// DOM Refs
const vizContainer = ref(null)
let chartInstance = null
let gridApi = null
let currentChartType = null

// Dnd State
const draggedField = ref(null)

const exportData = () => {
    const allDims = [...safeState.value.cols, ...safeState.value.rows].filter(f => f.fieldType === 'dim')
    const metrics = [...safeState.value.cols, ...safeState.value.rows].filter(f => f.fieldType === 'measure')
    if (allDims.length === 0 && metrics.length === 0) {
      alert('请先配置维度和度量')
      return
    }
    const aggregatedData = aggregateData(aq, allDims, metrics)
    exportToCSV(aggregatedData, allDims, metrics)
}

// Rendering Logic (Ported)
const renderEChart = (container, aggregatedData, metrics, chartType) => {
    if (metrics.length === 0) return
    const { keys, groups } = aggregatedData
    const needRecreate = !chartInstance || currentChartType !== chartType
    
    if (needRecreate) {
      if (chartInstance) { chartInstance.dispose(); chartInstance = null }
      // 清空容器
      container.innerHTML = ''
      const chartDiv = document.createElement('div')
      chartDiv.style.width = '100%'
      chartDiv.style.height = '100%'
      chartDiv.style.minHeight = '400px'
      container.appendChild(chartDiv)
      chartInstance = echarts.init(chartDiv)
      currentChartType = chartType
    }
    
    // 确定图表类型
    const getSeriesType = () => {
      if (chartType === 'bar') return 'bar'
      return 'line' // line 和 area 都使用 line 类型，area 通过 areaStyle 区分
    }
    
    const isBar = chartType === 'bar'
    const seriesData = metrics.map(m => ({
      name: m.key,
      type: getSeriesType(),
      data: keys.map(k => groups[k].values[m.key]),
      smooth: !isBar,
      areaStyle: chartType === 'area' ? { opacity: 0.5 } : undefined,
      emphasis: { focus: 'series' }
    }))
    
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: isBar ? 'shadow' : 'line' } },
      legend: { data: metrics.map(m => m.key), bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: 20, containLabel: true },
      xAxis: { type: 'category', data: keys, boundaryGap: isBar, axisLabel: { interval: 0, rotate: keys.length > 8 ? 30 : 0 } },
      yAxis: { type: 'value' },
      series: seriesData,
      animationDuration: needRecreate ? 500 : 300
    }
    chartInstance.setOption(option, { notMerge: needRecreate })
}

const renderAgGrid = (container, aggregatedData, allDims, metrics) => {
    if (gridApi) { gridApi.destroy(); gridApi = null }
    if (chartInstance) { chartInstance.dispose(); chartInstance = null }
    
    const { keys, groups } = aggregatedData
    const colDims = safeState.value.cols.filter(f => f.fieldType === 'dim')
    const rowDims = safeState.value.rows.filter(f => f.fieldType === 'dim')
    
    const gridDiv = document.createElement('div')
    // gridDiv.className = 'ag-theme-alpine' // Removed for v33+ Theming API
    gridDiv.style.width = '100%'
    gridDiv.style.height = '100%'
    container.appendChild(gridDiv)

    if (colDims.length === 0) {
       const columnDefs = [
        ...allDims.map(d => ({ headerName: d.key, field: d.key, pinned: 'left', width: 100 })),
        ...metrics.map(m => ({ headerName: m.key, field: m.key, type: 'numericColumn', valueFormatter: p => p.value ? Math.round(p.value).toLocaleString() : '' }))
       ]
       const rowData = keys.map(k => {
         const row = {}
         allDims.forEach(d => row[d.key] = groups[k].meta[d.key])
         metrics.forEach(m => row[m.key] = groups[k].values[m.key])
         return row
       })
       gridApi = createGrid(gridDiv, { columnDefs, rowData, defaultColDef: { flex: 1, minWidth: 100, sortable: true, resizable: true } })
       return
    }

    // Pivot logic
    const colValues = new Set()
    const rowGroups = {}
    Object.keys(groups).forEach(key => {
        const meta = groups[key].meta
        const colKey = colDims.map(d => meta[d.key]).join(' / ')
        const rowKey = rowDims.length > 0 ? rowDims.map(d => meta[d.key]).join(' / ') : '总计'
        colValues.add(colKey)
        if (!rowGroups[rowKey]) {
            rowGroups[rowKey] = { meta: {}, cols: {} }
            rowDims.forEach(d => rowGroups[rowKey].meta[d.key] = meta[d.key])
        }
        rowGroups[rowKey].cols[colKey] = groups[key].values
    })

    const sortedColValues = Array.from(colValues).sort()
    const sortedRowKeys = Object.keys(rowGroups).sort()
    
    const columnDefs = rowDims.map(d => ({ headerName: d.key, field: d.key, pinned: 'left', width: 100 }))
    sortedColValues.forEach(cv => {
        if (metrics.length === 1) {
            columnDefs.push({ 
                headerName: cv, field: `${cv}_${metrics[0].key}`, 
                type: 'numericColumn', 
                valueFormatter: p => p.value ? Math.round(p.value).toLocaleString() : '' 
            })
        } else {
            columnDefs.push({
                headerName: cv,
                children: metrics.map(m => ({
                    headerName: m.key, field: `${cv}_${m.key}`, 
                    type: 'numericColumn', 
                    valueFormatter: p => p.value ? Math.round(p.value).toLocaleString() : ''
                }))
            })
        }
    })

    const rowData = sortedRowKeys.map(rowKey => {
        const row = {}
        rowDims.forEach(d => row[d.key] = rowGroups[rowKey].meta[d.key])
        sortedColValues.forEach(colKey => {
            const colData = rowGroups[rowKey].cols[colKey] || {}
            metrics.forEach(m => row[`${colKey}_${m.key}`] = colData[m.key] || 0)
        })
        return row
    })
    
    gridApi = createGrid(gridDiv, { columnDefs, rowData, defaultColDef: { minWidth: 80, sortable: true, resizable: true } })
}

const renderViz = () => {
    if (!vizContainer.value) return
    const allDims = [...safeState.value.cols, ...safeState.value.rows].filter(f => f.fieldType === 'dim')
    const metrics = [...safeState.value.cols, ...safeState.value.rows].filter(f => f.fieldType === 'measure')
    
    if (allDims.length === 0 && metrics.length === 0) {
        if (chartInstance) { chartInstance.dispose(); chartInstance = null; currentChartType = null }
        if (gridApi) { gridApi.destroy(); gridApi = null }
        vizContainer.value.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-muted-foreground"><p>请将维度和度量拖拽到行/列架</p></div>`
        return
    }

    const isTable = safeState.value.chartType === 'table'
    
    // 切换到表格时：清理图表实例
    if (isTable && chartInstance) {
        chartInstance.dispose()
        chartInstance = null
        currentChartType = null
        vizContainer.value.innerHTML = ''
    }
    
    // 切换到图表时：清理表格实例
    if (!isTable && gridApi) {
        gridApi.destroy()
        gridApi = null
        vizContainer.value.innerHTML = ''
    }
    
    const aggregatedData = aggregateData(aq, allDims, metrics)
    
    if (isTable) {
        // 表格模式每次都重新创建
        vizContainer.value.innerHTML = ''
        renderAgGrid(vizContainer.value, aggregatedData, allDims, metrics)
    } else {
        // 图表模式：复用或创建实例
        renderEChart(vizContainer.value, aggregatedData, metrics, safeState.value.chartType)
    }
}

const handleDragStart = (field, type) => {
    draggedField.value = { ...field, fieldType: type }
}

const handleDrop = (targetShelf) => {
    if (!draggedField.value) return
    const field = { ...draggedField.value, uid: Date.now(), dateAgg: draggedField.value.key === '日期' ? 'month' : undefined }
    if (targetShelf === 'cols') state.value.cols.push(field)
    if (targetShelf === 'rows') state.value.rows.push(field)
    initFilter(field.key, field, rawData.value)
    draggedField.value = null
}

const removeField = (shelf, index) => {
    let removedField = null
    if (shelf === 'cols') { removedField = state.value.cols[index]; state.value.cols.splice(index, 1) }
    if (shelf === 'rows') { removedField = state.value.rows[index]; state.value.rows.splice(index, 1) }
    if (removedField) {
        const stillInUse = [...state.value.cols, ...state.value.rows].some(f => f.key === removedField.key)
        if (!stillInUse) removeFilter(removedField.key)
    }
}

const handleDateAggChange = (field, newAgg) => {
    field.dateAgg = newAgg
    if (field.key === '日期') updateDateAggregation('日期', newAgg, rawData.value)
}

watch(state, () => { renderViz() }, { deep: true })

onMounted(() => {
    const defaultCols = [{ key: '日期', fieldType: 'dim', uid: Date.now() + 1, dateAgg: 'month' }]
    const defaultRows = [
        { key: '客户', fieldType: 'dim', uid: Date.now() + 2 },
        { key: '平台', fieldType: 'dim', uid: Date.now() + 3 },
        { key: 'GMV', fieldType: 'measure', uid: Date.now() + 4 }
    ]
    state.value.cols = defaultCols
    state.value.rows = defaultRows
    initFilter('日期', defaultCols[0], rawData.value)
    initFilter('客户', defaultRows[0], rawData.value)
    initFilter('平台', defaultRows[1], rawData.value)
    initFilter('GMV', defaultRows[2], rawData.value)
    window.addEventListener('resize', () => chartInstance && chartInstance.resize())
})
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-background">

      <!-- Toolbar Actions Teleported to Breadcrumb -->
      <Teleport to="#breadcrumb-actions">
        <div class="flex items-center gap-4">
            <div 
              class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              @click="exportData"
            >
              <Download class="w-4 h-4"/>
              <span>导出</span>
            </div>
            <div 
              class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              @click="renderViz"
            >
              <RefreshCw class="w-4 h-4"/>
              <span>刷新</span>
            </div>
            <div 
              class="flex items-center gap-1.5 text-sm text-destructive/70 hover:text-destructive cursor-pointer transition-colors"
              @click="() => { state.cols=[]; state.rows=[]; state.filters={}; }"
            >
              <Trash2 class="w-4 h-4"/>
              <span>清空</span>
            </div>
        </div>
      </Teleport>

      <div class="flex-1 flex overflow-hidden">
          <!-- Sidebar -->
          <!-- Sidebar -->
          <div class="w-48 bg-card border-r flex flex-col">
               <ScrollArea class="h-full">
                   <div class="p-3 gap-4 flex flex-col">
                       <div>
                          <div class="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">维度 (Dimensions)</div>
                          <div class="space-y-1">
                              <div v-for="dim in dimensions" :key="dim.key" 
                                class="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-md cursor-grab active:cursor-grabbing"
                                draggable="true" @dragstart="handleDragStart(dim, 'dim')"
                              >
                                 <component :is="dim.icon" class="w-4 h-4 text-blue-500" />
                                 <span>{{ dim.key }}</span>
                              </div>
                          </div>
                       </div>
                       <div class="h-[1px] bg-border"></div>
                       <div>
                          <div class="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">度量 (Measures)</div>
                          <div class="space-y-1">
                              <div v-for="measure in measures" :key="measure.key" 
                                class="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-md cursor-grab active:cursor-grabbing"
                                draggable="true" @dragstart="handleDragStart(measure, 'measure')"
                              >
                                 <component :is="measure.icon" class="w-4 h-4 text-green-500" />
                                 <span>{{ measure.key }}</span>
                              </div>
                          </div>
                       </div>
                   </div>
               </ScrollArea>
          </div>

          <!-- Controls -->
          <div class="w-64 bg-background border-r p-2 flex flex-col gap-2 overflow-y-auto">
               <Card class="shadow-none">
                   <CardHeader class="p-3 pb-2"><CardTitle class="text-xs font-medium">标记</CardTitle></CardHeader>
                   <CardContent class="p-3 pt-0 space-y-3">
                       <Select v-model="state.chartType">
                           <SelectTrigger class="h-8"><SelectValue /></SelectTrigger>
                           <SelectContent>
                               <SelectItem v-for="t in chartTypes" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
                           </SelectContent>
                       </Select>
                       <div class="grid grid-cols-2 gap-2">
                           <div class="flex flex-col items-center p-2 rounded hover:bg-accent cursor-pointer text-xs text-muted-foreground gap-1">
                               <Settings class="w-4 h-4" />颜色
                           </div>
                            <div class="flex flex-col items-center p-2 rounded hover:bg-accent cursor-pointer text-xs text-muted-foreground gap-1">
                               <GripVertical class="w-4 h-4" />大小
                           </div>
                       </div>
                   </CardContent>
               </Card>

               <Card class="flex-1 shadow-none flex flex-col">
                   <CardHeader class="p-3 pb-2"><CardTitle class="text-xs font-medium">筛选器</CardTitle></CardHeader>
                   <CardContent class="p-3 pt-0 flex-1 overflow-y-auto space-y-2">
                       <div v-if="activeFilters.size === 0" class="text-xs text-muted-foreground text-center py-4">拖拽维度至此筛选</div>
                       <div v-else v-for="fieldKey in Array.from(activeFilters)" :key="fieldKey" class="border rounded-md bg-accent/30">
                           <template v-if="state.filters[fieldKey]?.fieldType === 'dim'">
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <div class="flex items-center justify-between p-2 cursor-pointer hover:bg-accent transition-colors">
                                            <span class="text-xs font-medium">{{ fieldKey }}</span>
                                            <div class="flex items-center gap-1">
                                                <Badge variant="secondary" class="text-[10px] px-1 h-4 font-normal">
                                                    {{ state.filters[fieldKey]?.selected?.length }}/{{ state.filters[fieldKey]?.options?.length }}
                                                </Badge>
                                                <Button size="icon" variant="ghost" class="h-4 w-4" @click.stop="removeFilter(fieldKey)"><X class="w-3 h-3"/></Button>
                                            </div>
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent class="w-56" align="start">
                                        <div class="p-2">
                                            <div class="flex items-center space-x-2 mb-2">
                                                <Checkbox 
                                                    :model-value="state.filters[fieldKey]?.selected?.length === state.filters[fieldKey]?.options?.length"
                                                    @update:model-value="toggleSelectAll(fieldKey)"
                                                />
                                                <label class="text-sm font-medium">全选</label>
                                            </div>
                                            <div class="max-h-48 overflow-y-auto space-y-1">
                                                <div v-for="opt in state.filters[fieldKey]?.options" :key="opt" class="flex items-center space-x-2">
                                                     <Checkbox 
                                                        :model-value="state.filters[fieldKey]?.selected?.includes(opt)"
                                                        @update:model-value="toggleOption(fieldKey, opt)"
                                                     />
                                                     <label class="text-xs truncate">{{ opt }}</label>
                                                </div>
                                            </div>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                           </template>
                           <template v-else>
                                <!-- Measure Filter (Full) -->
                                <div class="p-2">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-xs font-medium">{{ fieldKey }}</span>
                                        <Button size="icon" variant="ghost" class="h-4 w-4" @click="removeFilter(fieldKey)"><X class="w-3 h-3"/></Button>
                                    </div>
                                    <Select 
                                        :model-value="state.filters[fieldKey]?.operator" 
                                        @update:model-value="(v) => updateMeasureFilter(fieldKey, v, state.filters[fieldKey]?.value, state.filters[fieldKey]?.minValue, state.filters[fieldKey]?.maxValue)"
                                    >
                                        <SelectTrigger class="h-7 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">不筛选</SelectItem>
                                            <SelectItem value="gt">大于</SelectItem>
                                            <SelectItem value="lt">小于</SelectItem>
                                            <SelectItem value="eq">等于</SelectItem>
                                            <SelectItem value="between">区间</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <!-- 单值输入 -->
                                    <Input 
                                        v-if="['gt','lt','eq'].includes(state.filters[fieldKey]?.operator)"
                                        type="number" 
                                        class="h-7 text-xs mt-2" 
                                        :model-value="state.filters[fieldKey]?.value"
                                        @update:model-value="(v) => updateMeasureFilter(fieldKey, state.filters[fieldKey]?.operator, Number(v), state.filters[fieldKey]?.minValue, state.filters[fieldKey]?.maxValue)"
                                        placeholder="输入数值"
                                    />
                                    <!-- 区间输入 -->
                                    <div v-if="state.filters[fieldKey]?.operator === 'between'" class="space-y-2 mt-2">
                                        <Input 
                                            type="number" 
                                            class="h-7 text-xs" 
                                            :model-value="state.filters[fieldKey]?.minValue"
                                            @update:model-value="(v) => updateMeasureFilter(fieldKey, 'between', state.filters[fieldKey]?.value, Number(v), state.filters[fieldKey]?.maxValue)"
                                            placeholder="最小值"
                                        />
                                        <Input 
                                            type="number" 
                                            class="h-7 text-xs" 
                                            :model-value="state.filters[fieldKey]?.maxValue"
                                            @update:model-value="(v) => updateMeasureFilter(fieldKey, 'between', state.filters[fieldKey]?.value, state.filters[fieldKey]?.minValue, Number(v))"
                                            placeholder="最大值"
                                        />
                                    </div>
                                    <!-- 数据范围信息 -->
                                    <div class="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
                                        范围: {{ Math.round(state.filters[fieldKey]?.rangeMin || 0).toLocaleString() }} ~ {{ Math.round(state.filters[fieldKey]?.rangeMax || 0).toLocaleString() }}
                                    </div>
                                </div>
                           </template>
                       </div>
                   </CardContent>
               </Card>
          </div>

          <!-- Canvas -->
          <div class="flex-1 flex flex-col bg-accent/10">
              <!-- Shelves -->
              <div class="bg-card border-b p-2 space-y-2">
                  <div class="flex items-center min-h-[32px]">
                      <span class="w-16 text-right text-xs text-muted-foreground mr-3">列 (Cols)</span>
                      <div class="flex-1 border rounded-md min-h-[32px] bg-background flex items-center px-1 gap-1 flex-wrap"
                           @dragover.prevent @drop="handleDrop('cols')"
                      >
                           <div v-for="(field, idx) in safeState.cols" :key="field.uid">
                               <DropdownMenu v-if="field.dateAgg">
                                   <DropdownMenuTrigger as-child>
                                       <Badge variant="secondary" class="cursor-pointer hover:bg-secondary/80 pr-1">
                                           {{ field.key }} <span class="ml-1 text-[10px] opacity-70">({{ dateAggOptions.find(o=>o.value===field.dateAgg)?.label }})</span> 
                                           <ChevronDown class="w-3 h-3 ml-1"/>
                                           <X class="w-3 h-3 ml-1 hover:text-destructive" @click.stop="removeField('cols', idx)"/>
                                       </Badge>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent>
                                       <DropdownMenuItem v-for="opt in dateAggOptions" :key="opt.value" @click="handleDateAggChange(field, opt.value)">
                                            {{ opt.label }} <Check v-if="field.dateAgg === opt.value" class="w-3 h-3 ml-auto"/>
                                       </DropdownMenuItem>
                                   </DropdownMenuContent>
                               </DropdownMenu>
                               <Badge v-else :variant="field.fieldType==='dim'?'secondary':'default'" class="cursor-default pr-1" :class="field.fieldType==='measure'?'bg-green-600 hover:bg-green-700':''">
                                   {{ field.key }} <X class="w-3 h-3 ml-1 cursor-pointer hover:text-red-300" @click="removeField('cols', idx)"/>
                               </Badge>
                           </div>
                      </div>
                  </div>
                  <div class="flex items-center min-h-[32px]">
                      <span class="w-16 text-right text-xs text-muted-foreground mr-3">行 (Rows)</span>
                      <div class="flex-1 border rounded-md min-h-[32px] bg-background flex items-center px-1 gap-1 flex-wrap"
                           @dragover.prevent @drop="handleDrop('rows')"
                      >
                           <div v-for="(field, idx) in safeState.rows" :key="field.uid">
                               <!-- Simple implementation for rows similar to cols -->
                               <Badge :variant="field.fieldType==='dim'?'secondary':'default'" class="cursor-default pr-1" :class="field.fieldType==='measure'?'bg-green-600 hover:bg-green-700':''">
                                   {{ field.key }} <X class="w-3 h-3 ml-1 cursor-pointer hover:text-red-300" @click="removeField('rows', idx)"/>
                               </Badge>
                           </div>
                      </div>
                  </div>
              </div>

              <!-- Viz -->
              <div class="flex-1 p-6 relative overflow-hidden">
                   <div ref="vizContainer" class="w-full h-full bg-card border shadow-sm rounded-md"></div>
              </div>
          </div>
      </div>
  </div>
</template>

<style>
/* AG Grid uses Theming API now (themeQuartz default) */
</style>
