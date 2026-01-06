<script setup>
import { ref, computed } from 'vue'
import { History, Search, RotateCw, ChevronRight, User, Calendar, FileText, Clock } from 'lucide-vue-next'
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
const filters = ref({ period: '', client: '', platform: '', shop: '', search: '' })
const sheetOpen = ref(false)
const selectedRecord = ref(null)

// --- 计算属性 ---
const availableShops = computed(() => {
  if (filters.value.client && filters.value.platform) {
    return SHOP_SUFFIXES.map(suffix => `${filters.value.client}${filters.value.platform}${suffix}`)
  }
  return []
})

const filteredData = computed(() => historyData.value.filter(i =>
  (!filters.value.period || i.period === filters.value.period) &&
  (!filters.value.client || i.client === filters.value.client) &&
  (!filters.value.platform || i.platform === filters.value.platform) &&
  (!filters.value.shop || i.shop === filters.value.shop) &&
  (!filters.value.search || i.shop.toLowerCase().includes(filters.value.search.toLowerCase()))
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
const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize))

const resetFilters = () => {
  filters.value = { period: '', client: '', platform: '', shop: '', search: '' }
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

const handleShopChange = () => {
  filters.value.shop = ''
}
</script>

<template>
  <div class="h-full">
    <!-- 统计数据显示在面包屑右侧 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-2">
        <div class="text-center">
          <div class="text-xs text-muted-foreground">总记录</div>
          <div class="text-lg font-bold">{{ stats.total }}</div>
        </div>
      </div>
    </Teleport>

    <!-- 主体内容 -->
    <div class="p-6 h-full">
      <div class="bg-background rounded-lg border p-6 h-full flex flex-col">
        <!-- 工具栏 -->
        <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <History class="h-5 w-5" />
            归档记录
          </h2>
          
          <div class="flex items-center gap-3 flex-wrap">
            <!-- 筛选器 -->
            <div class="flex items-center gap-2 border rounded-full px-4 py-1 bg-muted/50">
              <Select v-model="filters.period">
                <SelectTrigger class="w-[120px] border-0 h-8">
                  <SelectValue placeholder="账期" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="p in PERIOD_OPTIONS" :key="p" :value="p">{{p}}</SelectItem>
                </SelectContent>
              </Select>
              
              <div class="w-px h-4 bg-border"></div>
              
              <Select v-model="filters.client" @update:model-value="handleShopChange">
                <SelectTrigger class="w-[100px] border-0 h-8">
                  <SelectValue placeholder="客户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="c in CLIENT_OPTIONS" :key="c" :value="c">{{c}}</SelectItem>
                </SelectContent>
              </Select>
              
              <div class="w-px h-4 bg-border"></div>
              
              <Select v-model="filters.platform" @update:model-value="handleShopChange">
                <SelectTrigger class="w-[100px] border-0 h-8">
                  <SelectValue placeholder="平台" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="p in PLATFORM_OPTIONS" :key="p" :value="p">{{p}}</SelectItem>
                </SelectContent>
              </Select>
              
              <div class="w-px h-4 bg-border"></div>
              
              <Select v-model="filters.shop" :disabled="!filters.client || !filters.platform">
                <SelectTrigger class="w-[100px] border-0 h-8">
                  <SelectValue placeholder="店铺" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in availableShops" :key="s" :value="s">{{s}}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                v-model="filters.search" 
                placeholder="搜索店铺..." 
                class="pl-9 w-[200px]"
              />
            </div>
            
            <Button variant="outline" size="icon" @click="resetFilters">
              <RotateCw class="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <!-- 表格 -->
        <div class="flex-1 border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[180px]">完成时间</TableHead>
                <TableHead class="w-[100px]">账期</TableHead>
                <TableHead class="w-[100px]">客户</TableHead>
                <TableHead class="w-[100px]">平台</TableHead>
                <TableHead>店铺</TableHead>
                <TableHead class="w-[120px]">账单类型</TableHead>
                <TableHead class="w-[120px]">操作人</TableHead>
                <TableHead class="w-[100px] text-right">状态</TableHead>
                <TableHead class="w-[80px] text-center">详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow 
                v-for="record in paginatedData" 
                :key="record.id"
                class="cursor-pointer hover:bg-muted/50"
                @click="openDetail(record)"
              >
                <TableCell class="font-mono text-sm">{{ record.date }}</TableCell>
                <TableCell>{{ record.period }}</TableCell>
                <TableCell>{{ record.client }}</TableCell>
                <TableCell>
                  <Badge :variant="getPlatformColor(record.platform)">
                    {{ record.platform }}
                  </Badge>
                </TableCell>
                <TableCell class="font-medium">{{ record.shop }}</TableCell>
                <TableCell>{{ record.billType }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <div class="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <User class="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span>{{ record.user }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-right">
                  <Badge variant="outline">已归档</Badge>
                </TableCell>
                <TableCell class="text-center">
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <ChevronRight class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <!-- 分页 -->
        <div class="flex items-center justify-between mt-4">
          <div class="text-sm text-muted-foreground">
            共 {{ filteredData.length }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
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
    
    <!-- 详情 Sheet -->
    <Sheet v-model:open="sheetOpen">
      <SheetContent class="sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>账单上传详情</SheetTitle>
          <SheetDescription>
            查看已归档任务的详细信息
          </SheetDescription>
        </SheetHeader>
        
        <div v-if="selectedRecord" class="mt-6 space-y-6">
          <!-- 基本信息 -->
          <div class="rounded-lg border p-4 space-y-4">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-semibold text-lg">{{ selectedRecord.shop }}</h3>
                <div class="flex gap-2 mt-2">
                  <Badge variant="default" class="bg-green-500">已归档</Badge>
                  <Badge :variant="getPlatformColor(selectedRecord.platform)">
                    {{ selectedRecord.platform }}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div class="space-y-3 pt-4 border-t">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground flex items-center gap-2">
                  <User class="h-4 w-4" />
                  客户名称
                </span>
                <span class="font-medium">{{ selectedRecord.client }}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar class="h-4 w-4" />
                  账期
                </span>
                <Badge variant="secondary" class="font-mono">{{ selectedRecord.period }}</Badge>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText class="h-4 w-4" />
                  账单类型
                </span>
                <span class="font-medium">{{ selectedRecord.billType }}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock class="h-4 w-4" />
                  完成时间
                </span>
                <span class="font-mono text-sm">{{ selectedRecord.date }}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground flex items-center gap-2">
                  <User class="h-4 w-4" />
                  操作人
                </span>
                <span class="font-medium">{{ selectedRecord.user }}</span>
              </div>
            </div>
          </div>
          
          <!-- 文件信息 -->
          <div class="rounded-lg border p-4 space-y-4">
            <h4 class="font-semibold">文件信息</h4>
            
            <div class="flex gap-4 items-center">
              <div class="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <FileText class="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div class="flex-1">
                <div class="font-medium">{{ selectedRecord.period }}_{{ selectedRecord.billType }}.xlsx</div>
                <div class="text-sm text-muted-foreground">
                  文件大小: {{ ['1.2MB', '450KB', '5.6MB'][Math.floor(Math.random() * 3)] }} • 
                  上传时间: {{ selectedRecord.date }}
                </div>
              </div>
            </div>
            
            <div class="space-y-3 pt-4 border-t">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">上传状态</span>
                <Badge variant="default" class="bg-green-500">已完成</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">校验状态</span>
                <Badge variant="default" class="bg-green-500">已通过</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">加载状态</span>
                <Badge variant="default" class="bg-green-500">已加载</Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <Button @click="closeDetail">关闭</Button>
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
