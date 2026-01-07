<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import TaskDetail from './TaskDetail.vue'
import { Search, RotateCw, ChevronRight, Filter, Check, ChevronDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useNavigation } from '@/composables/useNavigation.js'

// --- 数据常量 ---
const CLIENT_OPTIONS = ['客户A', '客户B', '客户C']
const PLATFORM_OPTIONS = ['抖音', '快手', '淘宝']
const SHOP_SUFFIXES = ['1号店', '2号店', '3号店']
const PERIOD_OPTIONS = ['2025.06', '2025.07', '2025.08', '2025.09', '2025.10', '2025.11']

// --- 生成模拟数据 ---
const generateTodoData = () => {
  const data = []
  let id = 1
  
  const currentPeriod = '2025.11'
  
  const statusConfig = [
    { status: 'pending', statusText: '待上传', hasDeadline: true },
    { status: 'uploaded', statusText: '已上传', hasDeadline: false },
    { status: 'verified', statusText: '已初级校验', hasDeadline: false },
    { status: 'loaded', statusText: '已加载', hasDeadline: false }
  ]
  
  const allShops = []
  CLIENT_OPTIONS.forEach(client => {
    PLATFORM_OPTIONS.forEach(platform => {
      SHOP_SUFFIXES.forEach(suffix => {
        allShops.push({ client, platform, shop: `${client}${platform}${suffix}` })
      })
    })
  })
  const shops = allShops.slice(0, 20) // 取前20个作为示例
  
  PERIOD_OPTIONS.forEach((period) => {
    shops.forEach((shopInfo) => {
      let statusObj
      let deadline = null
      let deadlineText = '-'
      
      if (period === currentPeriod) {
        const rand = Math.random()
        if (rand < 0.35) {
          statusObj = statusConfig[0]
          deadline = Math.floor(Math.random() * 20) + 1
          deadlineText = `剩 ${deadline} 天`
        } else if (rand < 0.6) {
          statusObj = statusConfig[1]
        } else if (rand < 0.8) {
          statusObj = statusConfig[2]
        } else {
          statusObj = statusConfig[3]
        }
      } else {
        statusObj = statusConfig[3]
      }
      
      data.push({
        id: id++,
        period,
        client: shopInfo.client,
        platform: shopInfo.platform,
        shop: shopInfo.shop,
        status: statusObj.status,
        statusText: statusObj.statusText,
        deadline,
        deadlineText
      })
    })
  })
  
  return data
}

// --- 响应式数据 ---
const todoData = ref(generateTodoData())
const view = ref('list')
const selectedItem = ref(null)

// 使用 reactive 管理筛选状态，模拟 store
const filters = reactive({
  period: [...PERIOD_OPTIONS],
  client: [...CLIENT_OPTIONS],
  platform: [...PLATFORM_OPTIONS],
  shop: [],
  search: ''
})

// --- 计算属性 ---
const availableShops = computed(() => {
  const shops = []
  // 必须同时有选中的客户和平台才会有店铺
  if (filters.client.length > 0 && filters.platform.length > 0) {
    // 找出所有可能的组合
    const potentialShops = []
    CLIENT_OPTIONS.forEach(c => {
      PLATFORM_OPTIONS.forEach(p => {
        SHOP_SUFFIXES.forEach(s => {
           potentialShops.push(`${c}${p}${s}`)
        })
      })
    })

    // 根据当前选中的 client 和 platform 进行过滤
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

// 初始化 shop
onMounted(() => {
  filters.shop = [...availableShops.value]
})

// 监听 availableShops 自动全选
watch(availableShops, (newShops) => {
  filters.shop = [...newShops]
})

// 过滤数据逻辑
const filteredData = computed(() => {
  return todoData.value.filter(i =>
    filters.period.includes(i.period) &&
    filters.client.includes(i.client) &&
    filters.platform.includes(i.platform) &&
    filters.shop.includes(i.shop) &&
    (!filters.search || i.shop.toLowerCase().includes(filters.search.toLowerCase()))
  )
})

const stats = computed(() => ({
  total: filteredData.value.length,
  pending: filteredData.value.filter(i => i.status === 'pending').length,
  done: filteredData.value.filter(i => ['uploaded', 'verified', 'loaded'].includes(i.status)).length
}))

// 分页
const currentPage = ref(1)
const pageSize = 10
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})
const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize) || 1)

