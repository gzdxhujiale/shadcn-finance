<script setup>
import { ref, computed, watch } from 'vue'
import { useNavigation } from '@/composables/useNavigation'
import { 
  Search, 
  ChevronRight,
  PlayCircle,
  FileText,
  Rocket,
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const { detailTitle, setDetailTitle } = useNavigation()


// --- 帮助文档数据 ---
const HELP_DOCS = [
  { id: 1, category: '快速入门', title: '系统概述', desc: '了解财务中心的整体架构和功能模块', icon: '📖', content: `## 系统概述

财务中心是一个面向电商企业的综合财务数据分析平台，主要包含以下核心模块：

### 核心功能模块
1. **数据分析** - 三大经营仓（公司、阿米巴、店铺）提供多维度财务分析
2. **自助数据看板** - 类Tableau的拖拽式报表配置器
3. **权限中心** - 基于RBAC的用户权限管理
4. **系统设置** - 配置管理、通知设置、数据字典

### 数据架构
- 数据源：对接ERP、电商平台、财务系统
- 数据仓库：分层架构（ODS→DWD→DWS→ADS）
- 数据更新：T+1日更新，部分指标支持实时

### 适用角色
财务人员、业务分析师、管理层、运营人员` },
  { id: 2, category: '快速入门', title: '首次使用指南', desc: '新用户快速上手教程', icon: '🚀', content: `## 首次使用指南

### 第一步：登录系统
使用管理员分配的账号密码登录系统，首次登录建议修改密码。

### 第二步：了解导航
- 左侧导航栏包含所有功能模块
- 点击展开/收起子菜单
- 常用功能可添加到收藏夹

### 第三步：查看报表
1. 进入【数据分析】选择对应的经营仓
2. 使用时间筛选器选择分析周期
3. 点击数据行可查看明细

### 常用快捷操作
- 双击表头可排序
- 右键菜单可导出数据
- Ctrl+F 快速搜索` },
  { id: 3, category: '报表使用', title: '公司经营仓使用说明', desc: '如何查看和分析三大财务报表', icon: '📊', content: `## 公司经营仓使用说明

### 功能概述
公司经营仓提供企业级财务报表分析，包含资产负债表、利润表、现金流量表和预算监控。

### 资产负债表
- 展示企业资产、负债、所有者权益结构
- 支持展开/收起查看明细科目
- 点击叶子节点可查看凭证明细

### 利润表
- 展示收入、成本、费用、利润结构
- 支持同比/环比分析
- 可追溯到具体业务明细` },
  { id: 4, category: '报表使用', title: '阿米巴经营仓使用说明', desc: '部门核算数据查看与分析', icon: '🎯', content: `## 阿米巴经营仓使用说明

### 什么是阿米巴经营
阿米巴经营是将企业划分为最小经营单元，独立核算收入、成本、利润的管理模式。

### 核心指标说明
- **经营收入**：阿米巴单元的全部收入
- **可控成本**：单元可直接控制的成本（人力、业务费用等）
- **边际贡献**：收入减去可控成本
- **分摊成本**：按规则分摊的间接成本
- **核算利润**：边际贡献减去分摊成本` },
  { id: 5, category: '报表使用', title: '店铺经营仓使用说明', desc: '多平台店铺数据分析指南', icon: '🏪', content: `## 店铺经营仓使用说明

### 功能概述
店铺经营仓提供多平台（淘宝、抖音、快手等）店铺级别的经营数据分析。

### 核心指标
- **GMV**：商品交易总额
- **毛利率/净利率**：盈利能力指标
- **退货率**：商品质量和服务指标
- **ROI**：投资回报率
- **客单价**：平均订单金额` },
  { id: 6, category: '配置管理', title: '维度数据配置', desc: '客户、平台、店铺等维度数据管理', icon: '⚙️', content: `## 维度数据配置

### 功能说明
维度数据配置用于管理系统中的基础数据，包括客户、平台、店铺等维度信息。

### 客户管理
- 新增/编辑/删除客户信息
- 设置客户编码、名称、联系方式
- 关联客户与店铺的归属关系` },
  { id: 7, category: '常见问题', title: 'FAQ', desc: '常见问题解答', icon: '❓', content: `## 常见问题解答

### Q1: 数据什么时候更新？
A: 系统数据T+1日更新，每日凌晨2:00完成数据同步。部分实时指标每小时更新。

### Q2: 为什么看到的数据和平台不一致？
A: 可能原因：
- 数据同步延迟
- 口径定义不同（如GMV是否含取消订单）
- 时区差异

### Q3: 如何导出数据？
A: 报表页面点击"导出Excel"按钮。` },
]

const videoTutorials = [
  { title: '系统概览介绍', duration: 5, thumbnail: 'overview' },
  { title: '报表分析教程', duration: 8, thumbnail: 'reports' },
  { title: '配置管理指南', duration: 11, thumbnail: 'config' },
]

// --- 状态 ---
const searchText = ref('')
const selectedDocId = ref(null)

const docCategories = computed(() => [...new Set(HELP_DOCS.map(d => d.category))])

const filteredDocs = computed(() => {
  if (!searchText.value) return HELP_DOCS
  const key = searchText.value.toLowerCase()
  return HELP_DOCS.filter(d => 
    d.title.toLowerCase().includes(key) || 
    d.desc.toLowerCase().includes(key)
  )
})

const selectedDoc = computed(() => {
  if (!selectedDocId.value) return null
  return HELP_DOCS.find(d => d.id === selectedDocId.value)
})

const getCategoryIcon = (cat) => {
  const map = {
    '快速入门': Rocket,
    '报表使用': BarChart3,
    '配置管理': Settings,
    '常见问题': HelpCircle
  }
  return map[cat] || FileText
}

const openDoc = (doc) => {
  selectedDocId.value = doc.id
  setDetailTitle(doc.title) // 设置第三级面包屑
}

const backToList = () => {
  selectedDocId.value = null
  setDetailTitle(null) // 清除第三级面包屑
}

const parseDocContent = (content) => {
  if (!content) return []
  return content.split('\n').map((line) => {
    if (line.startsWith('## ')) return { type: 'h2', text: line.replace('## ', '') }
    if (line.startsWith('### ')) return { type: 'h3', text: line.replace('### ', '') }
    if (line.startsWith('**') && line.endsWith('**')) return { type: 'bold', text: line.replace(/\*\*/g, '') }
    if (line.startsWith('- ')) return { type: 'li', text: line.replace('- ', '') }
    if (line.match(/^\d+\./)) return { type: 'li-decimal', text: line.replace(/^\d+\.\s*/, '') }
    if (line.startsWith('Q')) return { type: 'q', text: line }
    if (line.startsWith('A:')) return { type: 'a', text: line.replace('A: ', '') }
    if (line.trim() === '') return { type: 'empty' }
    return { type: 'p', text: line }
  })
}

const parsedSelectedDoc = computed(() => {
  if (!selectedDoc.value) return []
  return parseDocContent(selectedDoc.value.content)
})

// 监听面包屑变化，同步 selectedDocId
watch(detailTitle, (newVal) => {
  if (!newVal) {
    // 当面包屑的详情页被清除时（用户点击了面包屑返回），同步清除 selectedDocId
    selectedDocId.value = null
  }
})
</script>

<template>
  <!-- Teleport 搜索框到面包屑区域 -->
  <Teleport to="#breadcrumb-actions" defer>
    <div class="relative w-64">
      <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input 
        v-model="searchText"
        type="search" 
        placeholder="搜索帮助文档..." 
        class="pl-9 h-9"
      />
    </div>
  </Teleport>

  <div class="h-full flex flex-col">
    <!-- 列表视图 -->
    <ScrollArea v-if="!selectedDocId" class="flex-1 p-6">
      <div class="space-y-10 max-w-6xl mx-auto">
        <!-- 文档分类列表 -->
        <div v-for="cat in docCategories" :key="cat" class="bg-white dark:bg-slate-950 rounded-xl border shadow-sm overflow-hidden">
          <div class="p-5 border-b flex items-center gap-3">
            <component :is="getCategoryIcon(cat)" class="h-5 w-5 text-primary" />
            <h3 class="font-bold">{{ cat }}</h3>
            <Badge variant="secondary" class="ml-auto">
              {{ filteredDocs.filter(d => d.category === cat).length }} 篇
            </Badge>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">
            <div 
              v-for="doc in filteredDocs.filter(d => d.category === cat)" 
              :key="doc.id" 
              @click="openDoc(doc)" 
              class="p-5 hover:bg-muted/50 transition-all cursor-pointer group"
            >
              <div class="flex items-start gap-4">
                <div class="text-3xl">{{ doc.icon }}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium group-hover:text-primary transition-colors">{{ doc.title }}</div>
                  <div class="text-sm text-muted-foreground mt-1 line-clamp-2">{{ doc.desc }}</div>
                </div>
                <ChevronRight class="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        </div>

        <!-- 视频教程 -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
          <div class="flex items-center gap-4 mb-6">
            <PlayCircle class="h-8 w-8" />
            <div>
              <h3 class="text-xl font-bold">视频教程</h3>
              <p class="text-indigo-200 text-sm">观看视频快速掌握系统使用方法</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div v-for="video in videoTutorials" :key="video.title" class="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer group">
              <div class="aspect-video bg-black/20 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <PlayCircle class="h-10 w-10 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all z-10" />
              </div>
              <div class="font-medium">{{ video.title }}</div>
              <div class="text-xs text-indigo-200 mt-1">时长: {{ video.duration }} 分钟</div>
            </div>
          </div>
        </div>

        <!-- 联系支持 -->
        <div class="bg-muted/30 rounded-xl p-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <HelpCircle class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 class="font-medium">找不到答案？</h4>
              <p class="text-sm text-muted-foreground">联系技术支持团队获取帮助</p>
            </div>
          </div>
          <Button variant="outline">
            联系支持
          </Button>
        </div>
      </div>
    </ScrollArea>

    <!-- 详情视图 -->
    <ScrollArea v-else class="flex-1">
      <div class="max-w-4xl mx-auto p-8">
        <!-- 文档头部 -->
        <div class="mb-8 pb-6 border-b">
          <div class="flex items-center gap-4 mb-4">
            <div class="text-5xl">{{ selectedDoc?.icon }}</div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold mb-2">{{ selectedDoc?.title }}</h1>
              <p class="text-muted-foreground">{{ selectedDoc?.desc }}</p>
            </div>
            <Badge variant="outline" class="self-start">{{ selectedDoc?.category }}</Badge>
          </div>
        </div>

        <!-- 文档内容 -->
        <div class="prose prose-slate dark:prose-invert max-w-none">
          <template v-for="(line, i) in parsedSelectedDoc" :key="i">
            <h2 v-if="line.type === 'h2'" class="text-2xl font-bold mt-8 mb-4 pb-3 border-b">{{ line.text }}</h2>
            <h3 v-else-if="line.type === 'h3'" class="text-xl font-semibold mt-6 mb-3">{{ line.text }}</h3>
            <p v-else-if="line.type === 'bold'" class="font-semibold mt-4 mb-2">{{ line.text }}</p>
            <li v-else-if="line.type === 'li'" class="ml-6 my-2 list-disc">{{ line.text }}</li>
            <li v-else-if="line.type === 'li-decimal'" class="ml-6 my-2 list-decimal">{{ line.text }}</li>
            <p v-else-if="line.type === 'q'" class="font-semibold text-primary mt-6 mb-2 text-lg">{{ line.text }}</p>
            <p v-else-if="line.type === 'a'" class="text-muted-foreground mb-4 pl-4 border-l-4 border-primary/30 bg-primary/5 py-2">{{ line.text }}</p>
            <div v-else-if="line.type === 'empty'" class="h-4"></div>
            <p v-else class="my-3 leading-relaxed">{{ line.text }}</p>
          </template>
        </div>

        <!-- 底部导航 -->
        <div class="mt-12 pt-6 border-t flex items-center justify-end">
          <div class="text-sm text-muted-foreground">
            最后更新: 2024-01-01
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
