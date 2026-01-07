<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { History, Search, RotateCw, ChevronRight, User, Calendar, FileText, Clock, Check, ChevronDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useNavigation } from '@/composables/useNavigation.js'

const CLIENT_OPTIONS = ['客户A', '客户B', '客户C']
const PLATFORM_OPTIONS = ['抖音', '快手', '淘宝']
const SHOP_SUFFIXES = ['1号店', '2号店', '3号店']
const PERIOD_OPTIONS = ['2025.06', '2025.07', '2025.08', '2025.09', '2025.10']
const USERS = ['家乐', '系统自动', '张三', '李四']
const BILL_TYPES = ['资金账单', '结算账单', '订单管理']

// --- 生成历史数据 ---
const generateHistoryData = () => {
  const data = []
  let id = 101
  
  const allShops = []
  CLIENT_OPTIONS.forEach(client => {
    PLATFORM_OPTIONS.forEach(platform => {
      SHOP_SUFFIXES.forEach(suffix => {
        allShops.push({ client, platform, shop: `${client}${platform}${suffix}` })
      })
    })
  })
  
  const shopCount = 10
  for (let i = 0; i < shopCount; i++) {
    const shopInfo = allShops[i % allShops.length]
    const period = PERIOD_OPTIONS[Math.floor(Math.random() * PERIOD_OPTIONS.length)]
    
    BILL_TYPES.forEach(billType => {
      const user = USERS[Math.floor(Math.random() * USERS.length)]
      
      const periodParts = period.split('.')
      const year = parseInt(periodParts[0])
      const month = parseInt(periodParts[1])
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const day = Math.floor(Math.random() * 28) + 1
      const hour = Math.floor(Math.random() * 24)
      const minute = Math.floor(Math.random() * 60)
      const date = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      
      data.push({
        id: id++,
        period,
        client: shopInfo.client,
        platform: shopInfo.platform,
        shop: shopInfo.shop,
        billType,
        date,
        user
      })
    })
  }
  
  return data.sort((a, b) => new Date(b.date) - new Date(a.date))
}

// --- 响应式数据 ---
const historyData = ref(generateHistoryData())
const sheetOpen = ref(false)
const selectedRecord = ref(null)

// 使用 reactive 管理筛选状态，与 TodoList 一致
const filters = reactive({
  period: [...PERIOD_OPTIONS],
  client: [...CLIENT_OPTIONS],
  platform: [...PLATFORM_OPTIONS],
  shop: [],
  search: ''
})

// 获取导航状态
const { historyFilter, clearHistoryFilter } = useNavigation()

// --- 计算属性 ---
const availableShops = computed(() => {
  const shops = []
  if (filters.client.length > 0 && filters.platform.length > 0) {
    const potentialShops = []
    CLIENT_OPTIONS.forEach(c => {
      PLATFORM_OPTIONS.forEach(p => {
        SHOP_SUFFIXES.forEach(s => {
           potentialShops.push(`${c}${p}${s}`)
        })
      })
    })

    potentialShops.forEach(s => {
       const hasClient = filters.client.some(c => s.includes(c))
       const hasPlatform = filters.platform.some(p => s.includes(p))
       if (hasClient && hasPlatform) {
         shops.push(s)
       }
    })
  }
  return [...new Set(shops)].sort() 
})

// 初始化 shop 并处理传入的筛选参数
onMounted(() => {
  // 先设置默认的 shop
  filters.shop = [...availableShops.value]
  
  // 如果有传入的筛选参数，应用筛选
  if (historyFilter.value && historyFilter.value.shop) {
    const targetShop = historyFilter.value.shop
    // 只筛选目标店铺
    filters.shop = [targetShop]
    filters.search = targetShop
    
    // 清除筛选参数以避免重复应用
    clearHistoryFilter()
  }
})

// 监听 availableShops（当没有特定筛选时才自动全选）
watch(availableShops, (newShops) => {
  // 只在没有外部筛选时自动全选
  if (!historyFilter.value) {
    filters.shop = [...newShops]
  }
})

