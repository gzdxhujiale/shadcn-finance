<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Shield,
  Search,
  Lock,
  Users,
  Filter,
  LayoutGrid,
  Database,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  Check,
  Eye,
  EyeOff,
  X,
  Expand
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// --- 数据定义 ---
const PERMISSION_TREE = [
  { id: 'report', name: '数据分析', icon: 'folder', children: [
    { id: 'report:center', name: '经营仓中心', icon: 'file', type: 'menu' },
    { id: 'report:company', name: '公司经营仓', icon: 'file', type: 'menu', children: [
      { id: 'report:company:view', name: '查看', type: 'action' },
      { id: 'report:company:export', name: '导出', type: 'action' },
    ]},
    { id: 'report:ameba', name: '阿米巴经营仓', icon: 'file', type: 'menu', children: [
      { id: 'report:ameba:view', name: '查看', type: 'action' },
      { id: 'report:ameba:export', name: '导出', type: 'action' },
    ]},
    { id: 'report:store', name: '店铺经营仓', icon: 'file', type: 'menu', children: [
      { id: 'report:store:view', name: '查看', type: 'action' },
      { id: 'report:store:export', name: '导出', type: 'action' },
    ]},
    { id: 'report:bi', name: '数据看板', icon: 'file', type: 'menu', children: [
      { id: 'report:bi:view', name: '查看', type: 'action' },
      { id: 'report:bi:edit', name: '编辑', type: 'action' },
      { id: 'report:bi:export', name: '导出', type: 'action' },
    ]},
  ]},
  { id: 'workspace', name: '工作台', icon: 'folder', children: [
    { id: 'workspace:todo', name: '待办清单', icon: 'file', type: 'menu', children: [
      { id: 'workspace:todo:view', name: '查看', type: 'action' },
      { id: 'workspace:todo:edit', name: '编辑', type: 'action' },
    ]},
    { id: 'workspace:history', name: '历史记录', icon: 'file', type: 'menu', children: [
      { id: 'workspace:history:view', name: '查看', type: 'action' },
    ]},
  ]},
  { id: 'rbac', name: '权限中心', icon: 'folder', children: [
    { id: 'rbac:user', name: '用户管理', icon: 'file', type: 'menu', children: [
      { id: 'rbac:user:view', name: '查看', type: 'action' },
      { id: 'rbac:user:add', name: '新增', type: 'action' },
      { id: 'rbac:user:edit', name: '编辑', type: 'action' },
      { id: 'rbac:user:delete', name: '删除', type: 'action' },
    ]},
    { id: 'rbac:role', name: '角色管理', icon: 'file', type: 'menu', children: [
      { id: 'rbac:role:view', name: '查看', type: 'action' },
      { id: 'rbac:role:add', name: '新增', type: 'action' },
      { id: 'rbac:role:edit', name: '编辑', type: 'action' },
      { id: 'rbac:role:delete', name: '删除', type: 'action' },
    ]},
    { id: 'rbac:permission', name: '权限管理', icon: 'file', type: 'menu', children: [
      { id: 'rbac:permission:view', name: '查看', type: 'action' },
      { id: 'rbac:permission:edit', name: '编辑', type: 'action' },
    ]},
  ]},
  { id: 'config', name: '系统设置', icon: 'folder', children: [
    { id: 'config:management', name: '配置管理', icon: 'file', type: 'menu', children: [
      { id: 'config:management:view', name: '查看', type: 'action' },
      { id: 'config:management:edit', name: '编辑', type: 'action' },
    ]},
  ]},
]

