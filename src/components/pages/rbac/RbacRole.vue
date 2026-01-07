<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Shield,
  Plus,
  Pencil,
  Trash2,
  Users,
  Lock,
  Filter,
  LayoutGrid,
  Check,
  ChevronRight,
  Box
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

// --- 默认数据 ---
const DEFAULT_ROLES = [
  { id: 1, name: '超级管理员', code: 'SUPER_ADMIN', desc: '拥有系统所有权限', userCount: 1, isSystem: true, color: 'red', permissions: ['all'], rowPermissionId: 'all', columnPermissionId: 'all' },
  { id: 2, name: '运维工程师', code: 'OPS_ENGINEER', desc: '负责系统运维、日志管理', userCount: 2, isSystem: true, color: 'purple', permissions: ['rbac:log:view', 'settings:dimension:view', 'settings:notification:view'], rowPermissionId: 'all', columnPermissionId: 'hide_sensitive' },
  { id: 3, name: '财务数据中心', code: 'FINANCE_CENTER', desc: '拥有所有经营仓和数据看板权限', userCount: 3, isSystem: false, color: 'blue', permissions: ['workspace', 'report', 'dashboard', 'docs'], rowPermissionId: 'all', columnPermissionId: 'all' },
  { id: 4, name: '财务BI', code: 'FINANCE_BI', desc: '财务部门数据分析师', userCount: 5, isSystem: false, color: 'green', permissions: ['workspace', 'report:company:view', 'report:ameba:view', 'report:store:view', 'dashboard:self-service-bi:view', 'dashboard:comparison:view'], rowPermissionId: 'profit_positive', columnPermissionId: 'all' },
  { id: 5, name: '业务BI', code: 'BUSINESS_BI', desc: '业务部门数据分析师', userCount: 8, isSystem: false, color: 'amber', permissions: ['workspace', 'report:store:view', 'dashboard:self-service-bi:view'], rowPermissionId: 'platform_taobao', columnPermissionId: 'all' },
  { id: 6, name: 'IT运维', code: 'IT_OPS', desc: 'IT部门运维人员', userCount: 2, isSystem: false, color: 'cyan', permissions: ['rbac', 'settings', 'docs:user-manual:view'], rowPermissionId: 'all', columnPermissionId: 'hide_sensitive' },
]

