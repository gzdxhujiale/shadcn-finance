<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Users,
  Plus,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Pencil,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'

// --- 模拟数据 ---
const MOCK_USERS = [
  { id: 1, name: '张三', username: 'zhangsan', email: 'zhangsan@company.com', phone: '13812345678', department: '财务部', roles: ['财务BI'], status: '启用', createTime: '2024-01-15 10:00' },
  { id: 2, name: '李四', username: 'lisi', email: 'lisi@company.com', phone: '13987654321', department: '运营部', roles: ['业务BI', '数据分析师', '初级运营'], status: '启用', createTime: '2024-02-20 14:30' },
  { id: 3, name: '王五', username: 'wangwu', email: 'wangwu@company.com', phone: '13700001111', department: '技术部', roles: ['运维工程师'], status: '停用', createTime: '2024-03-10 09:15' },
  { id: 4, name: 'Admin', username: 'admin', email: 'admin@company.com', phone: '13666668888', department: '管理层', roles: ['超级管理员'], status: '启用', createTime: '2023-12-01 08:00' },
  { id: 5, name: '赵六', username: 'zhaoliu', email: 'zhaoliu@company.com', phone: '13555554444', department: '数据部', roles: ['数据专员'], status: '启用', createTime: '2024-04-05 16:45' },
  { id: 6, name: '孙七', username: 'sunqi', email: 'sunqi@company.com', phone: '13311112222', department: '技术部', roles: ['前端工程师'], status: '启用', createTime: '2024-05-12 11:20' },
  { id: 7, name: '周八', username: 'zhouba', email: 'zhouba@company.com', phone: '13422223333', department: '产品部', roles: ['产品经理'], status: '启用', createTime: '2024-05-15 09:00' },
  { id: 8, name: '吴九', username: 'wujiu', email: 'wujiu@company.com', phone: '13133334444', department: '测试部', roles: ['测试工程师'], status: '停用', createTime: '2024-06-01 15:30' },
  { id: 9, name: '郑十', username: 'zhengshi', email: 'zhengshi@company.com', phone: '13244445555', department: '运营部', roles: ['活动运营'], status: '启用', createTime: '2024-06-10 10:15' },
  { id: 10, name: '冯十一', username: 'fengshiyi', email: 'feng@company.com', phone: '13055556666', department: '设计部', roles: ['UI设计师'], status: '启用', createTime: '2024-06-20 14:00' },
]

const ROLE_OPTIONS = ['超级管理员', '运维工程师', '业务BI', '财务BI', '数据分析师', '初级运营', '数据专员', '产品经理', 'UI设计师', '前端工程师', '测试工程师']
const DEPT_OPTIONS = ['财务部', '运营部', '技术部', '数据部', '管理层', '人力资源', '产品部', '测试部', '设计部']

// --- 状态 ---
const users = ref([])
const loading = ref(false)
const searchText = ref('')
const filterRole = ref('')
const filterStatus = ref('')

// 表格选中
const selectedIds = ref([])

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10
})

// 抽屉
const sheetOpen = ref(false)
const sheetType = ref('') // 'add' | 'edit'

// 表单
const form = reactive({
  id: null,
  name: '',
  username: '',
  email: '',
  phone: '',
  department: '',
  roles: [],
  status: '启用'
})

// --- 计算属性 ---
const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchSearch = !searchText.value ||
      u.name.includes(searchText.value) ||
      u.email.includes(searchText.value) ||
      u.phone.includes(searchText.value)
    const matchRole = !filterRole.value || u.roles.includes(filterRole.value)
    const matchStatus = !filterStatus.value || u.status === filterStatus.value
    return matchSearch && matchRole && matchStatus
  })
})

const paginatedUsers = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredUsers.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pagination.pageSize))

const activeUserCount = computed(() => users.value.filter(u => u.status === '启用').length)
const disabledUserCount = computed(() => users.value.filter(u => u.status === '停用').length)

const isAllSelected = computed(() => {
  return paginatedUsers.value.length > 0 && paginatedUsers.value.every(u => selectedIds.value.includes(u.id))
})

// --- 生命周期 ---
onMounted(() => {
  refreshData()
})

// --- 方法 ---
const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    users.value = [...MOCK_USERS]
    loading.value = false
  }, 600)
}



