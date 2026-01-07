<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useNavigation } from '@/composables/useNavigation'
import { 
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const { detailTitle, setDetailTitle } = useNavigation()

// Tab 标题映射
const TAB_TITLES = {
  dimension: '维度数据管理',
  online: '线上账单配置',
  offline: '线下账单配置'
}

// --- 初始数据 ---
const INITIAL_DIM_DATA = {
  customer: [
    { id: 1, code: 'PJT-5001', name: '橘子树去哪儿', contact: '李经理', phone: '13800138000', status: '启用' },
    { id: 2, code: 'PJT-5002', name: '饭饭又饿了', contact: '王总', phone: '13900139000', status: '启用' },
    { id: 3, code: 'PJT-5003', name: '小美严选', contact: '张三', phone: '13700137000', status: '停用' }
  ],
  platform: [
    { id: 1, name: '抖音', code: 'PLAT-DY', type: '电商', status: '启用' },
    { id: 2, name: '淘宝', code: 'PLAT-TB', type: '电商', status: '启用' },
    { id: 3, name: '快手', code: 'PLAT-KS', type: '电商', status: '启用' },
    { id: 4, name: '拼多多', code: 'PLAT-PDD', type: '电商', status: '启用' }
  ],
  store: [
    { id: 1, code: 'SHP-4001', name: '橘子树一号店', customer: '橘子树去哪儿', platform: '淘宝', department: '运营部-淘宝', status: '启用', effectiveDate: '2024-01-01' },
    { id: 2, code: 'SHP-4002', name: '饭饭四号店', customer: '饭饭又饿了', platform: '抖音', department: '运营部-抖音', status: '启用', effectiveDate: '2024-03-15' },
    { id: 3, code: 'SHP-4003', name: '小美严选一店', customer: '小美严选', platform: '拼多多', department: '运营部-拼多多', status: '启用', effectiveDate: '2024-06-01' },
  ],
  department: [
    { id: 1, code: 'DPT-1001', name: '总经办', parent: '-', manager: '张总', financeAttr: '管理费用', status: '启用' },
    { id: 2, code: 'DPT-2001', name: '运营部-淘宝', parent: '运营中心', manager: '李经理', financeAttr: '销售费用', status: '启用' },
    { id: 3, code: 'DPT-2002', name: '研发部', parent: '产研中心', manager: '王工', financeAttr: '研发费用', status: '启用' },
  ],
  employee: [
    { id: 1, name: '张三', code: 'EMP-001', dept: '财务部', title: '会计', status: '在职' },
    { id: 2, name: '李四', code: 'EMP-002', dept: '运营部', title: '运营专员', status: '在职' },
    { id: 3, name: '王五', code: 'EMP-003', dept: '人事部', title: 'HRBP', status: '离职' },
  ],
  product: [
    { id: 1, sku: 'SKU-001', name: '纯棉T恤', cost: 25.00, brand: '自营', category: '服装' },
    { id: 2, sku: 'SKU-002', name: '运动水壶', cost: 12.50, brand: '运动家', category: '百货' },
    { id: 3, sku: 'SKU-003', name: '蓝牙耳机', cost: 85.00, brand: '极客', category: '数码' }
  ],
  subject: [
    { id: 1, code: '6602', name: '管理费用', parent: '期间费用', level: 2, category: '费用' },
    { id: 2, code: '6601', name: '销售费用', parent: '期间费用', level: 2, category: '费用' },
    { id: 3, code: '6001', name: '主营业务收入', parent: '营业收入', level: 2, category: '收入' },
    { id: 4, code: '1001', name: '库存现金', parent: '货币资金', level: 2, category: '资产' }
  ]
}

// 线上账单配置数据
const INITIAL_ONLINE_MAPPING = [
  { id: 1, platform: '快手', type: '结算账单', sourceField: '订单实付(元)', logic: '取值', targetTable: 'F_INCOME', subject: '销售收入', code: '4010101', condition: '' },
  { id: 2, platform: '快手', type: '结算账单', sourceField: '政府补贴+支付营销补贴', logic: '加和', targetTable: 'F_INCOME', subject: '营业外收入', code: '403', condition: '' },
  { id: 3, platform: '抖音', type: '结算账单', sourceField: '用户实付', logic: '取值', targetTable: 'F_INCOME', subject: '销售收入', code: '4010101', condition: 'value > 0' },
  { id: 4, platform: '淘宝', type: '结算账单', sourceField: '订单实际金额(元)', logic: '取值', targetTable: 'F_INCOME', subject: '销售收入', code: '4010101', condition: '' },
]

const INITIAL_ONLINE_STRUCTURE = [
  { id: 1, checkId: 'CHK-001', platform: '快手', type: '结算账单', colName: '订单号', colOrder: 1, valueType: '文本', allowNull: '否', regex: '^[0-9]+$', status: '启用' },
  { id: 2, checkId: 'CHK-002', platform: '快手', type: '结算账单', colName: '实付金额', colOrder: 2, valueType: '数值', allowNull: '否', regex: '', status: '启用' },
  { id: 3, checkId: 'CHK-003', platform: '抖音', type: '订单管理', colName: '订单ID', colOrder: 1, valueType: '文本', allowNull: '否', regex: '', status: '启用' }
]

// 线下账单配置数据
const INITIAL_OFFLINE_MAIN = [
  { id: 1, dimId: 'FlvqbVbIma8So...', dataId: 'tblfsn2XLGxCT60f', date: '付款计划_计划日期', amount: '付款计划_计划金额', category: '支出类别', mapTable: '潮前审批申请单多维表格-A' },
  { id: 2, dimId: '', dataId: 'tblhzDobx7bBgGaU', date: '付款计划_计划日期', amount: '付款计划_计划金额', category: '支出类别', mapTable: '潮前审批申请单多维表格-A' }
]

const INITIAL_OFFLINE_FIELD = [
  { id: 1, mapName: '潮前审批申请单多维表格-A', sourceField: '发起人部门', standardDim: '部门名称', status: true },
  { id: 2, mapName: '潮前审批申请单多维表格-A', sourceField: '发起人', standardDim: '员工姓名', status: true }
]

const INITIAL_OFFLINE_SUBJECT = [
  { id: 1, dictId: 'DIC-001', dictName: '费用类型字典', sourceValue: '差旅费', targetTable: 'F_COST', targetCode: '660101' },
  { id: 2, dictId: 'DIC-001', dictName: '费用类型字典', sourceValue: '办公用品', targetTable: 'F_COST', targetCode: '660102' },
  { id: 3, dictId: 'DIC-002', dictName: '支出类别字典', sourceValue: '采购付款', targetTable: 'F_COST', targetCode: '6401' }
]

const DIM_TABS = [
  { key: 'customer', label: '客户管理' },
  { key: 'platform', label: '平台管理' },
  { key: 'store', label: '店铺管理' },
  { key: 'department', label: '部门管理' },
  { key: 'employee', label: '员工管理' },
  { key: 'product', label: '商品管理' },
  { key: 'subject', label: '科目管理' },
]

const FORM_SCHEMAS = {
  customer: [
    { key: 'code', label: '客户ID', type: 'text', disabled: true, placeholder: '自动生成' },
    { key: 'name', label: '客户名称', type: 'text' },
    { key: 'contact', label: '联系人', type: 'text' },
    { key: 'phone', label: '联系电话', type: 'text' },
    { key: 'status', label: '状态', type: 'select', options: ['启用', '停用'] }
  ],
  platform: [
    { key: 'name', label: '平台名称', type: 'text' },
    { key: 'code', label: '编码', type: 'text' },
    { key: 'type', label: '平台类型', type: 'select', options: ['电商', '社交', '线下'] },
    { key: 'status', label: '状态', type: 'select', options: ['启用', '停用'] }
  ],
  store: [
    { key: 'code', label: '店铺ID', type: 'text', disabled: true },
    { key: 'name', label: '店铺名称', type: 'text' },
    { key: 'customer', label: '归属客户', type: 'select', options: INITIAL_DIM_DATA.customer.map(c=>c.name) },
    { key: 'platform', label: '归属平台', type: 'select', options: INITIAL_DIM_DATA.platform.map(p=>p.name) },
    { key: 'department', label: '归属部门', type: 'select', options: INITIAL_DIM_DATA.department.map(d=>d.name) },
    { key: 'status', label: '状态', type: 'select', options: ['启用', '停用'] },
    { key: 'effectiveDate', label: '生效日期', type: 'date' }
  ],
  department: [
    { key: 'code', label: '部门ID', type: 'text' },
    { key: 'name', label: '部门名称', type: 'text' },
    { key: 'parent', label: '上级部门', type: 'text' },
    { key: 'manager', label: '部门负责人', type: 'text' },
    { key: 'financeAttr', label: '财务属性', type: 'select', options: ['管理费用', '销售费用', '研发费用', '生产成本'] },
    { key: 'status', label: '状态', type: 'select', options: ['启用', '停用'] }
  ],
  employee: [
    { key: 'name', label: '员工姓名', type: 'text' },
    { key: 'code', label: '工号', type: 'text' },
    { key: 'dept', label: '所属部门', type: 'select', options: INITIAL_DIM_DATA.department.map(d=>d.name) },
    { key: 'title', label: '岗位', type: 'text' },
    { key: 'status', label: '状态', type: 'select', options: ['在职', '离职'] }
  ],
  product: [
    { key: 'sku', label: '商品SKU', type: 'text' },
    { key: 'name', label: '商品名称', type: 'text' },
    { key: 'cost', label: '商品成本', type: 'number' },
    { key: 'brand', label: '品牌', type: 'text' },
    { key: 'category', label: '品类', type: 'text' }
  ],
  subject: [
    { key: 'code', label: '科目编码', type: 'text' },
    { key: 'name', label: '科目名称', type: 'text' },
    { key: 'parent', label: '上级科目', type: 'text' },
    { key: 'level', label: '科目层级', type: 'number' },
    { key: 'category', label: '科目类别', type: 'select', options: ['资产', '负债', '权益', '收入', '成本', '费用'] }
  ],
  online_mapping: [
    { key: 'platform', label: '源平台', type: 'select', options: INITIAL_DIM_DATA.platform.map(p=>p.name) },
    { key: 'type', label: '源账单类型', type: 'select', options: ['订单管理', '结算账单', '资金账单', '保证金账单'] },
    { key: 'sourceField', label: '源字段名', type: 'text' },
    { key: 'logic', label: '计算逻辑', type: 'select', options: ['取值', '加和'] },
    { key: 'targetTable', label: '目标事实表', type: 'text' },
    { key: 'subject', label: '财务科目', type: 'text' },
    { key: 'code', label: '科目编码', type: 'text' },
    { key: 'condition', label: '过滤条件', type: 'text', placeholder: '如: value > 0' }
  ],
  online_structure: [
    { key: 'checkId', label: '校验ID', type: 'text', disabled: true, placeholder: '自动生成' },
    { key: 'platform', label: '平台名称', type: 'select', options: INITIAL_DIM_DATA.platform.map(p=>p.name) },
    { key: 'type', label: '账单类型', type: 'select', options: ['订单管理', '结算账单', '资金账单', '保证金账单'] },
    { key: 'colName', label: '列名', type: 'text' },
    { key: 'colOrder', label: '列顺序', type: 'number' },
    { key: 'valueType', label: '期望数值类型', type: 'select', options: ['文本', '数值', '布尔值'] },
    { key: 'allowNull', label: '是否允许为空', type: 'select', options: ['是', '否'] },
    { key: 'regex', label: '校验正则表达式', type: 'text' },
    { key: 'status', label: '状态', type: 'select', options: ['启用', '停用'] }
  ],
  offline_main: [
    { key: 'dimId', label: '多维表ID', type: 'text' },
    { key: 'dataId', label: '数据表ID', type: 'text' },
    { key: 'date', label: '日期字段', type: 'text' },
    { key: 'amount', label: '报销金额字段', type: 'text' },
    { key: 'category', label: '支出类别字段', type: 'text' },
    { key: 'mapTable', label: '字段映射表', type: 'text' }
  ],
  offline_field: [
    { key: 'mapName', label: '映射集名称', type: 'text' },
    { key: 'sourceField', label: '源表字段名', type: 'text' },
    { key: 'standardDim', label: '中台标准维度', type: 'text' },
    { key: 'status', label: '状态', type: 'select', options: ['启用', '停用'] }
  ],
  offline_subject: [
    { key: 'dictId', label: '字典ID', type: 'text' },
    { key: 'dictName', label: '字典名称', type: 'text' },
    { key: 'sourceValue', label: '源业务值', type: 'text' },
    { key: 'targetTable', label: '目标事实表', type: 'text' },
    { key: 'targetCode', label: '目标科目编码', type: 'text' }
  ]
}

// --- 状态 ---
const mainTab = ref('dimension')
const dimensionSubTab = ref('customer')
const onlineSubTab = ref('mapping')
const offlineSubTab = ref('main')

const dimData = reactive({ ...INITIAL_DIM_DATA })
const onlineMappingData = ref([...INITIAL_ONLINE_MAPPING])
const onlineStructureData = ref([...INITIAL_ONLINE_STRUCTURE])
const offlineMainData = ref([...INITIAL_OFFLINE_MAIN])
const offlineFieldData = ref([...INITIAL_OFFLINE_FIELD])
const offlineSubjectData = ref([...INITIAL_OFFLINE_SUBJECT])

const searchText = ref('')
const dialogOpen = ref(false)
const dialogType = ref('add')
const formData = reactive({})

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10
})