// --- 导航 ---
const { detailTitle } = useNavigation()

watch(detailTitle, (newVal) => {
  if (newVal === null && view.value === 'detail') {
    goBack()
  }
})

// --- 方法 ---
const resetFilters = () => {
  filters.period = [...PERIOD_OPTIONS]
  filters.client = [...CLIENT_OPTIONS]
  filters.platform = [...PLATFORM_OPTIONS]
  filters.search = ''
  // shop 由 watch 自动处理
}

const goToDetail = (item) => {
  selectedItem.value = item
  view.value = 'detail'
}

const goBack = () => {
  view.value = 'list'
  setTimeout(() => { 
    selectedItem.value = null
  }, 100)
}

const getPlatformColor = (platform) => {
  const map = { '淘宝': 'orange', '抖音': 'default', '快手': 'destructive' }
  return map[platform] || 'secondary'
}

const getStatusVariant = (status) => {
  if (status === 'pending') return 'destructive'
  if (status === 'uploaded') return 'default'
  if (status === 'verified') return 'secondary'
  return 'outline'
}

// 辅助方法
const getFilterLabel = (key, allOptions) => {
  const selected = filters[key]
  if (selected.length === 0) return '未选择'
  if (selected.length === allOptions.length) return '全部'
  if (selected.length === 1) return selected[0]
  return `已选 ${selected.length} 項`
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
    <!-- 统计数据 Teleport -->
    <Teleport to="#breadcrumb-actions" defer v-if="view === 'list'">
      <div class="flex items-center gap-2">
        <div class="text-center">
          <div class="text-[10px] text-muted-foreground uppercase">总任务</div>
          <div class="text-sm font-bold leading-none">{{ stats.total }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-[10px] text-muted-foreground uppercase">待上传</div>
          <div class="text-sm font-bold text-amber-600 leading-none">{{ stats.pending }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-[10px] text-muted-foreground uppercase">已完成</div>
          <div class="text-sm font-bold text-emerald-600 leading-none">{{ stats.done }}</div>
        </div>
      </div>
    </Teleport>

    <transition name="fade" mode="out-in">
      <!-- 列表视图 -->
      <div v-if="view === 'list'" key="list" class="h-full">
        <!-- 主体内容 -->
        <div class="p-6 h-full">
          <div class="bg-background rounded-lg border p-6 h-full flex flex-col">
            <!-- 工具栏 -->
            <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div class="flex items-center gap-3">
                <span class="font-semibold text-lg">当月任务清单</span>
                <Badge variant="outline" class="font-normal text-xs uppercase tracking-wider">OCT 2025</Badge>
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

                  <!-- 店铺 (Available) -->
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
                      <TableHead class="w-[100px] h-9">账期</TableHead>
                      <TableHead class="w-[100px] h-9">客户</TableHead>
                      <TableHead class="w-[120px] h-9">平台</TableHead>
                      <TableHead class="h-9">店铺名称</TableHead>
                      <TableHead class="w-[120px] h-9">状态</TableHead>
                      <TableHead class="w-[120px] h-9">剩余时间</TableHead>
                      <TableHead class="w-[80px] h-9 text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="item in paginatedData" :key="item.id" class="hover:bg-muted/30 h-10 border-b">
                      <TableCell class="font-medium text-xs font-mono">{{ item.period }}</TableCell>
                      <TableCell class="text-xs">{{ item.client }}</TableCell>
                      <TableCell>
                        <Badge :variant="getPlatformColor(item.platform)" class="text-[10px] px-1.5 py-0 h-5">
                          {{ item.platform }}
                        </Badge>
                      </TableCell>
                      <TableCell class="text-xs">{{ item.shop }}</TableCell>
                      <TableCell>
                        <Badge :variant="getStatusVariant(item.status)" class="text-[10px] px-1.5 py-0 h-5 font-normal">
                          {{ item.statusText }}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          v-if="item.status === 'pending'"
                          class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          :class="item.deadline <= 3 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'"
                        >
                          {{ item.deadlineText }}
                        </span>
                        <span v-else class="text-xs text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell class="text-center">
                        <Button variant="ghost" size="icon" class="h-6 w-6" @click="goToDetail(item)">
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
      </div>

      <!-- 详情视图 -->
      <TaskDetail
        v-else-if="selectedItem"
        key="detail"
        :selected-item="selectedItem"
        :go-back="goBack"
      />
    </transition>
  </div>
</template>