const DEFAULT_PERMISSION_TREE = [
  { id: 'workspace', name: '工作台', children: [
    { id: 'workspace:todo', name: '待办清单', children: [
      { id: 'workspace:todo:view', name: '查看' },
      { id: 'workspace:todo:edit', name: '编辑' },
    ]},
    { id: 'workspace:history', name: '历史记录', children: [
      { id: 'workspace:history:view', name: '查看' },
    ]},
  ]},
  { id: 'report', name: '经营仓', children: [
    { id: 'report:company', name: '公司经营仓', children: [
      { id: 'report:company:view', name: '查看' },
      { id: 'report:company:export', name: '导出' },
    ]},
    { id: 'report:ameba', name: '阿米巴经营仓', children: [
      { id: 'report:ameba:view', name: '查看' },
      { id: 'report:ameba:export', name: '导出' },
    ]},
    { id: 'report:store', name: '店铺经营仓', children: [
      { id: 'report:store:view', name: '查看' },
      { id: 'report:store:export', name: '导出' },
    ]},
  ]},
  { id: 'dashboard', name: '数据看板', children: [
    { id: 'dashboard:self-service-bi', name: '自助报表', children: [
      { id: 'dashboard:self-service-bi:view', name: '查看' },
      { id: 'dashboard:self-service-bi:edit', name: '编辑' },
      { id: 'dashboard:self-service-bi:export', name: '导出' },
    ]},
    { id: 'dashboard:comparison', name: '对比分析', children: [
      { id: 'dashboard:comparison:view', name: '查看' },
      { id: 'dashboard:comparison:export', name: '导出' },
    ]},
  ]},
  { id: 'rbac', name: '权限中心', children: [
    { id: 'rbac:user', name: '用户管理', children: [
      { id: 'rbac:user:view', name: '查看' },
      { id: 'rbac:user:edit', name: '编辑' },
      { id: 'rbac:user:add', name: '新增' },
      { id: 'rbac:user:delete', name: '删除' },
    ]},
    { id: 'rbac:role', name: '角色管理', children: [
      { id: 'rbac:role:view', name: '查看' },
      { id: 'rbac:role:edit', name: '编辑' },
      { id: 'rbac:role:add', name: '新增' },
      { id: 'rbac:role:delete', name: '删除' },
    ]},
    { id: 'rbac:permission', name: '权限配置', children: [
      { id: 'rbac:permission:view', name: '查看' },
      { id: 'rbac:permission:edit', name: '编辑' },
    ]},
    { id: 'rbac:apply', name: '权限申请', children: [
      { id: 'rbac:apply:view', name: '查看' },
      { id: 'rbac:apply:approve', name: '审批' },
    ]},
    { id: 'rbac:log', name: '操作日志', children: [
      { id: 'rbac:log:view', name: '查看' },
    ]},
  ]},
  { id: 'settings', name: '系统设置', children: [
    { id: 'settings:dimension', name: '配置管理', children: [
      { id: 'settings:dimension:view', name: '查看' },
      { id: 'settings:dimension:edit', name: '编辑' },
    ]},
    { id: 'settings:notification', name: '通知设置', children: [
      { id: 'settings:notification:view', name: '查看' },
      { id: 'settings:notification:edit', name: '编辑' },
    ]},
  ]},
  { id: 'docs', name: '文档', children: [
    { id: 'docs:data-dictionary', name: '数据字典', children: [
      { id: 'docs:data-dictionary:view', name: '查看' },
    ]},
    { id: 'docs:user-manual', name: '用户操作手册', children: [
      { id: 'docs:user-manual:view', name: '查看' },
    ]},
  ]},
]

const DEFAULT_ROW_RULES = [
  { id: 'all', name: '全部数据', description: '不限制，可查看所有行' },
  { id: 'platform_taobao', name: '淘宝平台', description: '仅淘宝平台数据' },
  { id: 'profit_positive', name: '盈利数据', description: '仅利润>0的数据' },
]

const DEFAULT_COL_RULES = [
  { id: 'all', name: '全部字段', description: '可查看所有字段' },
  { id: 'hide_sensitive', name: '隐藏敏感字段', description: '隐藏标记为敏感的字段（成本、利润等）' },
  { id: 'basic_only', name: '仅基础字段', description: '只显示非数值类基础信息' },
]

const colors = ['red', 'purple', 'blue', 'cyan', 'green', 'amber', 'indigo']

// --- 状态 ---
const roles = ref([])
const selectedRole = ref(null)
const permissionTree = ref([])
const rowRules = ref([])
const colRules = ref([])

// 弹窗状态
const dialogOpen = ref(false)
const dialogType = ref('add')

const form = reactive({
  id: null,
  name: '',
  code: '',
  desc: '',
  color: 'indigo',
  permissions: [],
  rowPermissionId: 'all',
  columnPermissionId: 'all',
  isSystem: false,
  userCount: 0
})

// --- 生命周期 ---
onMounted(() => {
  const win = window
  roles.value = (win.ROLES && win.ROLES.length > 0) ? win.ROLES : DEFAULT_ROLES
  if (roles.value.length > 0) {
    selectedRole.value = roles.value[0]
  }
  
  permissionTree.value = DEFAULT_PERMISSION_TREE
  rowRules.value = (win.ROW_PERMISSION_RULES && win.ROW_PERMISSION_RULES.length > 0) ? win.ROW_PERMISSION_RULES : DEFAULT_ROW_RULES
  colRules.value = (win.COLUMN_PERMISSION_RULES && win.COLUMN_PERMISSION_RULES.length > 0) ? win.COLUMN_PERMISSION_RULES : DEFAULT_COL_RULES
})

// --- 方法 ---
const selectRole = (role) => {
  selectedRole.value = role
}

