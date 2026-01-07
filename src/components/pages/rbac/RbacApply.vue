<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Send, 
  Plus, 
  Search, 
  Check, 
  X, 
  Eye, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Shield,
  Briefcase,
  FileText
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// --- 模拟数据 ---
const DEFAULT_ROLES = [
  '运维工程师', '数据质量管理员', '数据资产管理员', 
  '财务BI', '业务BI', '高层管理者'
]

const DEFAULT_APPLICATIONS = [
  { id: 1001, applicant: '张三', department: '财务部', currentRoles: ['财务BI'], requestRoles: ['数据资产管理员'], reason: '需要查看数据资产目录，进行财务数据血缘分析', status: 'pending', createTime: '2025-12-09 09:30', approver: null, approveTime: null, comment: null },
  { id: 1002, applicant: '李四', department: '运营部', currentRoles: ['业务BI'], requestRoles: ['高层管理者'], reason: '晋升为运营总监，需要查看全公司经营数据', status: 'pending', createTime: '2025-12-08 14:20', approver: null, approveTime: null, comment: null },
  { id: 1003, applicant: '王五', department: '技术部', currentRoles: ['运维工程师'], requestRoles: ['数据质量管理员'], reason: '负责数据质量监控系统开发，需要相关权限进行测试', status: 'approved', createTime: '2025-12-07 10:15', approver: '孙八', approveTime: '2025-12-07 16:30', comment: '同意，有效期3个月' },
  { id: 1004, applicant: '赵六', department: '数据部', currentRoles: ['数据资产管理员'], requestRoles: ['超级管理员'], reason: '临时需要超级管理员权限进行系统配置', status: 'rejected', createTime: '2025-12-06 11:00', approver: '孙八', approveTime: '2025-12-06 15:45', comment: '超级管理员权限不可申请，请联系系统管理员' },
]

// --- 状态 ---
const applications = ref([])
const roles = ref([])
const activeTab = ref('pending')
const searchText = ref('')

// 抽屉状态
const sheetOpen = ref(false)
const sheetType = ref('') // 'new' | 'view'
const selectedApp = ref(null)

// 审批弹窗状态
const dialogOpen = ref(false)
const dialogType = ref('') // 'approve' | 'reject'
const dialogData = ref(null)
const dialogComment = ref('')

// 表单数据
const formData = reactive({
  requestRoles: [],
  reason: ''
})

// --- 生命周期 ---
onMounted(() => {
  const win = window
  applications.value = (win.APPLICATIONS && win.APPLICATIONS.length > 0) 
    ? win.APPLICATIONS 
    : DEFAULT_APPLICATIONS
  
  const allRoles = (win.ROLE_NAMES && win.ROLE_NAMES.length > 0)
    ? win.ROLE_NAMES
    : DEFAULT_ROLES
  roles.value = allRoles.filter(r => r !== '超级管理员')
})

// --- 计算属性 ---
const filteredApps = computed(() => {
  let result = applications.value
  
  if (activeTab.value !== 'all') {
    result = result.filter(a => a.status === activeTab.value)
  }
  
  if (searchText.value) {
    const key = searchText.value.toLowerCase()
    result = result.filter(a => 
      a.applicant.toLowerCase().includes(key) || 
      a.department.toLowerCase().includes(key)
    )
  }
  return result
})

const pendingCount = computed(() => applications.value.filter(a => a.status === 'pending').length)
const approvedCount = computed(() => applications.value.filter(a => a.status === 'approved').length)
const rejectedCount = computed(() => applications.value.filter(a => a.status === 'rejected').length)