const ROLES = [
  { id: 1, name: '超级管理员', desc: '拥有系统所有权限', permissions: ['all'] },
  { id: 2, name: '运维工程师', desc: '负责系统运维、日志管理', permissions: ['rbac:log:view', 'config:management:view'] },
  { id: 3, name: '数据质量管理员', desc: '负责数据质量监控与管理', permissions: ['report:center', 'report:company:view', 'workspace:todo:view'] },
  { id: 4, name: '数据资产管理员', desc: '负责数据资产盘点与管理', permissions: ['report:center', 'report:company:view', 'config:management:view'] },
  { id: 5, name: '财务BI', desc: '财务部门数据分析师', permissions: ['report:center', 'report:company:view', 'report:bi:view'] },
  { id: 6, name: '业务BI', desc: '业务部门数据分析师', permissions: ['report:center', 'report:ameba:view', 'report:store:view'] },
]

const DATA_TABLES = [
  { 
    id: 'shop_sales', name: '店铺销售明细', 
    fields: {
      customer: { label: '客户', type: 'string', sensitive: false },
      platform: { label: '平台', type: 'string', sensitive: false },
      shopName: { label: '店铺', type: 'string', sensitive: false },
      gmv: { label: 'GMV', type: 'number', sensitive: false },
    }
  },
  { 
    id: 'finance_report', name: '财务报表', 
    fields: {
      customer: { label: '客户', type: 'string', sensitive: false },
      gmv: { label: '收入', type: 'number', sensitive: false },
      cost: { label: '成本', type: 'number', sensitive: true },
      profit: { label: '利润', type: 'number', sensitive: true },
    }
  },
  { 
    id: 'platform_analysis', name: '平台分析表', 
    fields: {
      platform: { label: '平台', type: 'string', sensitive: false },
      totalGmv: { label: '总GMV', type: 'number', sensitive: false },
      totalProfit: { label: '总利润', type: 'number', sensitive: true },
    }
  },
]

const ROW_PERMISSION_RULES = [
  { id: 'all', name: '全部数据', description: '不限制，可查看所有行' },
  { id: 'platform_taobao', name: '淘宝平台', description: '仅淘宝平台数据', filter: { field: 'platform', operator: 'eq', value: '淘宝' } },
  { id: 'profit_positive', name: '盈利数据', description: '仅利润>0的数据', filter: { field: 'profit', operator: 'gt', value: 0 } },
]

const COLUMN_PERMISSION_RULES = [
  { id: 'all', name: '全部字段', description: '可查看所有字段' },
  { id: 'hide_sensitive', name: '隐藏敏感字段', description: '隐藏标记为敏感的字段（成本、利润等）' },
  { id: 'basic_only', name: '仅基础字段', description: '只显示非数值类基础信息' },
]

const ROLE_DATA_PERMISSIONS = {
  1: { tables: { shop_sales: { access: true, rowRule: 'all', columnRule: 'all' }, finance_report: { access: true, rowRule: 'all', columnRule: 'all' }, platform_analysis: { access: true, rowRule: 'all', columnRule: 'all' } } },
  2: { tables: { platform_analysis: { access: true, rowRule: 'all', columnRule: 'hide_sensitive' } } },
  3: { tables: { shop_sales: { access: true, rowRule: 'all', columnRule: 'all' } } },
  4: { tables: { shop_sales: { access: true, rowRule: 'all', columnRule: 'all' }, finance_report: { access: true, rowRule: 'all', columnRule: 'hide_sensitive' } } },
  5: { tables: { finance_report: { access: true, rowRule: 'profit_positive', columnRule: 'all' } } },
  6: { tables: { shop_sales: { access: true, rowRule: 'platform_taobao', columnRule: 'all' } } },
}

const TABLE_DATA = {
  shop_sales: [
    { customer: '客户A', platform: '淘宝', shopName: '店铺1', gmv: 10000 },
    { customer: '客户B', platform: '抖音', shopName: '店铺2', gmv: 20000 },
    { customer: '客户C', platform: '快手', shopName: '店铺3', gmv: 15000 },
  ],
  finance_report: [
    { customer: '客户A', gmv: 10000, cost: 8000, profit: 2000 },
    { customer: '客户B', gmv: 20000, cost: 22000, profit: -2000 },
    { customer: '客户C', gmv: 15000, cost: 10000, profit: 5000 },
  ],
  platform_analysis: [
    { platform: '淘宝', totalGmv: 50000, totalProfit: 10000 },
    { platform: '抖音', totalGmv: 80000, totalProfit: 20000 },
  ]
}

