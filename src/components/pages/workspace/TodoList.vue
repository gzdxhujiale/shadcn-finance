<script setup>
import { ref, computed, watch } from 'vue'
import TaskDetail from './TaskDetail.vue'
import { ListTodo, Search, RotateCw, ChevronRight, Filter } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  const shops = allShops.slice(0, 20)
  
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
const filters = ref({ period: '2025.11', client: '', platform: '', shop: '', search: '' })

// --- 计算属性 ---
const availableShops = computed(() => {
  if (filters.value.client && filters.value.platform) {
    return SHOP_SUFFIXES.map(suffix => `${filters.value.client}${filters.value.platform}${suffix}`)
  }
  return []
})

const filteredData = computed(() => todoData.value.filter(i =>
  (!filters.value.period || i.period === filters.value.period) &&
  (!filters.value.client || i.client === filters.value.client) &&
  (!filters.value.platform || i.platform === filters.value.platform) &&
  (!filters.value.shop || i.shop === filters.value.shop) &&
  (!filters.value.search || i.shop.toLowerCase().includes(filters.value.search.toLowerCase()))
))

const stats = computed(() => ({
  total: filteredData.value.length,
  pending: filteredData.value.filter(i => i.status === 'pending').length,
  done: filteredData.value.filter(i => ['uploaded', 'verified', 'loaded'].includes(i.status)).length
}))

// 分页
const currentPage = ref(1)
const pageSize = 12
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})
const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize))

// --- 导航 ---
const { detailTitle } = useNavigation()

// 监听detailTitle变化，当被清除时返回列表视图
watch(detailTitle, (newVal) => {
  if (newVal === null && view.value === 'detail') {
    goBack()
  }
})

// --- 方法 ---
const resetFilters = () => {
  filters.value = { period: '2025.11', client: '', platform: '', shop: '', search: '' }
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
</script>

<template>
  <!-- 统计数据 Teleport - 放在 transition 外部 -->
  <Teleport to="#breadcrumb-actions" defer v-if="view === 'list'">
    <div class="flex items-center gap-2">
      <div class="text-center">
        <div class="text-xs text-muted-foreground">总任务</div>
        <div class="text-lg font-bold">{{ stats.total }}</div>
      </div>
      <div class="w-px h-6 bg-border"></div>
      <div class="text-center">
        <div class="text-xs text-muted-foreground">待处理</div>
        <div class="text-lg font-bold text-amber-600">{{ stats.pending }}</div>
      </div>
      <div class="w-px h-6 bg-border"></div>
      <div class="text-center">
        <div class="text-xs text-muted-foreground">已完成</div>
        <div class="text-lg font-bold text-emerald-600">{{ stats.done }}</div>
      </div>
    </div>
  </Teleport>

  <div class="h-full">
    <transition name="fade" mode="out-in">
      <!-- 列表视图 -->
      <div v-if="view === 'list'" key="list" class="h-full">
        <!-- 主体内容 -->
        <div class="p-6 h-full">
          <div class="bg-background rounded-lg border p-6 h-full flex flex-col">
            <!-- 工具栏 -->
            <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
              <div class="flex items-center gap-3">
                <span class="font-semibold">当月任务</span>
                <Badge>OCT</Badge>
              </div>
              
              <div class="flex items-center gap-3">
                <!-- 筛选器 -->
                <div class="flex items-center gap-2 border rounded-full px-4 py-1 bg-muted/30">
                  <Filter :size="14" class="text-muted-foreground" />
                  
                  <Select v-model="filters.period">
                    <SelectTrigger class="h-7 border-0 bg-transparent text-sm w-[100px]">
                      <SelectValue placeholder="账期" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="p in PERIOD_OPTIONS" :key="p" :value="p">{{ p }}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div class="w-px h-3 bg-border"></div>
                  
                  <Select v-model="filters.client" @update:model-value="filters.shop = ''">
                    <SelectTrigger class="h-7 border-0 bg-transparent text-sm w-[80px]">
                      <SelectValue placeholder="客户" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="c in CLIENT_OPTIONS" :key="c" :value="c">{{ c }}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div class="w-px h-3 bg-border"></div>
                  
                  <Select v-model="filters.platform" @update:model-value="filters.shop = ''">
                    <SelectTrigger class="h-7 border-0 bg-transparent text-sm w-[80px]">
                      <SelectValue placeholder="平台" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="p in PLATFORM_OPTIONS" :key="p" :value="p">{{ p }}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div class="w-px h-3 bg-border"></div>
                  
                  <Select v-model="filters.shop" :disabled="!filters.client || !filters.platform">
                    <SelectTrigger class="h-7 border-0 bg-transparent text-sm w-[80px]">
                      <SelectValue placeholder="店铺" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="s in availableShops" :key="s" :value="s">{{ s }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="relative">
                  <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" :size="16" />
                  <Input
                    v-model="filters.search"
                    placeholder="搜索..."
                    class="pl-10 w-60 h-9 rounded-full bg-muted/30"
                  />
                </div>
                
                <Button variant="ghost" size="icon" class="rounded-full" @click="resetFilters">
                  <RotateCw :size="16" />
                </Button>
              </div>
            </div>
            
            <!-- 表格 -->
            <div class="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow class="bg-muted/50">
                    <TableHead class="w-[100px]">账期</TableHead>
                    <TableHead class="w-[90px]">客户</TableHead>
                    <TableHead class="w-[100px]">平台</TableHead>
                    <TableHead>店铺名称</TableHead>
                    <TableHead class="w-[120px]">状态</TableHead>
                    <TableHead class="w-[120px]">剩余时间</TableHead>
                    <TableHead class="w-[80px] text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="item in paginatedData" :key="item.id" class="hover:bg-muted/30">
                    <TableCell class="font-medium">{{ item.period }}</TableCell>
                    <TableCell>{{ item.client }}</TableCell>
                    <TableCell>
                      <Badge :variant="getPlatformColor(item.platform)" class="text-xs">
                        {{ item.platform }}
                      </Badge>
                    </TableCell>
                    <TableCell>{{ item.shop }}</TableCell>
                    <TableCell>
                      <Badge :variant="getStatusVariant(item.status)" class="text-xs">
                        {{ item.statusText }}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        v-if="item.status === 'pending'"
                        class="text-xs px-2 py-1 rounded"
                        :class="item.deadline <= 3 ? 'bg-red-50 text-red-600' : 'bg-muted text-muted-foreground'"
                      >
                        {{ item.deadlineText }}
                      </span>
                      <span v-else class="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <Button variant="ghost" size="icon" @click="goToDetail(item)">
                        <ChevronRight :size="16" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- 分页 -->
            <div class="flex justify-between items-center mt-4">
              <div class="text-sm text-muted-foreground">
                显示 {{ ((currentPage - 1) * pageSize) + 1 }} - {{ Math.min(currentPage * pageSize, filteredData.length) }} 条，共 {{ filteredData.length }} 条
              </div>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="currentPage === 1"
                  @click="currentPage--"
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="currentPage === totalPages"
                  @click="currentPage++"
                >
                  下一页
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