const getRoleColor = (role) => {
  if (role.includes('管理员')) return 'bg-blue-100 text-blue-700 border-blue-200'
  if (role.includes('BI') || role.includes('经理')) return 'bg-green-100 text-green-700 border-green-200'
  if (role.includes('工程师') || role.includes('设计')) return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

const openSheet = (type, data = null) => {
  sheetType.value = type
  sheetOpen.value = true
  
  if (type === 'add') {
    Object.assign(form, {
      id: null, name: '', username: '', email: '', phone: '',
      department: '', roles: [], status: '启用'
    })
  } else if (data) {
    Object.assign(form, JSON.parse(JSON.stringify(data)))
  }
}

const closeSheet = () => {
  sheetOpen.value = false
}

const handleSave = () => {
  if (!form.name || !form.email || !form.department) {
    alert('请补全必填信息')
    return
  }
  
  loading.value = true
  setTimeout(() => {
    if (sheetType.value === 'edit') {
      const idx = users.value.findIndex(u => u.id === form.id)
      if (idx !== -1) users.value[idx] = { ...form }
    } else {
      const newUser = {
        ...form,
        id: Date.now(),
        createTime: new Date().toLocaleString('zh-CN', { hour12: false })
      }
      users.value.unshift(newUser)
    }
    sheetOpen.value = false
    loading.value = false
  }, 400)
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !paginatedUsers.value.find(u => u.id === id))
  } else {
    paginatedUsers.value.forEach(u => {
      if (!selectedIds.value.includes(u.id)) {
        selectedIds.value.push(u.id)
      }
    })
  }
}