// --- 状态 ---
const activeTab = ref('function')
const selectedRole = ref(ROLES[0])
const expandedNodes = ref(['report', 'workspace', 'rbac', 'config'])
const searchText = ref('')
const selectedTable = ref(null)

const permissionTree = ref(PERMISSION_TREE)
const roles = ref(ROLES)
const tables = ref(DATA_TABLES)
const rowRules = ref(ROW_PERMISSION_RULES)
const columnRules = ref(COLUMN_PERMISSION_RULES)
const roleDataPerms = ref(ROLE_DATA_PERMISSIONS)
const tableData = ref(TABLE_DATA)

// --- 计算属性 ---
const currentRoleDataPerm = computed(() => roleDataPerms.value[selectedRole.value.id] || { tables: {} })
const isAllExpanded = computed(() => expandedNodes.value.length > 5)

// --- 方法 ---
const handleRoleSelect = (role) => {
  selectedRole.value = role
  selectedTable.value = null
}

const toggleExpand = (id) => {
  if (expandedNodes.value.includes(id)) {
    expandedNodes.value = expandedNodes.value.filter(n => n !== id)
  } else {
    expandedNodes.value.push(id)
  }
}

const toggleAllNodes = () => {
  if (isAllExpanded.value) {
    expandedNodes.value = []
  } else {
    const getAllIds = (nodes) => {
      let ids = []
      nodes.forEach(n => {
        ids.push(n.id)
        if (n.children) ids = ids.concat(getAllIds(n.children))
      })
      return ids
    }
    expandedNodes.value = getAllIds(permissionTree.value)
  }
}

const hasPermission = (nodeId) => {
  if (selectedRole.value.permissions.includes('all')) return true
  return selectedRole.value.permissions.includes(nodeId)
}

const hasAnyChildPermission = (node) => {
  if (selectedRole.value.permissions.includes('all')) return true
  if (hasPermission(node.id)) return true
  if (node.children) return node.children.some(child => hasAnyChildPermission(child))
  return false
}

const hasTableAccess = (tableId) => {
  const perm = currentRoleDataPerm.value.tables[tableId]
  return perm && perm.access
}

const getRowRuleName = (tableId) => {
  const perm = currentRoleDataPerm.value.tables[tableId]
  if (!perm) return '-'
  const rule = rowRules.value.find(r => r.id === perm.rowRule)
  return rule ? rule.name : '全部'
}

const getColRuleName = (tableId) => {
  const perm = currentRoleDataPerm.value.tables[tableId]
  if (!perm) return '-'
  const rule = columnRules.value.find(r => r.id === perm.columnRule)
  return rule ? rule.name : '全部'
}

const getVisibleColumns = (tableId) => {
  const tablePerm = currentRoleDataPerm.value.tables[tableId]
  if (!tablePerm || !tablePerm.access) return []
  const table = tables.value.find(t => t.id === tableId)
  if (!table) return []
  
  const allFields = Object.keys(table.fields)
  if (tablePerm.columnRule === 'all') return allFields
  if (tablePerm.columnRule === 'hide_sensitive') {
    return allFields.filter(f => !table.fields[f].sensitive)
  }
  if (tablePerm.columnRule === 'basic_only') {
    return allFields.filter(f => table.fields[f].type === 'string')
  }
  return allFields
}

const isColumnVisible = (tableId, fieldId) => {
  return getVisibleColumns(tableId).includes(fieldId)
}