// --- 方法 ---
const getStatusConfig = (status) => {
  const map = {
    pending: { label: '待审批', variant: 'warning', icon: Clock, className: 'text-amber-600 bg-amber-50 border-amber-200' },
    approved: { label: '已通过', variant: 'success', icon: CheckCircle, className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    rejected: { label: '已拒绝', variant: 'destructive', icon: XCircle, className: 'text-red-600 bg-red-50 border-red-200' },
  }
  return map[status] || map.pending
}

const getAvatarFallback = (name) => {
  return name ? name[0] : 'U'
}

const getAvatarColor = (name) => {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500', 'bg-gray-500']
  const index = name ? name.charCodeAt(0) % colors.length : 0
  return colors[index]
}

const openSheet = (type, data = null) => {
  sheetType.value = type
  selectedApp.value = data
  sheetOpen.value = true
  
  if (type === 'new') {
    formData.requestRoles = []
    formData.reason = ''
  }
}

const closeSheet = () => {
  sheetOpen.value = false
  setTimeout(() => {
    selectedApp.value = null
  }, 300)
}

const submitNewRequest = () => {
  if (formData.requestRoles.length === 0 || !formData.reason) {
    // 简单校验
    return
  }
  
  const newApp = {
    id: Date.now(),
    applicant: '当前用户',
    department: '技术部',
    currentRoles: [],
    requestRoles: [...formData.requestRoles],
    reason: formData.reason,
    status: 'pending',
    createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    approver: null,
    approveTime: null,
    comment: null
  }
  
  applications.value = [newApp, ...applications.value]
  closeSheet()
  activeTab.value = 'pending'
}

const openDialog = (type, data) => {
  dialogType.value = type
  dialogData.value = data
  dialogComment.value = ''
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  setTimeout(() => {
    dialogData.value = null
  }, 300)
}

const confirmApproval = () => {
  const isApproved = dialogType.value === 'approve'
  const appId = dialogData.value.id
  const index = applications.value.findIndex(a => a.id === appId)
  
  if (index !== -1) {
    const updatedApp = {
      ...applications.value[index],
      status: isApproved ? 'approved' : 'rejected',
      approver: 'Admin',
      approveTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      comment: dialogComment.value || (isApproved ? '同意' : '不符合要求')
    }
    applications.value[index] = updatedApp
    applications.value = [...applications.value]
  }
  
  closeDialog()
  // 如果当前详情页正在展示该条目，也关闭详情页或者更新状态（这里选择不关闭体验更好，但需要数据响应式更新，selectedApp是ref指向对象，应该会自动更新）
}

// 多选处理 (Shadcn Select 默认单选，这里做一个简易的多选模拟或者认为Select支持多选，
// Shadcn-vue的Select组件目前对多选支持需要自定义，为了简化，这里暂时改用只能选一个角色，或者使用TagsInput，
// 既然是迁移，我们这里先假设一次申请一个主要角色，或者我们手动实现一个多选下拉。
// 考虑到 Shadcn Vue 的 Select 本身多选比较复杂，这里简化为：下拉选择添加角色到 tags 列表的交互方式)
const addRole = (role) => {
  if (role && !formData.requestRoles.includes(role)) {
    formData.requestRoles.push(role)
  }
}
const removeRole = (role) => {
  formData.requestRoles = formData.requestRoles.filter(r => r !== role)
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden p-6 flex flex-col">
    <!-- 统计数据 Teleport 到面包屑区域 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-2">
        <div class="text-center">
          <div class="text-xs text-muted-foreground">全部申请</div>
          <div class="text-lg font-bold">{{ applications.length }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-xs text-muted-foreground">待审批</div>
          <div class="text-lg font-bold text-amber-600">{{ pendingCount }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-xs text-muted-foreground">已通过</div>
          <div class="text-lg font-bold text-emerald-600">{{ approvedCount }}</div>
        </div>
      </div>
    </Teleport>
    <!-- Main Content -->
    <div class="flex-1 bg-white dark:bg-slate-950 rounded-lg border shadow-sm flex flex-col overflow-hidden">
      <!-- Toolbar & Tabs -->
      <div class="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs v-model:model-value="activeTab" class="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="pending" class="gap-2">
              待审批 <Badge v-if="pendingCount > 0" variant="secondary" class="h-5 px-1.5 min-w-[1.25rem]">{{ pendingCount }}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">已通过</TabsTrigger>
            <TabsTrigger value="rejected">已拒绝</TabsTrigger>
            <TabsTrigger value="all">全部记录</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div class="flex items-center gap-3">
          <div class="relative w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              v-model="searchText"
              type="search" 
              placeholder="搜索申请人/部门..." 
              class="pl-9" 
            />
          </div>
          <Button @click="openSheet('new')">
            <Plus class="mr-2 h-4 w-4" /> 发起申请
          </Button>
        </div>
      </div>

      <!-- Table -->
      <div class="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[200px]">申请人</TableHead>
              <TableHead class="w-[150px]">部门</TableHead>
              <TableHead class="w-[200px]">申请角色</TableHead>
              <TableHead class="min-w-[200px]">理由</TableHead>
              <TableHead class="w-[120px]">状态</TableHead>
              <TableHead class="w-[150px]">时间</TableHead>
              <TableHead class="w-[100px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="item in filteredApps" 
              :key="item.id" 
              class="cursor-pointer hover:bg-muted/50"
              @click="openSheet('view', item)"
            >
              <TableCell>
                <div class="flex items-center gap-3">
                  <Avatar class="h-8 w-8">
                    <AvatarFallback :class="[getAvatarColor(item.applicant), 'text-white']">
                      {{ getAvatarFallback(item.applicant) }}
                    </AvatarFallback>
                  </Avatar>
                  <span class="font-medium">{{ item.applicant }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" class="font-normal">{{ item.department }}</Badge>
              </TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-1">
                  <Badge 
                    v-for="role in item.requestRoles.slice(0, 2)" 
                    :key="role" 
                    variant="secondary"
                    class="text-xs"
                  >
                    {{ role }}
                  </Badge>
                  <span v-if="item.requestRoles.length > 2" class="text-xs text-muted-foreground">
                    +{{ item.requestRoles.length - 2 }}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div class="text-sm text-muted-foreground truncate max-w-[250px]" :title="item.reason">
                  {{ item.reason }}
                </div>
              </TableCell>
              <TableCell>
                <div 
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                  :class="getStatusConfig(item.status).className"
                >
                  <component :is="getStatusConfig(item.status).icon" class="h-3.5 w-3.5" />
                  {{ getStatusConfig(item.status).label }}
                </div>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground font-mono">
                {{ item.createTime.split(' ')[0] }}
              </TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="icon" class="h-8 w-8">
                  <Eye class="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Sheet: New Request / View Details -->
    <Sheet v-model:open="sheetOpen">
      <SheetContent class="sm:max-w-[540px] flex flex-col gap-0 p-0">
        <SheetHeader class="px-6 py-4 border-b shrink-0">
          <SheetTitle>{{ sheetType === 'new' ? '发起新申请' : '申请单详情' }}</SheetTitle>
          <SheetDescription v-if="sheetType === 'new'">
            请准确选择所需角色，并详细说明业务背景以加快审批。
          </SheetDescription>
        </SheetHeader>
        
        <!-- New Request Form -->
        <div v-if="sheetType === 'new'" class="flex-1 px-6 py-6 flex flex-col gap-6 overflow-y-auto">
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-primary font-medium pb-2 border-b">
              <Shield class="h-4 w-4" /> 申请角色
            </div>
            <div class="space-y-3">
              <Select @update:model-value="addRole">
                <SelectTrigger class="bg-muted/30">
                  <SelectValue placeholder="选择角色添加..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="role in roles" :key="role" :value="role">{{ role }}</SelectItem>
                </SelectContent>
              </Select>
              
              <div class="flex flex-wrap gap-2 min-h-[40px] p-3 bg-muted/20 rounded-md border border-dashed">
                <span v-if="formData.requestRoles.length === 0" class="text-sm text-muted-foreground">
                  暂未选择角色
                </span>
                <Badge 
                  v-for="role in formData.requestRoles" 
                  :key="role" 
                  variant="secondary"
                  class="gap-1 pl-2.5 pr-1 py-1 h-7 text-sm"
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
          </div>
          
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-primary font-medium pb-2 border-b">
              <FileText class="h-4 w-4" /> 申请理由
            </div>
            <div class="space-y-2">
              <textarea
                v-model="formData.reason"
                class="flex min-h-[160px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y p-4 leading-relaxed"
                placeholder="例如：因负责X项目数据分析，需申请Y数据的查看权限... (建议详细描述业务背景)"
              ></textarea>
              <div class="text-xs text-muted-foreground text-right">{{ formData.reason.length }}/200</div>
            </div>
          </div>
        </div>
        
        <!-- View Details -->
        <div v-else-if="selectedApp" class="flex-1 px-6 py-6 flex flex-col gap-6 overflow-y-auto">
          <!-- Status Banner -->
          <div 
            class="p-5 rounded-lg flex items-start gap-4 border shadow-sm"
            :class="getStatusConfig(selectedApp.status).className.replace('text-', 'bg-opacity-5 text-')"
          >
            <div 
              class="p-2 rounded-full shrink-0 shadow-sm"
              :class="selectedApp.status === 'pending' ? 'bg-amber-100 text-amber-600' : (selectedApp.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')"
            >
               <component :is="getStatusConfig(selectedApp.status).icon" class="h-6 w-6" />
            </div>
            <div>
              <div class="font-bold text-xl tracking-tight">{{ getStatusConfig(selectedApp.status).label }}</div>
              <div class="text-sm opacity-90 mt-1.5 font-medium" v-if="selectedApp.status === 'pending'">
                正在等待管理员审核，预计1个工作日内完成
              </div>
              <div class="text-sm opacity-90 mt-1.5 font-medium" v-else>
                审批人：{{ selectedApp.approver || '系统自动' }}
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-semibold flex items-center gap-2 text-foreground/80">
              <FileText class="h-4 w-4" /> 申请信息
            </h3>
            <div class="grid grid-cols-1 gap-4 text-sm p-5 bg-muted/30 rounded-xl border">
              <div class="grid grid-cols-3 items-start gap-4">
                <span class="text-muted-foreground text-right">申请人</span>
                <span class="col-span-2 font-medium">{{ selectedApp.applicant }} <span class="text-muted-foreground font-normal ml-1">({{ selectedApp.department }})</span></span>
              </div>
              <div class="grid grid-cols-3 items-start gap-4">
                <span class="text-muted-foreground text-right">申请时间</span>
                <span class="col-span-2 font-mono text-xs mt-0.5">{{ selectedApp.createTime }}</span>
              </div>
              <div class="grid grid-cols-3 items-start gap-4">
                <span class="text-muted-foreground text-right pt-1">目标角色</span>
                <div class="col-span-2 flex flex-wrap gap-2">
                  <Badge v-for="r in selectedApp.requestRoles" :key="r" variant="outline" class="bg-background px-2 py-0.5">
                    {{ r }}
                  </Badge>
                </div>
              </div>
              <Separator class="my-1 col-span-3 opacity-50" />
              <div class="grid grid-cols-3 items-start gap-4">
                <span class="text-muted-foreground text-right pt-1">申请理由</span>
                <span class="col-span-2 text-foreground/90 whitespace-pre-wrap leading-relaxed py-1">{{ selectedApp.reason }}</span>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-semibold flex items-center gap-2 text-foreground/80">
              <Clock class="h-4 w-4" /> 审批流转
            </h3>
            <div class="pl-4 ml-2 mt-2">
              <div class="relative space-y-8 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-muted-foreground/20">
                <!-- Step 1: Submit -->
                <div class="relative pl-8">
                  <div class="absolute -left-[5px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background"></div>
                  <div class="flex flex-col gap-1.5">
                    <span class="text-sm font-semibold">提交申请</span>
                    <span class="text-xs text-muted-foreground font-mono">{{ selectedApp.createTime }}</span>
                    <div class="text-sm text-foreground/80 bg-muted/30 border p-3 rounded-lg w-fit mt-1">
                      <span class="font-medium">{{ selectedApp.applicant }}</span> 发起了权限申请流程
                    </div>
                  </div>
                </div>

                <!-- Step 2: Approval -->
                <div class="relative pl-8">
                  <div 
                    class="absolute -left-[5px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background transition-colors"
                    :class="selectedApp.status === 'pending' ? 'bg-muted-foreground/30' : (selectedApp.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500')"
                  ></div>
                  <div class="flex flex-col gap-1.5">
                    <span class="text-sm font-semibold" :class="{'text-muted-foreground': selectedApp.status === 'pending'}">
                      {{ selectedApp.status === 'pending' ? '等待审批' : (selectedApp.status === 'approved' ? '审批通过' : '审批拒绝') }}
                    </span>
                    <span v-if="selectedApp.approveTime" class="text-xs text-muted-foreground font-mono">{{ selectedApp.approveTime }}</span>
                    
                    <div v-if="selectedApp.status !== 'pending'" class="text-sm bg-muted/30 border p-3 rounded-lg mt-1 relative">
                      <div class="flex items-center gap-2 mb-2 pb-2 border-b border-dashed">
                        <Avatar class="h-6 w-6">
                          <AvatarFallback class="text-[10px] bg-primary/10 text-primary">OP</AvatarFallback>
                        </Avatar>
                        <span class="font-medium text-xs">操作人：{{ selectedApp.approver }}</span>
                      </div>
                      <div v-if="selectedApp.comment" class="flex items-start gap-2 text-foreground/80">
                        <MessageSquare class="h-3.5 w-3.5 mt-1 shrink-0 text-muted-foreground" />
                        <span class="italic">"{{ selectedApp.comment }}"</span>
                      </div>
                    </div>
                    <div v-else class="text-sm text-muted-foreground italic flex items-center gap-2 mt-1">
                      <Clock class="h-3.5 w-3.5" /> 审批流程进行中...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter class="px-6 py-4 border-t shrink-0" v-if="sheetType === 'new'">
          <Button variant="outline" @click="closeSheet" class="w-24">取消</Button>
          <Button @click="submitNewRequest" class="w-32">提交申请</Button>
        </SheetFooter>

        <SheetFooter class="px-6 py-4 border-t shrink-0 flex-col sm:flex-row gap-3" v-if="sheetType === 'view' && selectedApp && selectedApp.status === 'pending'">
             <Button 
                class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" 
                @click="openDialog('approve', selectedApp)"
              >
               <Check class="mr-2 h-4 w-4" /> 通过申请
             </Button>
             <Button 
                class="flex-1 shadow-sm" 
                variant="destructive"
                @click="openDialog('reject', selectedApp)"
              >
               <X class="mr-2 h-4 w-4" /> 拒绝申请
             </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <!-- Dialog: Approve/Reject Confirm -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ dialogType === 'approve' ? '确认通过' : '确认拒绝' }}</DialogTitle>
          <DialogDescription>
            您正在对 <strong>{{ dialogData?.applicant }}</strong> 的权限申请执行
            <span :class="dialogType === 'approve' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'">
              {{ dialogType === 'approve' ? '通过' : '拒绝' }}
            </span> 操作。
          </DialogDescription>
        </DialogHeader>
        
        <div class="py-4">
          <label class="text-sm font-medium mb-2 block">审批意见</label>
           <textarea
              v-model="dialogComment"
              class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="请输入审批意见（选填）"
            ></textarea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="closeDialog">取消</Button>
          <Button 
            :variant="dialogType === 'approve' ? 'default' : 'destructive'"
            :class="dialogType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : ''"
             @click="confirmApproval"
          >
            确认{{ dialogType === 'approve' ? '通过' : '拒绝' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