const filteredData = computed(() => historyData.value.filter(i =>
  filters.period.includes(i.period) &&
  filters.client.includes(i.client) &&
  filters.platform.includes(i.platform) &&
  filters.shop.includes(i.shop) &&
  (!filters.search || i.shop.toLowerCase().includes(filters.search.toLowerCase()))
))

const stats = computed(() => ({
  total: filteredData.value.length
}))

// 分页
const currentPage = ref(1)
const pageSize = 12
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})
const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize) || 1)

const resetFilters = () => {
  filters.period = [...PERIOD_OPTIONS]
  filters.client = [...CLIENT_OPTIONS]
  filters.platform = [...PLATFORM_OPTIONS]
  filters.search = ''
  // shop 由 watch 自动处理
}

const openDetail = (record) => {
  selectedRecord.value = record
  sheetOpen.value = true
}

const closeDetail = () => {
  sheetOpen.value = false
  setTimeout(() => {
    selectedRecord.value = null
  }, 300)
}

const getPlatformColor = (platform) => {
  const map = { '淘宝': 'orange', '抖音': 'default', '快手': 'destructive' }
  return map[platform] || 'secondary'
}

// 辅助方法
const getFilterLabel = (key, allOptions) => {
  const selected = filters[key]
  if (selected.length === 0) return '未选择'
  if (selected.length === allOptions.length) return '全部'
  if (selected.length === 1) return selected[0]
  return `已选 ${selected.length} 项`
}

const toggleAll = (key, allOptions) => {
  if (filters[key].length === allOptions.length) {
    filters[key] = []
  } else {
    filters[key] = [...allOptions]
  }
}

const toggleOption = (key, option, isChecked) => {
  if (isChecked) {
    if (!filters[key].includes(option)) {
      filters[key].push(option)
    }
  } else {
    filters[key] = filters[key].filter(v => v !== option)
  }
}
</script>