const getFilteredData = (tableId) => {
  const tablePerm = currentRoleDataPerm.value.tables[tableId]
  if (!tablePerm || !tablePerm.access) return []
  const data = tableData.value[tableId] || []
  if (tablePerm.rowRule === 'all' || !tablePerm.rowRule) return data
  
  const rule = rowRules.value.find(r => r.id === tablePerm.rowRule)
  if (!rule || !rule.filter) return data
  
  const { field, operator, value } = rule.filter
  return data.filter(row => {
    if (operator === 'eq') return row[field] === value
    if (operator === 'gt') return row[field] > value
    if (operator === 'lt') return row[field] < value
    return true
  })
}

const getTableById = (id) => tables.value.find(t => t.id === id)

const getCurrentRowRuleFilter = (tableId) => {
  const perm = currentRoleDataPerm.value.tables[tableId]
  if(!perm) return null
  const rule = rowRules.value.find(r => r.id === perm.rowRule)
  return rule && rule.filter ? rule : null
}

const getFilterDisplay = (tableId) => {
  const rule = getCurrentRowRuleFilter(tableId)
  if(!rule) return ''
  const table = getTableById(tableId)
  const label = table.fields[rule.filter.field]?.label || rule.filter.field
  const op = rule.filter.operator === 'eq' ? ' = ' : rule.filter.operator === 'gt' ? ' > ' : ' < '
  return `${label}${op}"${rule.filter.value}"`
}

const matchSearch = (node) => {
  if (!searchText.value) return true
  if (node.name.includes(searchText.value) || node.id.includes(searchText.value)) return true
  if (node.children) return node.children.some(c => matchSearch(c))
  return false
}
</script>