const getColorClass = (color) => {
  const map = {
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  }
  return map[color] || 'bg-indigo-100 text-indigo-600'
}

const getRowPermName = (id) => rowRules.value.find(r => r.id === id)?.name || '全部数据'
const getRowPermDesc = (id) => rowRules.value.find(r => r.id === id)?.description || '可查看所有数据'
const getColPermName = (id) => colRules.value.find(c => c.id === id)?.name || '全部字段'
const getColPermDesc = (id) => colRules.value.find(c => c.id === id)?.description || '可查看所有字段'

const openDialog = (type, data = null) => {
  dialogType.value = type
  dialogOpen.value = true
  if (type === 'edit' && data) {
    Object.assign(form, JSON.parse(JSON.stringify(data)))
  } else {
    form.id = null
    form.name = ''
    form.code = ''
    form.desc = ''
    form.color = 'indigo'
    form.permissions = []
    form.rowPermissionId = 'all'
    form.columnPermissionId = 'all'
    form.isSystem = false
    form.userCount = 0
  }
}

const closeDialog = () => {
  dialogOpen.value = false
}

const handleSave = () => {
  if (!form.name || !form.code) {
    alert('请填写角色名称和编码')
    return
  }

  if (dialogType.value === 'add') {
    const newRole = {
      ...form,
      id: Date.now(),
      userCount: 0,
      isSystem: false
    }
    roles.value.push(newRole)
    selectedRole.value = newRole
  } else {
    const index = roles.value.findIndex(r => r.id === form.id)
    if (index !== -1) {
      roles.value[index] = { ...form }
      if (selectedRole.value?.id === form.id) {
        selectedRole.value = { ...form }
      }
    }
  }
  closeDialog()
}

const handleDelete = (role) => {
  if (role.isSystem) {
    alert('系统内置角色不可删除')
    return
  }
  if (confirm(`确定要删除角色 "${role.name}" 吗？此操作不可恢复。`)) {
    const index = roles.value.findIndex(r => r.id === role.id)
    if (index !== -1) {
      roles.value.splice(index, 1)
      if (selectedRole.value?.id === role.id) {
        selectedRole.value = roles.value.length > 0 ? roles.value[0] : null
      }
    }
  }
}