<template>
  <div class="h-full">
    <!-- 统计数据显示在面包屑右侧 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-2">
        <div class="text-center">
          <div class="text-[10px] text-muted-foreground uppercase">总记录</div>
          <div class="text-sm font-bold leading-none">{{ stats.total }}</div>
        </div>
      </div>
    </Teleport>

    <!-- 主体内容 -->
    <div class="p-6 h-full">
      <div class="bg-background rounded-lg border p-6 h-full flex flex-col">
        <!-- 工具栏 -->
        <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <span class="font-semibold text-lg">归档记录</span>
            <Badge variant="outline" class="font-normal text-xs uppercase tracking-wider">HISTORY</Badge>
          </div>
          
          <div class="flex items-center gap-3 flex-wrap">
            <!-- 筛选器组 -->
            <div class="flex items-center gap-3">
              <!-- 账期 -->
              <div class="flex items-center border rounded-md overflow-hidden h-8 shadow-sm">
                 <div class="px-3 py-1.5 bg-muted/40 border-r text-xs font-medium text-muted-foreground whitespace-nowrap">
                   账期
                 </div>
                 <DropdownMenu>
                   <DropdownMenuTrigger class="h-full px-3 text-xs w-[110px] bg-background hover:bg-muted/20 flex justify-between items-center transition-colors focus:outline-none">
                     <span class="truncate">{{ getFilterLabel('period', PERIOD_OPTIONS) }}</span>
                     <ChevronDown class="w-3 h-3 opacity-50" />
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="start" class="w-48">
                     <div class="px-2 py-1.5 text-xs cursor-pointer hover:bg-muted rounded flex items-center select-none" @click.prevent="toggleAll('period', PERIOD_OPTIONS)">
                       <div class="flex items-center justify-center w-4 h-4 mr-2 border rounded" :class="filters.period.length === PERIOD_OPTIONS.length ? 'bg-primary border-primary text-primary-foreground' : 'border-input'">
                          <Check v-if="filters.period.length === PERIOD_OPTIONS.length" class="w-3 h-3" />
                       </div>
                       <span>全选</span>
                     </div>
                     <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem 
                        v-for="p in PERIOD_OPTIONS" 
                        :key="p" 
                        :model-value="filters.period.includes(p)"
                        @update:model-value="(checked) => toggleOption('period', p, checked)"
                        @select.prevent
                        class="text-xs"
                      >
                        {{ p }}
                      </DropdownMenuCheckboxItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <!-- 客户 -->
              <div class="flex items-center border rounded-md overflow-hidden h-8 shadow-sm">
                 <div class="px-3 py-1.5 bg-muted/40 border-r text-xs font-medium text-muted-foreground whitespace-nowrap">
                   客户
                 </div>
                 <DropdownMenu>
                   <DropdownMenuTrigger class="h-full px-3 text-xs w-[100px] bg-background hover:bg-muted/20 flex justify-between items-center transition-colors focus:outline-none">
                     <span class="truncate">{{ getFilterLabel('client', CLIENT_OPTIONS) }}</span>
                     <ChevronDown class="w-3 h-3 opacity-50" />
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="start" class="w-48">
                     <div class="px-2 py-1.5 text-xs cursor-pointer hover:bg-muted rounded flex items-center select-none" @click.prevent="toggleAll('client', CLIENT_OPTIONS)">
                       <div class="flex items-center justify-center w-4 h-4 mr-2 border rounded" :class="filters.client.length === CLIENT_OPTIONS.length ? 'bg-primary border-primary text-primary-foreground' : 'border-input'">
                          <Check v-if="filters.client.length === CLIENT_OPTIONS.length" class="w-3 h-3" />
                       </div>
                       <span>全选</span>
                     </div>
                     <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem 
                        v-for="c in CLIENT_OPTIONS" 
                        :key="c" 
                        :model-value="filters.client.includes(c)"
                        @update:model-value="(checked) => toggleOption('client', c, checked)"
                        @select.prevent
                        class="text-xs"
                      >
                        {{ c }}
                      </DropdownMenuCheckboxItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <!-- 平台 -->
              <div class="flex items-center border rounded-md overflow-hidden h-8 shadow-sm">
                 <div class="px-3 py-1.5 bg-muted/40 border-r text-xs font-medium text-muted-foreground whitespace-nowrap">
                   平台
                 </div>
                 <DropdownMenu>
                   <DropdownMenuTrigger class="h-full px-3 text-xs w-[100px] bg-background hover:bg-muted/20 flex justify-between items-center transition-colors focus:outline-none">
                     <span class="truncate">{{ getFilterLabel('platform', PLATFORM_OPTIONS) }}</span>
                     <ChevronDown class="w-3 h-3 opacity-50" />
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="start" class="w-48">
                     <div class="px-2 py-1.5 text-xs cursor-pointer hover:bg-muted rounded flex items-center select-none" @click.prevent="toggleAll('platform', PLATFORM_OPTIONS)">
                        <div class="flex items-center justify-center w-4 h-4 mr-2 border rounded" :class="filters.platform.length === PLATFORM_OPTIONS.length ? 'bg-primary border-primary text-primary-foreground' : 'border-input'">
                          <Check v-if="filters.platform.length === PLATFORM_OPTIONS.length" class="w-3 h-3" />
                       </div>
                       <span>全选</span>
                     </div>
                     <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem 
                        v-for="p in PLATFORM_OPTIONS" 
                        :key="p" 
                        :model-value="filters.platform.includes(p)"
                        @update:model-value="(checked) => toggleOption('platform', p, checked)"
                        @select.prevent
                        class="text-xs"
                      >
                        {{ p }}
                      </DropdownMenuCheckboxItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <!-- 店铺 -->
              <div class="flex items-center border rounded-md overflow-hidden h-8 shadow-sm">
                 <div class="px-3 py-1.5 bg-muted/40 border-r text-xs font-medium text-muted-foreground whitespace-nowrap">
                   店铺
                 </div>
                 <DropdownMenu>
                   <DropdownMenuTrigger class="h-full px-3 text-xs w-[140px] bg-background hover:bg-muted/20 flex justify-between items-center transition-colors focus:outline-none">
                     <span class="truncate">{{ getFilterLabel('shop', availableShops) }}</span>
                     <ChevronDown class="w-3 h-3 opacity-50" />
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="start" class="w-56 max-h-[300px] overflow-y-auto">
                     <div class="px-2 py-1.5 text-xs cursor-pointer hover:bg-muted rounded flex items-center select-none" @click.prevent="toggleAll('shop', availableShops)">
                        <div class="flex items-center justify-center w-4 h-4 mr-2 border rounded" :class="filters.shop.length === availableShops.length ? 'bg-primary border-primary text-primary-foreground' : 'border-input'">
                          <Check v-if="filters.shop.length === availableShops.length" class="w-3 h-3" />
                       </div>
                       <span>全选</span>
                     </div>
                     <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem 
                        v-for="s in availableShops" 
                        :key="s" 
                        :model-value="filters.shop.includes(s)"
                        @update:model-value="(checked) => toggleOption('shop', s, checked)"
                        @select.prevent
                        class="text-xs"
                      >
                        {{ s }}
                      </DropdownMenuCheckboxItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              </div>
            </div>

            <div class="w-px h-6 bg-border mx-1"></div>

            <!-- 搜索与重置 -->
            <div class="relative">
              <Search class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" :size="14" />
              <Input
                v-model="filters.search"
                placeholder="搜索店铺..."
                class="pl-9 w-48 h-8 text-xs rounded-md bg-background border shadow-sm focus-visible:ring-1"
              />
            </div>
            
            <Button variant="outline" size="sm" class="h-8 w-8 p-0" @click="resetFilters">
              <RotateCw :size="14" />
            </Button>
          </div>
        </div>
        
        <!-- 表格 -->
        <div class="border rounded-lg overflow-hidden flex-1 relative">
          <div class="absolute inset-0 overflow-auto">
            <Table>
              <TableHeader class="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow class="bg-muted/40 text-xs">
                  <TableHead class="w-[180px] h-9">完成时间</TableHead>
                  <TableHead class="w-[100px] h-9">账期</TableHead>
                  <TableHead class="w-[100px] h-9">客户</TableHead>
                  <TableHead class="w-[100px] h-9">平台</TableHead>
                  <TableHead class="h-9">店铺</TableHead>
                  <TableHead class="w-[120px] h-9">账单类型</TableHead>
                  <TableHead class="w-[120px] h-9">操作人</TableHead>
                  <TableHead class="w-[100px] h-9 text-right">状态</TableHead>
                  <TableHead class="w-[80px] h-9 text-center">详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow 
                  v-for="record in paginatedData" 
                  :key="record.id"
                  class="hover:bg-muted/30 h-10 border-b cursor-pointer"
                  @click="openDetail(record)"
                >
                  <TableCell class="font-mono text-xs">{{ record.date }}</TableCell>
                  <TableCell class="text-xs font-mono">{{ record.period }}</TableCell>
                  <TableCell class="text-xs">{{ record.client }}</TableCell>
                  <TableCell>
                    <Badge :variant="getPlatformColor(record.platform)" class="text-[10px] px-1.5 py-0 h-5">
                      {{ record.platform }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-xs">{{ record.shop }}</TableCell>
                  <TableCell class="text-xs">{{ record.billType }}</TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <div class="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                        <User class="h-3 w-3 text-muted-foreground" />
                      </div>
                      <span class="text-xs">{{ record.user }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <Badge variant="outline" class="text-[10px] px-1.5 py-0 h-5 font-normal">已归档</Badge>
                  </TableCell>
                  <TableCell class="text-center">
                    <Button variant="ghost" size="icon" class="h-6 w-6">
                      <ChevronRight :size="14" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        
        <!-- 分页 -->
        <div class="flex justify-between items-center mt-3 pt-2">
          <div class="text-xs text-muted-foreground">
            Displaying {{ ((currentPage - 1) * pageSize) + 1 }} - {{ Math.min(currentPage * pageSize, filteredData.length) }} of {{ filteredData.length }} items
          </div>
          <div class="flex gap-2 items-center">
             <div class="text-xs text-muted-foreground mr-2">Page {{ currentPage }} of {{ totalPages }}</div>
             <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs px-3"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs px-3"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 详情 Sheet -->
    <Sheet v-model:open="sheetOpen">
      <SheetContent class="sm:max-w-[500px] flex flex-col h-full">
        <SheetHeader class="flex-shrink-0">
          <SheetTitle class="flex items-center gap-2">
            <div class="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FileText class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            账单详情
          </SheetTitle>
          <SheetDescription>
            查看已归档任务的详细信息
          </SheetDescription>
        </SheetHeader>
        
        <!-- 可滚动内容区 -->
        <div v-if="selectedRecord" class="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
          <!-- 店铺信息头部 -->
          <div class="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-semibold text-base">{{ selectedRecord.shop }}</h3>
                <div class="flex gap-2 mt-2">
                  <Badge variant="default" class="bg-green-500 text-[10px]">已归档</Badge>
                  <Badge :variant="getPlatformColor(selectedRecord.platform)" class="text-[10px]">
                    {{ selectedRecord.platform }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 基本信息 -->
          <div class="rounded-lg border p-4">
            <h4 class="font-medium text-sm mb-3 text-muted-foreground">基本信息</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between py-1.5 border-b border-dashed">
                <span class="text-xs text-muted-foreground flex items-center gap-2">
                  <User class="h-3.5 w-3.5" />
                  客户名称
                </span>
                <span class="text-sm font-medium">{{ selectedRecord.client }}</span>
              </div>
              
              <div class="flex items-center justify-between py-1.5 border-b border-dashed">
                <span class="text-xs text-muted-foreground flex items-center gap-2">
                  <Calendar class="h-3.5 w-3.5" />
                  账期
                </span>
                <Badge variant="secondary" class="font-mono text-[10px]">{{ selectedRecord.period }}</Badge>
              </div>
              
              <div class="flex items-center justify-between py-1.5 border-b border-dashed">
                <span class="text-xs text-muted-foreground flex items-center gap-2">
                  <FileText class="h-3.5 w-3.5" />
                  账单类型
                </span>
                <span class="text-sm font-medium">{{ selectedRecord.billType }}</span>
              </div>
              
              <div class="flex items-center justify-between py-1.5 border-b border-dashed">
                <span class="text-xs text-muted-foreground flex items-center gap-2">
                  <Clock class="h-3.5 w-3.5" />
                  完成时间
                </span>
                <span class="font-mono text-xs">{{ selectedRecord.date }}</span>
              </div>
              
              <div class="flex items-center justify-between py-1.5">
                <span class="text-xs text-muted-foreground flex items-center gap-2">
                  <User class="h-3.5 w-3.5" />
                  操作人
                </span>
                <span class="text-sm font-medium">{{ selectedRecord.user }}</span>
              </div>
            </div>
          </div>
          
          <!-- 文件信息 -->
          <div class="rounded-lg border p-4">
            <h4 class="font-medium text-sm mb-3 text-muted-foreground">文件信息</h4>
            
            <div class="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
              <div class="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                <FileText class="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ selectedRecord.period }}_{{ selectedRecord.billType }}.xlsx</div>
                <div class="text-xs text-muted-foreground mt-0.5">
                  文件大小: 1.2MB • 上传时间: {{ selectedRecord.date.split(' ')[0] }}
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-2 mt-3">
              <div class="text-center p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <div class="text-[10px] text-green-600 dark:text-green-400 mb-0.5">上传</div>
                <Badge variant="default" class="bg-green-500 text-[10px] px-1.5">完成</Badge>
              </div>
              <div class="text-center p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <div class="text-[10px] text-green-600 dark:text-green-400 mb-0.5">校验</div>
                <Badge variant="default" class="bg-green-500 text-[10px] px-1.5">通过</Badge>
              </div>
              <div class="text-center p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <div class="text-[10px] text-green-600 dark:text-green-400 mb-0.5">加载</div>
                <Badge variant="default" class="bg-green-500 text-[10px] px-1.5">完成</Badge>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<style scoped>
/* 确保表格能正确滚动 */
.flex-1.border {
  min-height: 0;
}
</style>