<template>
  <!-- Teleport Tabs 到面包屑区域 -->
  <Teleport to="#breadcrumb-actions" defer>
    <Tabs v-model:model-value="activeTab" class="w-auto">
      <TabsList>
        <TabsTrigger value="function">功能权限</TabsTrigger>
        <TabsTrigger value="data">数据权限</TabsTrigger>
      </TabsList>
    </Tabs>
  </Teleport>

  <div class="h-full flex flex-col">
    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar: Role List -->
      <div class="w-72 border-r bg-muted/30 flex flex-col">
        <div class="p-4 border-b">
          <h3 class="font-semibold">角色列表</h3>
          <span class="text-xs text-muted-foreground">点击查看详情</span>
        </div>
        <ScrollArea class="flex-1">
          <div class="p-2 space-y-1">
            <div
              v-for="role in roles"
              :key="role.id"
              class="p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 border-l-2"
              :class="selectedRole.id === role.id 
                ? 'bg-primary/10 border-l-primary' 
                : 'bg-transparent border-l-transparent hover:bg-muted'"
              @click="handleRoleSelect(role)"
            >
              <Avatar class="h-9 w-9">
                <AvatarFallback 
                  :class="selectedRole.id === role.id ? 'bg-primary text-white' : 'bg-muted'"
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
                <Lock class="h-3.5 w-3.5" />
                <span>{{ role.permissions.includes('all') ? 'All' : role.permissions.length }}</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <!-- Right Content -->
      <div class="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
        <!-- 功能权限视图 -->
        <template v-if="activeTab === 'function'">
          <div class="p-4 border-b flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-semibold">功能菜单授权</span>
              <Badge variant="outline">{{ selectedRole.name }}</Badge>
            </div>
            <div class="flex items-center gap-3">
              <div class="relative w-60">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-model="searchText"
                  type="search" 
                  placeholder="过滤菜单节点" 
                  class="pl-9 h-9"
                />
              </div>
              <Button variant="outline" size="sm" @click="toggleAllNodes">
                <Expand class="mr-2 h-4 w-4" />
                {{ isAllExpanded ? '折叠全部' : '展开全部' }}
              </Button>
            </div>
          </div>
          
          <ScrollArea class="flex-1 p-6">
            <div v-if="selectedRole.permissions.includes('all')" class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p class="text-amber-700 text-sm">
                当前角色拥有 <b>超级管理员</b> 权限，默认拥有所有功能访问权，无需单独配置。
              </p>
            </div>
            
            <div class="border rounded-lg bg-white p-2 space-y-1">
              <template v-for="group in permissionTree" :key="group.id">
                <template v-if="matchSearch(group)">
                  <div 
                    class="flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted"
                    :class="hasAnyChildPermission(group) ? 'text-foreground' : 'text-muted-foreground/60'"
                    @click="toggleExpand(group.id)"
                  >
                    <component :is="expandedNodes.includes(group.id) ? ChevronDown : ChevronRight" class="h-4 w-4" />
                    <Folder class="h-4 w-4 text-amber-500" />
                    <span class="font-medium">{{ group.name }}</span>
                  </div>
                  
                  <template v-if="expandedNodes.includes(group.id) && group.children">
                    <div class="ml-6 space-y-1">
                      <template v-for="item in group.children" :key="item.id">
                        <template v-if="matchSearch(item)">
                          <div 
                            class="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors"
                            :class="[
                              hasPermission(item.id) ? 'text-primary' : 'text-muted-foreground/60',
                              item.children ? 'hover:bg-muted' : ''
                            ]"
                            @click="item.children && toggleExpand(item.id)"
                          >
                            <component 
                              v-if="item.children" 
                              :is="expandedNodes.includes(item.id) ? ChevronDown : ChevronRight" 
                              class="h-4 w-4" 
                            />
                            <span v-else class="w-4"></span>
                            
                            <div 
                              v-if="!item.children"
                              class="w-4 h-4 rounded border flex items-center justify-center"
                              :class="hasPermission(item.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'"
                            >
                              <Check v-if="hasPermission(item.id)" class="h-3 w-3 text-white" />
                            </div>
                            
                            <File class="h-4 w-4 text-muted-foreground" />
                            <span class="text-sm">{{ item.name }}</span>
                            
                            <Badge v-if="item.type === 'menu'" variant="outline" class="ml-auto text-xs">菜单</Badge>
                          </div>
                          
                          <template v-if="expandedNodes.includes(item.id) && item.children">
                            <div class="ml-10 flex flex-wrap gap-2 py-2">
                              <div 
                                v-for="action in item.children" 
                                :key="action.id"
                                class="flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors"
                                :class="hasPermission(action.id) 
                                  ? 'bg-primary/10 border-primary text-primary' 
                                  : 'border-muted-foreground/30 text-muted-foreground/60'"
                              >
                                <div 
                                  class="w-3 h-3 rounded border flex items-center justify-center"
                                  :class="hasPermission(action.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'"
                                >
                                  <Check v-if="hasPermission(action.id)" class="h-2 w-2 text-white" />
                                </div>
                                {{ action.name }}
                              </div>
                            </div>
                          </template>
                        </template>
                      </template>
                    </div>
                  </template>
                </template>
              </template>
            </div>
          </ScrollArea>
        </template>
        
        <!-- 数据权限视图 -->
        <template v-else>
          <div class="flex-1 flex overflow-hidden">
            <!-- 数据表列表 -->
            <div class="w-60 border-r bg-muted/30 flex flex-col">
              <div class="p-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
                数据资源列表
              </div>
              <ScrollArea class="flex-1">
                <div 
                  v-for="table in tables" 
                  :key="table.id"
                  class="p-3 border-b cursor-pointer flex items-center gap-3 transition-colors"
                  :class="{
                    'bg-white border-l-2 border-l-primary': selectedTable === table.id && hasTableAccess(table.id),
                    'opacity-50 cursor-not-allowed': !hasTableAccess(table.id),
                    'hover:bg-muted': hasTableAccess(table.id)
                  }"
                  @click="hasTableAccess(table.id) && (selectedTable = table.id)"
                >
                  <div 
                    class="w-2 h-2 rounded-full"
                    :class="hasTableAccess(table.id) ? 'bg-green-500' : 'bg-muted-foreground/30'"
                  ></div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ table.name }}</div>
                    <div class="text-xs text-muted-foreground font-mono">{{ table.id }}</div>
                  </div>
                  <Lock v-if="!hasTableAccess(table.id)" class="h-4 w-4 text-muted-foreground" />
                </div>
              </ScrollArea>
            </div>
            
            <!-- 数据表详情 -->
            <ScrollArea class="flex-1">
              <div v-if="!selectedTable" class="h-full flex items-center justify-center">
                <div class="text-center text-muted-foreground">
                  <Database class="h-12 w-12 mx-auto opacity-30 mb-4" />
                  <p>请从左侧选择一个数据表查看权限详情</p>
                </div>
              </div>
              
              <div v-else class="p-6 space-y-6">
                <!-- 头部统计 -->
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-xl font-bold">{{ getTableById(selectedTable)?.name }}</h3>
                    <p class="text-sm text-muted-foreground">
                      行数: {{ (tableData[selectedTable] || []).length }} · 
                      列数: {{ Object.keys(getTableById(selectedTable)?.fields || {}).length }}
                    </p>
                  </div>
                  <div class="flex items-center gap-6 p-3 bg-muted/50 rounded-lg">
                    <div class="text-center">
                      <div class="text-xs text-muted-foreground mb-1">行级规则</div>
                      <div class="font-semibold text-primary">{{ getRowRuleName(selectedTable) }}</div>
                    </div>
                    <div class="h-8 w-px bg-border"></div>
                    <div class="text-center">
                      <div class="text-xs text-muted-foreground mb-1">列级规则</div>
                      <div class="font-semibold text-green-600">{{ getColRuleName(selectedTable) }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- 过滤条件 -->
                <div 
                  v-if="getCurrentRowRuleFilter(selectedTable)" 
                  class="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Filter class="h-4 w-4 text-primary" />
                  <span class="text-muted-foreground">当前行级过滤条件：</span>
                  <code class="bg-primary/10 px-2 py-0.5 rounded font-mono text-primary">
                    {{ getFilterDisplay(selectedTable) }}
                  </code>
                </div>
                
                <!-- 字段权限 -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="font-semibold border-l-2 border-primary pl-3">字段可见性</h4>
                    <div class="flex items-center gap-4 text-xs text-muted-foreground">
                      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span>可见</span>
                      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span>敏感</span>
                      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-muted-foreground/30"></span>隐藏</span>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
                    <div 
                      v-for="(field, fieldId) in getTableById(selectedTable)?.fields" 
                      :key="fieldId"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
                      :class="isColumnVisible(selectedTable, fieldId) 
                        ? (field.sensitive ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700')
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'"
                    >
                      <component 
                        :is="!isColumnVisible(selectedTable, fieldId) ? X : (field.sensitive ? EyeOff : Eye)" 
                        class="h-3.5 w-3.5" 
                      />
                      {{ field.label }}
                    </div>
                  </div>
                </div>
                
                <!-- 数据预览 -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="font-semibold border-l-2 border-primary pl-3">数据预览 (Top 10)</h4>
                    <Badge variant="outline">模拟数据</Badge>
                  </div>
                  <div class="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            v-for="(field, fieldId) in getTableById(selectedTable)?.fields" 
                            :key="fieldId"
                          >
                            {{ field.label }}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-for="(row, idx) in getFilteredData(selectedTable).slice(0, 10)" :key="idx">
                          <TableCell 
                            v-for="(field, fieldId) in getTableById(selectedTable)?.fields" 
                            :key="fieldId"
                          >
                            <span 
                              v-if="isColumnVisible(selectedTable, fieldId)"
                              :class="field.sensitive ? 'text-amber-600' : ''"
                            >
                              {{ typeof row[fieldId] === 'number' ? row[fieldId].toLocaleString() : row[fieldId] }}
                            </span>
                            <span v-else class="text-muted-foreground tracking-wider">******</span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