// 权限勾选
const togglePermission = (permId) => {
  const idx = form.permissions.indexOf(permId)
  if (idx > -1) {
    form.permissions.splice(idx, 1)
  } else {
    form.permissions.push(permId)
  }
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
    <!-- Teleport 按钮到面包屑区域 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div 
        class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        @click="openDialog('add')"
      >
        <Plus class="h-4 w-4" />
        <span>新增角色</span>
      </div>
    </Teleport>
    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar: Role List -->
      <div class="w-72 border-r bg-muted/30 flex flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h3 class="font-semibold">角色列表</h3>
          <span class="text-xs text-muted-foreground">点击查看详情</span>
        </div>
        <div class="flex-1 scrollbar-hidden-auto">
          <div class="p-2 space-y-1">
            <div
              v-for="role in roles"
              :key="role.id"
              class="p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 border-l-2"
              :class="selectedRole?.id === role.id 
                ? 'bg-primary/10 border-l-primary' 
                : 'bg-transparent border-l-transparent hover:bg-muted'"
              @click="selectRole(role)"
            >
              <Avatar class="h-9 w-9">
                <AvatarFallback 
                  :class="selectedRole?.id === role.id ? 'bg-primary text-white' : 'bg-muted'"
                  class="text-sm font-medium"
                >
                  {{ role.name[0] }}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ role.name }}</div>
                <div class="text-xs text-muted-foreground truncate">{{ role.desc }}</div>
              </div>
              <div class="flex items-center gap-1 text-xs text-muted-foreground">
                <Users class="h-3.5 w-3.5" />
                <span>{{ role.userCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Content: Role Details -->
      <div class="flex-1 flex flex-col overflow-auto bg-white dark:bg-slate-950">
        <template v-if="selectedRole">
          <!-- Detail Header -->
          <div class="p-6 border-b bg-gradient-to-b from-muted/30 to-transparent">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-4">
                <div 
                  class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                  :class="getColorClass(selectedRole.color)"
                >
                  <Shield class="h-7 w-7" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-xl font-bold">{{ selectedRole.name }}</h2>
                    <Badge v-if="selectedRole.isSystem" variant="secondary" class="text-xs">系统内置</Badge>
                  </div>
                  <p class="text-sm text-muted-foreground font-mono">{{ selectedRole.code }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="openDialog('edit', selectedRole)">
                  <Pencil class="mr-2 h-4 w-4" /> 编辑
                </Button>
                <Button 
                  v-if="!selectedRole.isSystem" 
                  variant="outline" 
                  size="sm" 
                  class="text-destructive hover:text-destructive"
                  @click="handleDelete(selectedRole)"
                >
                  <Trash2 class="mr-2 h-4 w-4" /> 删除
                </Button>
              </div>
            </div>
            <div class="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              {{ selectedRole.desc || '暂无描述' }}
            </div>
          </div>

          <!-- Detail Content -->
          <div class="flex-1 p-6">
            <div class="space-y-8">
              <!-- 功能权限 -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Lock class="h-5 w-5 text-indigo-600" />
                    <span class="font-semibold">功能权限</span>
                  </div>
                  <span v-if="!selectedRole.permissions.includes('all')" class="text-xs text-muted-foreground">
                    已授权 {{ selectedRole.permissions.length }} 项
                  </span>
                </div>
                
                <div 
                  class="border rounded-lg p-5"
                  :class="selectedRole.permissions.includes('all') 
                    ? 'bg-red-50 border-red-200' 
                    : ''"
                >
                  <template v-if="selectedRole.permissions.includes('all')">
                    <div class="text-center py-4 text-red-600">
                      <Shield class="h-8 w-8 mx-auto mb-2" />
                      <div class="font-bold">超级管理员权限</div>
                      <div class="text-xs opacity-80 mt-1">拥有系统所有功能模块的操作权限</div>
                    </div>
                  </template>
                  <template v-else-if="selectedRole.permissions.length > 0">
                    <div class="flex flex-wrap gap-2">
                      <Badge 
                        v-for="perm in selectedRole.permissions" 
                        :key="perm"
                        variant="outline"
                        class="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {{ perm }}
                      </Badge>
                    </div>
                  </template>
                  <div v-else class="text-center py-4 text-muted-foreground text-sm">
                    暂无功能权限
                  </div>
                </div>
              </div>

              <Separator />

              <!-- 数据权限 -->
              <div class="space-y-4">
                <div class="flex items-center gap-2">
                  <Filter class="h-5 w-5 text-green-600" />
                  <span class="font-semibold">数据权限</span>
                </div>
                
                <div class="grid grid-cols-2 gap-5">
                  <!-- Row Permission -->
                  <div class="border rounded-xl p-5 relative overflow-hidden">
                    <div class="absolute top-4 right-4 opacity-20">
                      <Check class="h-5 w-5 text-blue-600" />
                    </div>
                    <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                      <Filter class="h-5 w-5" />
                    </div>
                    <div class="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">行级范围</div>
                    <div class="font-semibold text-foreground mb-1">{{ getRowPermName(selectedRole.rowPermissionId) }}</div>
                    <div class="text-xs text-muted-foreground">{{ getRowPermDesc(selectedRole.rowPermissionId) }}</div>
                  </div>
                  
                  <!-- Column Permission -->
                  <div class="border rounded-xl p-5 relative overflow-hidden">
                    <div class="absolute top-4 right-4 opacity-20">
                      <Check class="h-5 w-5 text-green-600" />
                    </div>
                    <div class="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-3">
                      <LayoutGrid class="h-5 w-5" />
                    </div>
                    <div class="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">列级字段</div>
                    <div class="font-semibold text-foreground mb-1">{{ getColPermName(selectedRole.columnPermissionId) }}</div>
                    <div class="text-xs text-muted-foreground">{{ getColPermDesc(selectedRole.columnPermissionId) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <div v-else class="flex-1 flex items-center justify-center text-muted-foreground">
          <div class="text-center">
            <Shield class="h-12 w-12 mx-auto opacity-30 mb-4" />
            <p>请从左侧选择一个角色</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit/Add Dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-[720px] flex flex-col gap-0 p-0 max-h-[85vh]">
        <DialogHeader class="px-6 py-4 border-b shrink-0">
          <DialogTitle>{{ dialogType === 'add' ? '新增角色' : '编辑角色' }}</DialogTitle>
          <DialogDescription>
             配置角色的基础信息及功能、数据权限范围。
          </DialogDescription>
        </DialogHeader>
        
        <div class="flex-1 overflow-y-auto px-6 py-6">
          <div class="space-y-6">
            <!-- Basic Info -->
            <div class="space-y-4">
              <h3 class="text-sm font-medium text-foreground/80 flex items-center gap-2">
                <Box class="h-4 w-4" /> 基础信息
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium text-muted-foreground">角色名称 <span class="text-destructive">*</span></label>
                  <Input v-model="form.name" placeholder="请输入角色名称" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium text-muted-foreground">角色编码 <span class="text-destructive">*</span></label>
                  <Input v-model="form.code" placeholder="如: FINANCE_BI" class="font-mono" />
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-muted-foreground">角色描述</label>
                <textarea
                  v-model="form.desc"
                  class="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="请输入角色描述"
                ></textarea>
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-muted-foreground">标签颜色</label>
                <div class="flex gap-3">
                  <div 
                    v-for="color in colors" 
                    :key="color" 
                    class="w-8 h-8 rounded-full cursor-pointer ring-2 transition-all flex items-center justify-center hover:scale-110"
                    :class="[
                      getColorClass(color),
                      form.color === color ? 'ring-offset-2 ring-primary scale-110' : 'ring-transparent opacity-80 hover:opacity-100'
                    ]"
                    @click="form.color = color"
                  >
                    <Check v-if="form.color === color" class="h-4 w-4 text-white drop-shadow-md" />
                  </div>
                </div>
              </div>
            </div>

            <Separator />
            
            <!-- Permissions Tabs -->
            <Tabs default-value="function" class="w-full">
               <div class="flex items-center justify-between mb-4">
                 <h3 class="text-sm font-medium text-foreground/80 flex items-center gap-2">
                  <Shield class="h-4 w-4" /> 权限配置
                </h3>
                <TabsList class="h-9">
                  <TabsTrigger value="function" class="text-xs px-3">功能权限</TabsTrigger>
                  <TabsTrigger value="data" class="text-xs px-3">数据权限</TabsTrigger>
                </TabsList>
               </div>
              
              <TabsContent value="function" class="border rounded-lg max-h-[350px] overflow-y-auto bg-muted/20">
                <div class="p-2 space-y-1">
                  <div v-for="group in permissionTree" :key="group.id" class="rounded-lg border bg-card mb-2 overflow-hidden shadow-sm">
                    <div class="px-4 py-2.5 bg-muted/40 border-b flex items-center justify-between">
                       <span class="font-medium text-sm flex items-center gap-2">
                        <component :is="group.icon || 'Box'" class="h-4 w-4 text-muted-foreground" v-if="group.icon" />
                        {{ group.name }}
                       </span>
                    </div>
                    
                    <div v-if="group.children" class="p-2 space-y-1">
                      <div v-for="item in group.children" :key="item.id" class="space-y-1 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div 
                          class="flex items-center gap-3 cursor-pointer"
                          @click="togglePermission(item.id)"
                        >
                          <div 
                            class="w-4 h-4 rounded border flex items-center justify-center transition-all shadow-sm"
                            :class="form.permissions.includes(item.id) ? 'bg-primary border-primary' : 'border-muted-foreground/60 bg-background'"
                          >
                            <Check v-if="form.permissions.includes(item.id)" class="h-3 w-3 text-white" />
                          </div>
                          <span class="text-sm font-medium">{{ item.name }}</span>
                        </div>
                        
                        <div v-if="item.children" class="ml-7 pt-1 flex flex-wrap gap-2">
                          <div 
                            v-for="action in item.children" 
                            :key="action.id"
                            class="flex items-center gap-1.5 px-2 py-1 rounded border text-xs cursor-pointer transition-all select-none"
                            :class="form.permissions.includes(action.id) ? 'bg-primary/5 border-primary/30 text-primary font-medium' : 'hover:bg-muted border-transparent bg-muted/40'"
                            @click.stop="togglePermission(action.id)"
                          >
                            <div 
                              class="w-3 h-3 rounded-sm border flex items-center justify-center transition-colors"
                              :class="form.permissions.includes(action.id) ? 'bg-primary border-primary' : 'border-muted-foreground/60'"
                            >
                              <Check v-if="form.permissions.includes(action.id)" class="h-2 w-2 text-white" />
                            </div>
                            {{ action.name }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="data" class="border rounded-lg p-6 bg-muted/10">
                <div class="grid grid-cols-2 gap-8">
                  <!-- Row Permission -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-2 font-medium text-sm text-blue-600 pb-2 border-b border-blue-100">
                      <Filter class="h-4 w-4" /> 行级权限 (数据范围)
                    </div>
                    <div class="space-y-2.5">
                      <div 
                        v-for="rule in rowRules" 
                        :key="rule.id"
                        class="p-3 border rounded-lg cursor-pointer transition-all relative overflow-hidden group"
                        :class="form.rowPermissionId === rule.id ? 'bg-blue-50/80 border-blue-200 ring-1 ring-blue-200 shadow-sm' : 'hover:bg-muted hover:border-foreground/20 bg-card'"
                        @click="form.rowPermissionId = rule.id"
                      >
                        <div class="flex items-center justify-between mb-1 relative z-10">
                          <span class="font-medium text-sm" :class="form.rowPermissionId === rule.id ? 'text-blue-700' : ''">{{ rule.name }}</span>
                          <div class="h-4 w-4 rounded-full border flex items-center justify-center" :class="form.rowPermissionId === rule.id ? 'border-blue-500 bg-blue-500 text-white' : 'border-muted-foreground group-hover:border-foreground'">
                              <Check v-if="form.rowPermissionId === rule.id" class="h-2.5 w-2.5" />
                          </div>
                        </div>
                        <div class="text-xs text-muted-foreground relative z-10">{{ rule.description }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Column Permission -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-2 font-medium text-sm text-green-600 pb-2 border-b border-green-100">
                      <LayoutGrid class="h-4 w-4" /> 列级权限 (敏感字段)
                    </div>
                    <div class="space-y-2.5">
                      <div 
                        v-for="rule in colRules" 
                        :key="rule.id"
                        class="p-3 border rounded-lg cursor-pointer transition-all relative overflow-hidden group"
                        :class="form.columnPermissionId === rule.id ? 'bg-green-50/80 border-green-200 ring-1 ring-green-200 shadow-sm' : 'hover:bg-muted hover:border-foreground/20 bg-card'"
                        @click="form.columnPermissionId = rule.id"
                      >
                        <div class="flex items-center justify-between mb-1 relative z-10">
                          <span class="font-medium text-sm" :class="form.columnPermissionId === rule.id ? 'text-green-700' : ''">{{ rule.name }}</span>
                          <div class="h-4 w-4 rounded-full border flex items-center justify-center" :class="form.columnPermissionId === rule.id ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground group-hover:border-foreground'">
                              <Check v-if="form.columnPermissionId === rule.id" class="h-2.5 w-2.5" />
                          </div>
                        </div>
                        <div class="text-xs text-muted-foreground relative z-10">{{ rule.description }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter class="px-6 py-4 border-t shrink-0">
          <Button variant="outline" @click="closeDialog" class="w-24">取消</Button>
          <Button @click="handleSave" class="w-24">{{ dialogType === 'add' ? '立即创建' : '保存修改' }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
