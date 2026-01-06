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

const getAvatarColor = (name) => {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500', 'bg-gray-500']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
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

  <div class="h-full p-6 flex flex-col">
    <!-- Main Content -->
    <div class="flex-1 bg-white dark:bg-slate-950 rounded-lg border shadow-sm flex flex-col overflow-hidden">
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
      <div class="flex-1 overflow-auto">
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
                <div class="flex items-center gap-3">
                  <Avatar class="h-10 w-10">
                    <AvatarFallback :class="[getAvatarColor(item.name), 'text-white']">
                      {{ item.name[0] }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex flex-col">
                    <span class="font-medium">{{ item.name }}</span>
                    <span class="text-xs text-muted-foreground">{{ item.email }}</span>
                  </div>
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

    <!-- Add/Edit Sheet -->
    <Sheet v-model:open="sheetOpen">
      <SheetContent class="sm:max-w-[480px] flex flex-col gap-0">
        <SheetHeader class="pb-4 border-b">
          <SheetTitle>{{ sheetType === 'add' ? '新建用户' : '编辑用户' }}</SheetTitle>
          <SheetDescription v-if="sheetType === 'add'">
            创建新的系统用户账号
          </SheetDescription>
        </SheetHeader>
        
        <div class="flex-1 py-6 flex flex-col gap-6 overflow-y-auto">
          <!-- 基本信息 -->
          <div class="space-y-4">
            <h3 class="font-semibold text-sm border-l-2 border-primary pl-3">基本信息</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">姓名 *</label>
                <div class="relative">
                  <User class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input v-model="form.name" placeholder="请输入真实姓名" class="pl-9" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">用户名 *</label>
                <Input v-model="form.username" placeholder="登录账号" />
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">邮箱地址 *</label>
              <div class="relative">
                <Mail class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input v-model="form.email" placeholder="example@company.com" class="pl-9" />
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">手机号码</label>
              <div class="relative">
                <Phone class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input v-model="form.phone" placeholder="11位手机号" class="pl-9" />
              </div>
            </div>
          </div>

          <Separator />

          <!-- 组织架构与权限 -->
          <div class="space-y-4">
            <h3 class="font-semibold text-sm border-l-2 border-primary pl-3">组织架构与权限</h3>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">所属部门 *</label>
              <Select v-model="form.department">
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="d in DEPT_OPTIONS" :key="d" :value="d">{{ d }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">角色分配</label>
              <Select @update:model-value="addRole">
                <SelectTrigger>
                  <SelectValue placeholder="选择角色权限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="r in ROLE_OPTIONS" :key="r" :value="r">{{ r }}</SelectItem>
                </SelectContent>
              </Select>
              
              <div class="flex flex-wrap gap-2 min-h-[32px]">
                <Badge 
                  v-for="role in form.roles" 
                  :key="role" 
                  variant="secondary"
                  class="gap-1 pl-2.5 pr-1 py-1"
                >
                  {{ role }}
                  <X 
                    class="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                    @click="removeRole(role)" 
                  />
                </Badge>
                <span v-if="form.roles.length === 0" class="text-sm text-muted-foreground italic">
                  暂未分配角色
                </span>
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">账号状态</label>
              <Select v-model="form.status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="启用">启用</SelectItem>
                  <SelectItem value="停用">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <SheetFooter class="pt-4 border-t">
          <Button variant="outline" @click="closeSheet">取消</Button>
          <Button @click="handleSave">{{ sheetType === 'add' ? '创建' : '保存' }}</Button>
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
