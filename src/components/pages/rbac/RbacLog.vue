<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { 
  FileText, 
  Search, 
  RefreshCw, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// --- 工具函数与模拟数据 ---
const generateMockData = () => {
  const modules = ['用户管理', '角色权限', '菜单配置', '系统参数', '数据备份']
  const actions = [
    { name: '新增用户', type: 'create' },
    { name: '修改权限', type: 'update' },
    { name: '删除角色', type: 'delete' },
    { name: '导出数据', type: 'export' },
    { name: '系统登录', type: 'login' },
  ]
  const users = [
    { name: 'Admin', role: '超级管理员' },
    { name: 'Sarah', role: '审计员' },
    { name: 'Mike', role: '运维人员' },
    { name: 'John', role: '业务主管' }
  ]
  const ips = ['192.168.1.10', '10.20.1.5', '172.16.0.22', '127.0.0.1']

  return Array.from({ length: 120 }).map((_, i) => {
    const act = actions[Math.floor(Math.random() * actions.length)]
    const usr = users[Math.floor(Math.random() * users.length)]
    const isSuccess = Math.random() > 0.1
    
    return {
      id: 10000 + i,
      time: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toLocaleString('zh-CN', { hour12: false }),
      user: usr.name,
      role: usr.role,
      ip: ips[Math.floor(Math.random() * ips.length)],
      module: modules[Math.floor(Math.random() * modules.length)],
      action: act.name,
      type: act.type,
      status: isSuccess ? '成功' : '失败',
      detail: `用户 [${usr.name}] 在模块 [${modules[Math.floor(Math.random() * modules.length)]}] 执行了 [${act.name}] 操作。${!isSuccess ? '原因：权限不足或网络超时。' : ''}`
    }
  }).sort((a, b) => b.id - a.id)
}

// --- 状态 ---
const allLogs = ref([])
const loading = ref(false)
const sheetOpen = ref(false)
const currentLog = ref(null)

// 筛选参数
const queryParams = reactive({
  keyword: '',
  module: '',
  type: '',
  status: ''
})

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 筛选选项
const filterOptions = reactive({
  modules: ['用户管理', '角色权限', '菜单配置', '系统参数', '数据备份'],
  types: [
    { label: '新增', value: 'create' },
    { label: '修改', value: 'update' },
    { label: '删除', value: 'delete' },
    { label: '导出', value: 'export' },
    { label: '登录', value: 'login' },
  ]
})

// --- 计算属性 ---
const filteredList = computed(() => {
  return allLogs.value.filter(item => {
    const matchKey = !queryParams.keyword || 
      item.user.toLowerCase().includes(queryParams.keyword.toLowerCase()) || 
      item.action.includes(queryParams.keyword) ||
      item.ip.includes(queryParams.keyword)
    
    const matchModule = !queryParams.module || item.module === queryParams.module
    const matchType = !queryParams.type || item.type === queryParams.type
    
    let matchStatus = true
    if (queryParams.status) {
      matchStatus = item.status === queryParams.status
    }

    return matchKey && matchModule && matchType && matchStatus
  })
})

const tableData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredList.value.slice(start, end)
})

const statsData = computed(() => {
  const list = allLogs.value
  return [
    { title: '总日志数', value: list.length },
    { title: '敏感操作', value: list.filter(i => ['delete', 'update'].includes(i.type)).length },
    { title: '失败记录', value: list.filter(i => i.status === '失败').length },
  ]
})

const totalPages = computed(() => Math.ceil(filteredList.value.length / pagination.pageSize))

// 监听过滤变化
watch(filteredList, (newVal) => {
  pagination.total = newVal.length
  pagination.current = 1
})

// --- 生命周期 ---
onMounted(() => {
  refreshData()
})

// --- 方法 ---
const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    allLogs.value = generateMockData()
    pagination.total = allLogs.value.length
    loading.value = false
  }, 600)
}

const handleSearch = () => {
  pagination.current = 1
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.module = ''
  queryParams.type = ''
  queryParams.status = ''
}

const viewDetail = (record) => {
  currentLog.value = record
  sheetOpen.value = true
}

const handleExport = () => {
  // 模拟导出
  alert('导出成功：System_Logs_2023.xlsx')
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    alert(`已复制: ${text}`)
  })
}

// 样式辅助
const getAvatarColor = (name) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-purple-500']
  return colors[name.length % colors.length]
}