// --- 计算属性 ---
const currentData = computed(() => {
  let data = []
  
  if (mainTab.value === 'dimension') {
    data = dimData[dimensionSubTab.value] || []
  } else if (mainTab.value === 'online') {
    data = onlineSubTab.value === 'mapping' ? onlineMappingData.value : onlineStructureData.value
  } else if (mainTab.value === 'offline') {
    if (offlineSubTab.value === 'main') data = offlineMainData.value
    else if (offlineSubTab.value === 'field') data = offlineFieldData.value
    else if (offlineSubTab.value === 'subject') data = offlineSubjectData.value
  }
  
  if (searchText.value) {
    const key = searchText.value.toLowerCase()
    data = data.filter(row => 
      Object.values(row).some(v => 
        String(v).toLowerCase().includes(key)
      )
    )
  }
  return data
})

const paginatedData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return currentData.value.slice(start, start + pagination.pageSize)
})

const totalPages = computed(() => Math.ceil(currentData.value.length / pagination.pageSize))

const currentSchema = computed(() => {
  if (mainTab.value === 'dimension') {
    return FORM_SCHEMAS[dimensionSubTab.value] || []
  } else if (mainTab.value === 'online') {
    return onlineSubTab.value === 'mapping' ? FORM_SCHEMAS.online_mapping : FORM_SCHEMAS.online_structure
  } else if (mainTab.value === 'offline') {
    if (offlineSubTab.value === 'main') return FORM_SCHEMAS.offline_main
    if (offlineSubTab.value === 'field') return FORM_SCHEMAS.offline_field
    if (offlineSubTab.value === 'subject') return FORM_SCHEMAS.offline_subject
  }
  return []
})