const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const handleBatchDelete = () => {
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 个用户吗？`)) {
    loading.value = true
    setTimeout(() => {
      users.value = users.value.filter(u => !selectedIds.value.includes(u.id))
      selectedIds.value = []
      loading.value = false
    }, 500)
  }
}

// 角色多选辅助
const addRole = (role) => {
  if (role && !form.roles.includes(role)) {
    form.roles.push(role)
  }
}
const removeRole = (role) => {
  form.roles = form.roles.filter(r => r !== role)
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
    <!-- 统计数据 Teleport 到面包屑区域 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-2">
        <div class="text-center">
          <div class="text-xs text-muted-foreground">总用户数</div>
          <div class="text-lg font-bold">{{ users.length }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-xs text-muted-foreground">活跃用户</div>
          <div class="text-lg font-bold text-emerald-600">{{ activeUserCount }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-xs text-muted-foreground">停用账号</div>
          <div class="text-lg font-bold text-amber-600">{{ disabledUserCount }}</div>
        </div>
      </div>
    </Teleport>
    <!-- Main Content -->
    <div class="flex-1 overflow-auto p-6">
      <div class="bg-white dark:bg-slate-950 rounded-lg border shadow-sm flex flex-col">
      <!-- Toolbar -->
      <div class="p-4 border-b flex flex-wrap items-center gap-4">
        <div class="relative w-72">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            v-model="searchText"
            type="search" 
            placeholder="搜索姓名 / 邮箱 / 手机号" 
            class="pl-9"
          />
        </div>
        
        <Select v-model="filterRole">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="角色筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="role in ROLE_OPTIONS" :key="role" :value="role">{{ role }}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select v-model="filterStatus">
          <SelectTrigger class="w-28">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="启用">启用</SelectItem>
            <SelectItem value="停用">停用</SelectItem>
          </SelectContent>
        </Select>
        
        <div class="flex-1"></div>
        
        <transition name="fade">
          <Button 
            v-if="selectedIds.length > 0" 
            variant="destructive"
            size="sm"
            @click="handleBatchDelete"
          >
            <Trash2 class="mr-2 h-4 w-4" />
            批量删除 ({{ selectedIds.length }})
          </Button>
        </transition>
        
        <Button variant="ghost" size="sm" @click="openSheet('add')">
          <Plus class="mr-2 h-4 w-4" /> 新建用户
        </Button>
        <Button variant="ghost" size="sm" @click="refreshData">
          <RefreshCw class="mr-2 h-4 w-4" /> 刷新列表
        </Button>
        <Button variant="ghost" size="sm">
          <Download class="mr-2 h-4 w-4" /> 导出数据
        </Button>
      </div>

      <!-- Table -->
      <div class="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[50px]">
                <Checkbox 
                  :checked="isAllSelected"
                  @update:checked="toggleSelectAll"
                />
              </TableHead>
              <TableHead class="w-[280px]">用户信息</TableHead>
              <TableHead class="w-[120px]">部门</TableHead>
              <TableHead class="w-[220px]">角色</TableHead>
              <TableHead class="w-[140px]">手机号</TableHead>
              <TableHead class="w-[80px]">状态</TableHead>
              <TableHead class="w-[160px]">创建时间</TableHead>
              <TableHead class="w-[80px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="item in paginatedUsers" 
              :key="item.id" 
              class="hover:bg-muted/50"
            >
              <TableCell>
                <Checkbox 
                  :checked="selectedIds.includes(item.id)"
                  @update:checked="() => toggleSelect(item.id)"
                />
              </TableCell>
              <TableCell>
                  <div class="flex flex-col">
                    <span class="font-medium">{{ item.name }}</span>
                    <span class="text-xs text-muted-foreground">{{ item.email }}</span>
                  </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" class="font-normal">{{ item.department }}</Badge>
              </TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="role in item.roles.slice(0, 2)" 
                    :key="role" 
                    class="inline-flex px-2 py-0.5 rounded text-xs border"
                    :class="getRoleColor(role)"
                  >
                    {{ role }}
                  </span>
                  <span v-if="item.roles.length > 2" class="text-xs text-muted-foreground px-1">
                    +{{ item.roles.length - 2 }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="font-mono text-sm text-muted-foreground">{{ item.phone }}</TableCell>
              <TableCell>
                <div 
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="item.status === '启用' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="item.status === '启用' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                  {{ item.status }}
                </div>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">{{ item.createTime }}</TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="sm" @click="openSheet('edit', item)">
                  编辑
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Pagination -->
      <div class="p-4 border-t flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          共 {{ filteredUsers.length }} 条记录
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

    <!-- Add/Edit Sheet -->
    <Sheet v-model:open="sheetOpen">
      <SheetContent class="sm:max-w-[480px] flex flex-col gap-0 p-0">
        <SheetHeader class="px-6 py-4 border-b shrink-0">
          <SheetTitle>{{ sheetType === 'add' ? '新建用户' : '编辑用户' }}</SheetTitle>
          <SheetDescription v-if="sheetType === 'add'">
            创建新的系统用户账号，请确保信息的准确性。
          </SheetDescription>
        </SheetHeader>
        
        <div class="flex-1 overflow-y-auto px-6 py-6">
          <div class="flex flex-col gap-6">
            <!-- 基本信息 -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 text-primary font-medium pb-2 border-b">
                <User class="h-4 w-4" /> 基本权益信息
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium text-muted-foreground">姓名 <span class="text-destructive">*</span></label>
                  <div class="relative">
                    <User class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input v-model="form.name" placeholder="真实姓名" class="pl-9" />
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium text-muted-foreground">用户名 <span class="text-destructive">*</span></label>
                  <div class="relative">
                    <Shield class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input v-model="form.username" placeholder="登录账号" class="pl-9" />
                  </div>
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-muted-foreground">邮箱地址 <span class="text-destructive">*</span></label>
                <div class="relative">
                  <Mail class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input v-model="form.email" placeholder="example@company.com" class="pl-9" />
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-muted-foreground">手机号码</label>
                <div class="relative">
                  <Phone class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input v-model="form.phone" placeholder="11位手机号" class="pl-9" />
                </div>
              </div>
            </div>

            <!-- 组织架构与权限 -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 text-primary font-medium pb-2 border-b">
                <Building2 class="h-4 w-4" /> 组织与权限
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-muted-foreground">所属部门 <span class="text-destructive">*</span></label>
                <Select v-model="form.department">
                  <SelectTrigger>
                    <SelectValue placeholder="选择所属部门" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="d in DEPT_OPTIONS" :key="d" :value="d">{{ d }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-muted-foreground">角色分配</label>
                <Select @update:model-value="addRole">
                  <SelectTrigger class="bg-muted/30">
                    <SelectValue placeholder="添加角色..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="r in ROLE_OPTIONS" :key="r" :value="r">{{ r }}</SelectItem>
                  </SelectContent>
                </Select>
                
                <div class="flex flex-wrap gap-2 pt-2 min-h-[40px] p-2 bg-muted/20 rounded-md border border-dashed">
                  <span v-if="form.roles.length === 0" class="text-sm text-muted-foreground p-1">
                    暂未分配任何角色
                  </span>
                  <Badge 
                    v-for="role in form.roles" 
                    :key="role" 
                    variant="secondary"
                    class="gap-1 pl-2.5 pr-1 py-1 h-7"
                  >
                    {{ role }}
                    <div 
                      class="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-white cursor-pointer transition-colors"
                      @click="removeRole(role)"
                    >
                      <X class="h-3 w-3" />
                    </div>
                  </Badge>
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-muted-foreground">账号状态</label>
                <div class="flex items-center gap-4">
                  <div 
                    class="flex items-center gap-2 cursor-pointer border rounded-md p-3 flex-1 transition-all"
                    :class="form.status === '启用' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'hover:bg-muted'"
                    @click="form.status = '启用'"
                  >
                    <div class="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                      <div v-if="form.status === '启用'" class="w-2.5 h-2.5 rounded-full bg-current"></div>
                    </div>
                    <span class="text-sm font-medium">启用账号</span>
                  </div>
                  
                  <div 
                    class="flex items-center gap-2 cursor-pointer border rounded-md p-3 flex-1 transition-all"
                    :class="form.status === '停用' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'hover:bg-muted'"
                    @click="form.status = '停用'"
                  >
                    <div class="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                      <div v-if="form.status === '停用'" class="w-2.5 h-2.5 rounded-full bg-current"></div>
                    </div>
                    <span class="text-sm font-medium">停用账号</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter class="px-6 py-4 border-t shrink-0">
          <Button variant="outline" @click="closeSheet" class="w-24">取消</Button>
          <Button @click="handleSave" class="w-24">{{ sheetType === 'add' ? '立即创建' : '保存修改' }}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