const getTypeColor = (type) => {
  const map = { 
    create: 'bg-green-100 text-green-700 border-green-200', 
    update: 'bg-blue-100 text-blue-700 border-blue-200', 
    delete: 'bg-red-100 text-red-700 border-red-200', 
    export: 'bg-purple-100 text-purple-700 border-purple-200', 
    login: 'bg-cyan-100 text-cyan-700 border-cyan-200' 
  }
  return map[type] || 'bg-gray-100 text-gray-700 border-gray-200'
}

const getTypeLabel = (type) => {
  const map = { create: '新增', update: '修改', delete: '删除', export: '导出', login: '登录' }
  return map[type] || type
}

// 模拟 JSON 数据展示
const mockJson = (log) => {
  return JSON.stringify({
    method: "POST",
    path: `/api/v1/${log.type}`,
    params: {
      user_id: log.user,
      timestamp: Date.now(),
      action_code: log.type.toUpperCase()
    },
    client_ip: log.ip,
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
  }, null, 2)
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
    <!-- 统计数据 Teleport 到面包屑区域 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-2">
        <div class="text-center">
          <div class="text-xs text-muted-foreground">总日志数</div>
          <div class="text-lg font-bold">{{ statsData[0].value }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-xs text-muted-foreground">敏感操作</div>
          <div class="text-lg font-bold text-amber-600">{{ statsData[1].value }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-xs text-muted-foreground">失败记录</div>
          <div class="text-lg font-bold text-red-600">{{ statsData[2].value }}</div>
        </div>
      </div>
    </Teleport>
    <!-- Main Content -->
    <div class="flex-1 overflow-auto p-6">
      <div class="bg-white dark:bg-slate-950 rounded-lg border shadow-sm flex flex-col">
      <!-- Filters -->
      <div class="p-4 border-b flex flex-wrap items-center gap-4">
        <div class="relative w-64">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            v-model="queryParams.keyword"
            type="search" 
            placeholder="搜索用户 / 行为 / IP..." 
            class="pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        
        <Select v-model="queryParams.module" @update:model-value="handleSearch">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="所属模块" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="m in filterOptions.modules" :key="m" :value="m">{{ m }}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select v-model="queryParams.type" @update:model-value="handleSearch">
          <SelectTrigger class="w-36">
            <SelectValue placeholder="操作类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="t in filterOptions.types" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select v-model="queryParams.status" @update:model-value="handleSearch">
          <SelectTrigger class="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="成功">成功</SelectItem>
            <SelectItem value="失败">失败</SelectItem>
          </SelectContent>
        </Select>
        
        <div class="flex-1"></div>
        
        <Button variant="ghost" size="sm" @click="resetQuery">
          <RefreshCw class="mr-2 h-4 w-4" /> 重置
        </Button>
        <Button variant="ghost" size="sm" @click="handleExport">
          <Download class="mr-2 h-4 w-4" /> 导出
        </Button>
      </div>

      <!-- Table -->
      <div class="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[90px]">日志ID</TableHead>
              <TableHead class="w-[180px]">操作时间</TableHead>
              <TableHead class="w-[180px]">操作人</TableHead>
              <TableHead class="w-[120px]">功能模块</TableHead>
              <TableHead class="w-[130px]">操作行为</TableHead>
              <TableHead class="w-[80px]">状态</TableHead>
              <TableHead class="w-[120px]">IP 来源</TableHead>
              <TableHead class="w-[80px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="item in tableData" 
              :key="item.id" 
              class="cursor-pointer hover:bg-muted/50"
              @click="viewDetail(item)"
            >
              <TableCell class="font-mono text-muted-foreground text-xs">
                #{{ item.id }}
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock class="h-4 w-4" />
                  {{ item.time }}
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <Avatar class="h-8 w-8">
                    <AvatarFallback :class="[getAvatarColor(item.user), 'text-white text-xs']">
                      {{ item.user[0] }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex flex-col">
                    <span class="font-medium text-sm">{{ item.user }}</span>
                    <Badge variant="outline" class="text-xs w-fit">{{ item.role }}</Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell class="text-sm">{{ item.module }}</TableCell>
              <TableCell class="font-medium text-sm">{{ item.action }}</TableCell>
              <TableCell>
                <div 
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="item.status === '成功' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'"
                >
                  <CheckCircle v-if="item.status === '成功'" class="h-3 w-3" />
                  <XCircle v-else class="h-3 w-3" />
                  {{ item.status }}
                </div>
              </TableCell>
              <TableCell>
                <span 
                  class="font-mono text-xs bg-muted px-2 py-1 rounded cursor-copy hover:bg-muted-foreground/20 transition-colors"
                  @click.stop="copyToClipboard(item.ip)"
                  :title="'点击复制'"
                >
                  {{ item.ip }}
                </span>
              </TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="sm" @click.stop="viewDetail(item)">
                  详情
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Pagination -->
      <div class="p-4 border-t flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          共 {{ filteredList.length }} 条记录
        </div>
        <div class="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            :disabled="pagination.current <= 1"
            @click="pagination.current--"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <span class="text-sm px-2">
            {{ pagination.current }} / {{ totalPages || 1 }}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            :disabled="pagination.current >= totalPages"
            @click="pagination.current++"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
    </div>

    <!-- Detail Sheet -->
    <Sheet v-model:open="sheetOpen">
      <SheetContent class="sm:max-w-[500px] flex flex-col gap-0 p-0">
        <SheetHeader class="px-6 py-4 border-b shrink-0">
          <SheetTitle>
            日志详情 
            <span class="font-mono text-sm text-muted-foreground ml-2">#{{ currentLog?.id }}</span>
          </SheetTitle>
        </SheetHeader>
        
        <div v-if="currentLog" class="flex-1 px-6 py-6 flex flex-col gap-6 overflow-y-auto">
          <!-- Status Banner -->
          <div 
            class="p-5 rounded-lg flex items-center gap-4 border shadow-sm"
            :class="currentLog.status === '成功' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'"
          >
            <div class="p-2 rounded-full shrink-0 shadow-sm" :class="currentLog.status === '成功' ? 'bg-emerald-100' : 'bg-red-100'">
              <CheckCircle v-if="currentLog.status === '成功'" class="h-6 w-6" />
              <XCircle v-else class="h-6 w-6" />
            </div>
            <div>
              <h3 class="font-bold text-lg tracking-tight">执行{{ currentLog.status }}</h3>
              <p class="text-xs opacity-80 mt-1 font-mono uppercase tracking-wide">{{ currentLog.time }}</p>
            </div>
          </div>

          <!-- Basic Info -->
          <div class="space-y-4">
            <h3 class="font-semibold text-sm border-l-2 border-primary pl-3">基础信息</h3>
            <div class="grid grid-cols-1 gap-3 text-sm p-5 bg-muted/30 rounded-xl border">
              <div class="grid grid-cols-3 items-center gap-4">
                <span class="text-muted-foreground text-right">操作用户</span>
                <div class="col-span-2 flex items-center gap-2">
                  <Avatar class="h-6 w-6 border">
                    <AvatarFallback class="text-xs bg-primary/10 text-primary">{{ currentLog.user[0] }}</AvatarFallback>
                  </Avatar>
                  <span class="font-medium">{{ currentLog.user }}</span>
                  <span class="text-muted-foreground text-xs bg-background px-2 py-0.5 rounded border">
                    {{ currentLog.role }}
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <span class="text-muted-foreground text-right">所属模块</span>
                <span class="col-span-2 font-medium">{{ currentLog.module }}</span>
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <span class="text-muted-foreground text-right">操作类型</span>
                <div class="col-span-2">
                  <span 
                    class="inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium border shadow-sm"
                    :class="getTypeColor(currentLog.type)"
                  >
                    {{ getTypeLabel(currentLog.type) }}
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <span class="text-muted-foreground text-right">来源 IP</span>
                <div class="col-span-2 flex items-center gap-2">
                  <span class="font-mono bg-background px-2 py-0.5 rounded border">{{ currentLog.ip }}</span>
                  <span class="text-muted-foreground text-xs">(局域网)</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Request Details -->
          <div class="space-y-4">
            <h3 class="font-semibold text-sm border-l-2 border-primary pl-3">请求参数</h3>
            <div class="bg-zinc-950 text-zinc-100 p-4 rounded-xl relative shadow-inner overflow-hidden group">
              <div class="absolute top-2 right-3 text-[10px] text-zinc-500 font-mono tracking-widest uppercase opacity-50">JSON Payload</div>
              <pre class="text-xs font-mono whitespace-pre-wrap leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">{{ mockJson(currentLog) }}</pre>
            </div>
          </div>

          <Separator />

          <!-- Description -->
          <div class="space-y-4">
            <h3 class="font-semibold text-sm border-l-2 border-primary pl-3">业务描述</h3>
            <p class="text-sm text-foreground/80 leading-relaxed p-4 bg-muted/30 rounded-lg border border-l-4 border-l-primary/20">
              {{ currentLog.detail }}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