const getTabLabel = (key) => {
  const map = {customer:'客户', platform:'平台', store:'店铺', department:'部门', employee:'员工', product:'商品', subject:'科目'}
  return map[key] || key
}

const getDialogTitle = () => {
  const prefix = dialogType.value === 'add' ? '新增' : '编辑'
  if (mainTab.value === 'dimension') {
    return `${prefix}${getTabLabel(dimensionSubTab.value)}数据`
  } else if (mainTab.value === 'online') {
    return `${prefix}${onlineSubTab.value === 'mapping' ? '科目映射' : '账单结构'}配置`
  } else if (mainTab.value === 'offline') {
    const map = { main: '主流程规则', field: '字段映射', subject: '科目映射' }
    return `${prefix}${map[offlineSubTab.value]}配置`
  }
  return `${prefix}配置`
}

// 监听 tab 变化，重置分页并更新面包屑
watch([mainTab, dimensionSubTab, onlineSubTab, offlineSubTab], () => {
  pagination.current = 1
  searchText.value = ''
})

// 监听 mainTab 变化，设置第三级面包屑
watch(mainTab, (newVal) => {
  setDetailTitle(TAB_TITLES[newVal])
}, { immediate: true })

// 监听外部面包屑变化（用户点击面包屑返回时）
watch(detailTitle, (newVal) => {
  if (!newVal) {
    // 当面包屑被清除时，重置为默认 tab
    mainTab.value = 'dimension'
    setDetailTitle(TAB_TITLES['dimension'])
  }
})

// 组件卸载时清除面包屑
onUnmounted(() => {
  setDetailTitle(null)
})

// --- 方法 ---
const openDialog = (type, data = null) => {
  dialogType.value = type
  if (type === 'edit' && data) {
    Object.assign(formData, JSON.parse(JSON.stringify(data)))
  } else {
    // 清空表单
    currentSchema.value.forEach(field => {
      formData[field.key] = ''
    })
    formData.id = null
  }
  dialogOpen.value = true
}

const handleSave = () => {
  const isEdit = !!formData.id
  const newData = { ...formData, id: formData.id || Date.now() }
  
  if (mainTab.value === 'dimension') {
    const list = dimData[dimensionSubTab.value]
    if (isEdit) {
      const idx = list.findIndex(i => i.id === newData.id)
      if (idx !== -1) list[idx] = newData
    } else {
      list.unshift(newData)
    }
  } else if (mainTab.value === 'online') {
    if (onlineSubTab.value === 'mapping') {
      if (isEdit) {
        onlineMappingData.value = onlineMappingData.value.map(i => i.id === newData.id ? newData : i)
      } else {
        onlineMappingData.value.unshift(newData)
      }
    } else {
      if (isEdit) {
        onlineStructureData.value = onlineStructureData.value.map(i => i.id === newData.id ? newData : i)
      } else {
        onlineStructureData.value.unshift(newData)
      }
    }
  } else if (mainTab.value === 'offline') {
    if (offlineSubTab.value === 'main') {
      if (isEdit) {
        offlineMainData.value = offlineMainData.value.map(i => i.id === newData.id ? newData : i)
      } else {
        offlineMainData.value.unshift(newData)
      }
    } else if (offlineSubTab.value === 'field') {
      if (isEdit) {
        offlineFieldData.value = offlineFieldData.value.map(i => i.id === newData.id ? newData : i)
      } else {
        offlineFieldData.value.unshift(newData)
      }
    } else if (offlineSubTab.value === 'subject') {
      if (isEdit) {
        offlineSubjectData.value = offlineSubjectData.value.map(i => i.id === newData.id ? newData : i)
      } else {
        offlineSubjectData.value.unshift(newData)
      }
    }
  }
  dialogOpen.value = false
}

const handleDelete = (id) => {
  if(!confirm('确定要删除吗？')) return
  
  if (mainTab.value === 'dimension') {
    dimData[dimensionSubTab.value] = dimData[dimensionSubTab.value].filter(i => i.id !== id)
  } else if (mainTab.value === 'online') {
    if (onlineSubTab.value === 'mapping') {
      onlineMappingData.value = onlineMappingData.value.filter(i => i.id !== id)
    } else {
      onlineStructureData.value = onlineStructureData.value.filter(i => i.id !== id)
    }
  } else if (mainTab.value === 'offline') {
    if (offlineSubTab.value === 'main') {
      offlineMainData.value = offlineMainData.value.filter(i => i.id !== id)
    } else if (offlineSubTab.value === 'field') {
      offlineFieldData.value = offlineFieldData.value.filter(i => i.id !== id)
    } else if (offlineSubTab.value === 'subject') {
      offlineSubjectData.value = offlineSubjectData.value.filter(i => i.id !== id)
    }
  }
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
    <!-- Teleport 主 Tabs 到面包屑区域 -->
    <Teleport to="#breadcrumb-actions" defer>
      <Tabs v-model:model-value="mainTab" class="w-auto">
        <TabsList>
          <TabsTrigger value="dimension">维度数据管理</TabsTrigger>
          <TabsTrigger value="online">线上账单配置</TabsTrigger>
          <TabsTrigger value="offline">线下账单配置</TabsTrigger>
        </TabsList>
      </Tabs>
    </Teleport>
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden bg-muted/30">
      <!-- Sub Tabs for Dimension -->
      <div v-if="mainTab === 'dimension'" class="bg-white dark:bg-slate-950 border-b px-6">
        <Tabs v-model:model-value="dimensionSubTab">
          <TabsList class="h-12 w-auto bg-transparent p-0 justify-start gap-6">
            <TabsTrigger 
              v-for="tab in DIM_TABS" 
              :key="tab.key" 
              :value="tab.key"
              class="relative h-12 !flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <!-- Sub Tabs for Online -->
      <div v-if="mainTab === 'online'" class="bg-white dark:bg-slate-950 border-b px-6">
        <Tabs v-model:model-value="onlineSubTab">
          <TabsList class="h-12 w-auto bg-transparent p-0 justify-start gap-6">
            <TabsTrigger 
              value="mapping"
              class="relative h-12 !flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              科目映射表
            </TabsTrigger>
            <TabsTrigger 
              value="structure"
              class="relative h-12 !flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              账单结构定义表
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <!-- Sub Tabs for Offline -->
      <div v-if="mainTab === 'offline'" class="bg-white dark:bg-slate-950 border-b px-6">
        <Tabs v-model:model-value="offlineSubTab">
          <TabsList class="h-12 w-auto bg-transparent p-0 justify-start gap-6">
            <TabsTrigger 
              value="main"
              class="relative h-12 !flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              主流程规则表
            </TabsTrigger>
            <TabsTrigger 
              value="field"
              class="relative h-12 !flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              字段映射表
            </TabsTrigger>
            <TabsTrigger 
              value="subject"
              class="relative h-12 !flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!border-b-2 focus-visible:!border-t-0 focus-visible:!border-x-0 data-[state=active]:!border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:!shadow-none hover:text-primary data-[state=active]:!bg-transparent"
            >
              科目映射表
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <!-- Table Area -->
      <div class="flex-1 p-6 overflow-hidden flex flex-col">
        <div class="bg-white dark:bg-slate-950 rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
          <!-- Toolbar -->
          <div class="p-4 border-b flex items-center gap-4">
            <div class="relative w-72">
              <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                v-model="searchText"
                type="search" 
                placeholder="搜索..." 
                class="pl-9"
              />
            </div>
            <div class="flex-1"></div>
            <Button variant="ghost" size="sm">
              <RefreshCw class="mr-2 h-4 w-4" /> 刷新
            </Button>
            <Button variant="ghost" size="sm" @click="openDialog('add')">
              <Plus class="mr-2 h-4 w-4" /> 新增配置
            </Button>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <!-- Dimension Tables -->
                  <template v-if="mainTab === 'dimension'">
                    <template v-if="dimensionSubTab === 'customer'">
                      <TableHead>ID</TableHead>
                      <TableHead>客户名称</TableHead>
                      <TableHead>联系人</TableHead>
                      <TableHead>电话</TableHead>
                      <TableHead>状态</TableHead>
                    </template>
                    <template v-else-if="dimensionSubTab === 'platform'">
                      <TableHead>平台名称</TableHead>
                      <TableHead>编码</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>状态</TableHead>
                    </template>
                    <template v-else-if="dimensionSubTab === 'store'">
                      <TableHead>店铺名称</TableHead>
                      <TableHead>编码</TableHead>
                      <TableHead>平台</TableHead>
                      <TableHead>客户</TableHead>
                      <TableHead>部门</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>生效日期</TableHead>
                    </template>
                    <template v-else-if="dimensionSubTab === 'department'">
                      <TableHead>部门名称</TableHead>
                      <TableHead>编码</TableHead>
                      <TableHead>上级</TableHead>
                      <TableHead>负责人</TableHead>
                      <TableHead>财务属性</TableHead>
                      <TableHead>状态</TableHead>
                    </template>
                    <template v-else-if="dimensionSubTab === 'employee'">
                      <TableHead>姓名</TableHead>
                      <TableHead>工号</TableHead>
                      <TableHead>部门</TableHead>
                      <TableHead>岗位</TableHead>
                      <TableHead>状态</TableHead>
                    </template>
                    <template v-else-if="dimensionSubTab === 'product'">
                      <TableHead>SKU</TableHead>
                      <TableHead>名称</TableHead>
                      <TableHead>成本</TableHead>
                      <TableHead>品牌</TableHead>
                      <TableHead>品类</TableHead>
                    </template>
                    <template v-else-if="dimensionSubTab === 'subject'">
                      <TableHead>编码</TableHead>
                      <TableHead>名称</TableHead>
                      <TableHead>上级</TableHead>
                      <TableHead>层级</TableHead>
                      <TableHead>类别</TableHead>
                    </template>
                  </template>
                  
                  <!-- Online Tables -->
                  <template v-else-if="mainTab === 'online'">
                    <template v-if="onlineSubTab === 'mapping'">
                      <TableHead>源平台</TableHead>
                      <TableHead>账单类型</TableHead>
                      <TableHead>源字段名</TableHead>
                      <TableHead>逻辑</TableHead>
                      <TableHead>目标表</TableHead>
                      <TableHead>财务科目</TableHead>
                      <TableHead>科目编码</TableHead>
                      <TableHead>条件</TableHead>
                    </template>
                    <template v-else>
                      <TableHead>校验ID</TableHead>
                      <TableHead>平台</TableHead>
                      <TableHead>账单类型</TableHead>
                      <TableHead>列名</TableHead>
                      <TableHead>顺序</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>允许空</TableHead>
                      <TableHead>正则校验</TableHead>
                      <TableHead>状态</TableHead>
                    </template>
                  </template>
                  
                  <!-- Offline Tables -->
                  <template v-else-if="mainTab === 'offline'">
                    <template v-if="offlineSubTab === 'main'">
                      <TableHead>多维表ID</TableHead>
                      <TableHead>数据表ID</TableHead>
                      <TableHead>日期字段</TableHead>
                      <TableHead>金额字段</TableHead>
                      <TableHead>类别字段</TableHead>
                      <TableHead>映射表</TableHead>
                    </template>
                    <template v-else-if="offlineSubTab === 'field'">
                      <TableHead>映射集名称</TableHead>
                      <TableHead>源表字段</TableHead>
                      <TableHead>中台标准维度</TableHead>
                      <TableHead>状态</TableHead>
                    </template>
                    <template v-else-if="offlineSubTab === 'subject'">
                      <TableHead>字典ID</TableHead>
                      <TableHead>字典名称</TableHead>
                      <TableHead>源值</TableHead>
                      <TableHead>目标表</TableHead>
                      <TableHead>目标科目</TableHead>
                    </template>
                  </template>
                  
                  <TableHead class="text-right w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="row in paginatedData" :key="row.id" class="hover:bg-muted/50">
                  <!-- Dimension Data -->
                  <template v-if="mainTab === 'dimension'">
                    <template v-if="dimensionSubTab === 'customer'">
                      <TableCell class="font-mono text-muted-foreground">{{ row.code }}</TableCell>
                      <TableCell class="font-medium">{{ row.name }}</TableCell>
                      <TableCell>{{ row.contact }}</TableCell>
                      <TableCell class="font-mono text-muted-foreground">{{ row.phone }}</TableCell>
                      <TableCell>
                        <Badge :variant="row.status === '启用' ? 'default' : 'secondary'">{{ row.status }}</Badge>
                      </TableCell>
                    </template>
                    <template v-else-if="dimensionSubTab === 'platform'">
                      <TableCell class="font-medium">{{ row.name }}</TableCell>
                      <TableCell class="font-mono text-muted-foreground">{{ row.code }}</TableCell>
                      <TableCell><Badge variant="outline">{{ row.type }}</Badge></TableCell>
                      <TableCell>
                        <Badge :variant="row.status === '启用' ? 'default' : 'secondary'">{{ row.status }}</Badge>
                      </TableCell>
                    </template>
                    <template v-else-if="dimensionSubTab === 'store'">
                      <TableCell class="font-medium">{{ row.name }}</TableCell>
                      <TableCell class="font-mono text-muted-foreground">{{ row.code }}</TableCell>
                      <TableCell>{{ row.platform }}</TableCell>
                      <TableCell>{{ row.customer }}</TableCell>
                      <TableCell class="text-primary">{{ row.department }}</TableCell>
                      <TableCell>
                        <Badge :variant="row.status === '启用' ? 'default' : 'secondary'">{{ row.status }}</Badge>
                      </TableCell>
                      <TableCell class="font-mono text-sm">{{ row.effectiveDate }}</TableCell>
                    </template>
                    <template v-else-if="dimensionSubTab === 'department'">
                      <TableCell class="font-medium">{{ row.name }}</TableCell>
                      <TableCell class="font-mono text-muted-foreground">{{ row.code }}</TableCell>
                      <TableCell>{{ row.parent }}</TableCell>
                      <TableCell>{{ row.manager }}</TableCell>
                      <TableCell><Badge variant="outline">{{ row.financeAttr }}</Badge></TableCell>
                      <TableCell>
                        <Badge :variant="row.status === '启用' ? 'default' : 'secondary'">{{ row.status }}</Badge>
                      </TableCell>
                    </template>
                    <template v-else-if="dimensionSubTab === 'employee'">
                      <TableCell class="font-medium">{{ row.name }}</TableCell>
                      <TableCell class="font-mono text-muted-foreground">{{ row.code }}</TableCell>
                      <TableCell>{{ row.dept }}</TableCell>
                      <TableCell>{{ row.title }}</TableCell>
                      <TableCell>
                        <Badge :variant="row.status === '在职' ? 'default' : 'secondary'">{{ row.status }}</Badge>
                      </TableCell>
                    </template>
                    <template v-else-if="dimensionSubTab === 'product'">
                      <TableCell class="font-mono text-muted-foreground">{{ row.sku }}</TableCell>
                      <TableCell class="font-medium">{{ row.name }}</TableCell>
                      <TableCell class="font-mono">¥ {{ row.cost?.toFixed(2) }}</TableCell>
                      <TableCell>{{ row.brand }}</TableCell>
                      <TableCell>{{ row.category }}</TableCell>
                    </template>
                    <template v-else-if="dimensionSubTab === 'subject'">
                      <TableCell class="font-mono text-muted-foreground">{{ row.code }}</TableCell>
                      <TableCell class="font-medium">{{ row.name }}</TableCell>
                      <TableCell>{{ row.parent }}</TableCell>
                      <TableCell>
                        <span class="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">{{ row.level }}</span>
                      </TableCell>
                      <TableCell class="text-primary">{{ row.category }}</TableCell>
                    </template>
                  </template>
                  
                  <!-- Online Data -->
                  <template v-else-if="mainTab === 'online'">
                    <template v-if="onlineSubTab === 'mapping'">
                      <TableCell class="font-medium">{{ row.platform }}</TableCell>
                      <TableCell>{{ row.type }}</TableCell>
                      <TableCell><span class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{{ row.sourceField }}</span></TableCell>
                      <TableCell><Badge variant="outline" class="bg-primary/10 text-primary border-primary/20">{{ row.logic }}</Badge></TableCell>
                      <TableCell>{{ row.targetTable }}</TableCell>
                      <TableCell class="font-medium">{{ row.subject }}</TableCell>
                      <TableCell class="font-mono text-muted-foreground">{{ row.code }}</TableCell>
                      <TableCell class="font-mono text-xs text-amber-600">{{ row.condition }}</TableCell>
                    </template>
                    <template v-else>
                      <TableCell class="font-mono text-xs text-muted-foreground">{{ row.checkId }}</TableCell>
                      <TableCell class="font-medium">{{ row.platform }}</TableCell>
                      <TableCell>{{ row.type }}</TableCell>
                      <TableCell class="font-medium">{{ row.colName }}</TableCell>
                      <TableCell><span class="bg-muted px-2 rounded text-xs">{{ row.colOrder }}</span></TableCell>
                      <TableCell>{{ row.valueType }}</TableCell>
                      <TableCell>{{ row.allowNull }}</TableCell>
                      <TableCell class="font-mono text-xs text-muted-foreground truncate max-w-[100px]">{{ row.regex }}</TableCell>
                      <TableCell>
                        <Badge :variant="row.status === '启用' ? 'default' : 'secondary'">{{ row.status }}</Badge>
                      </TableCell>
                    </template>
                  </template>
                  
                  <!-- Offline Data -->
                  <template v-else-if="mainTab === 'offline'">
                    <template v-if="offlineSubTab === 'main'">
                      <TableCell class="font-mono text-xs text-muted-foreground truncate max-w-[120px]">{{ row.dimId || '-' }}</TableCell>
                      <TableCell class="font-mono text-xs">{{ row.dataId }}</TableCell>
                      <TableCell>{{ row.date }}</TableCell>
                      <TableCell>{{ row.amount }}</TableCell>
                      <TableCell>{{ row.category }}</TableCell>
                      <TableCell class="text-primary text-xs">{{ row.mapTable }}</TableCell>
                    </template>
                    <template v-else-if="offlineSubTab === 'field'">
                      <TableCell class="font-medium">{{ row.mapName }}</TableCell>
                      <TableCell>{{ row.sourceField }}</TableCell>
                      <TableCell><Badge variant="outline" class="bg-primary/10 text-primary border-primary/20">{{ row.standardDim }}</Badge></TableCell>
                      <TableCell>
                        <Check v-if="row.status" class="h-4 w-4 text-emerald-500" />
                      </TableCell>
                    </template>
                    <template v-else-if="offlineSubTab === 'subject'">
                      <TableCell class="font-mono text-xs text-muted-foreground">{{ row.dictId }}</TableCell>
                      <TableCell class="font-medium">{{ row.dictName }}</TableCell>
                      <TableCell class="text-primary font-medium">{{ row.sourceValue }}</TableCell>
                      <TableCell class="font-mono text-muted-foreground">{{ row.targetTable }}</TableCell>
                      <TableCell><span class="font-mono bg-muted px-2 rounded">{{ row.targetCode }}</span></TableCell>
                    </template>
                  </template>
                  
                  <TableCell class="text-right">
                    <div class="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" class="h-8 w-8" @click="openDialog('edit', row)">
                        <Pencil class="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive" @click="handleDelete(row.id)">
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Pagination -->
          <div class="p-4 border-t flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              共 {{ currentData.length }} 条记录
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
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ getDialogTitle() }}</DialogTitle>
        </DialogHeader>
        
        <div class="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div v-for="field in currentSchema" :key="field.key" class="grid gap-2">
            <label class="text-sm font-medium">{{ field.label }}</label>
            <Select 
              v-if="field.type === 'select'"
              v-model="formData[field.key]"
            >
              <SelectTrigger>
                <SelectValue :placeholder="`请选择${field.label}`" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              v-else
              v-model="formData[field.key]"
              :type="field.type || 'text'"
              :placeholder="field.placeholder"
              :disabled="field.disabled"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">取消</Button>
          <Button @click="handleSave">保存配置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
