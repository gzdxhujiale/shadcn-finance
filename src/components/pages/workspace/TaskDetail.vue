<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import {
  CheckCircle2, File,
  Download, Trash2, Upload, User, Package,
  Calendar, AlertCircle, Copy, Clock
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useNavigation } from '@/composables/useNavigation.js'

const props = defineProps({
  selectedItem: { type: Object, required: true },
  goBack: { type: Function, required: true }
})

const { setDetailTitle, navigateToHistory } = useNavigation()

// 生成文件名
const generateFileName = (billType) => {
  return `${props.selectedItem.period}_${props.selectedItem.platform}_${props.selectedItem.shop}_${billType}.xlsx`
}

const fileDetailData = computed(() => [
  { id: 1, type: '资金账单', status: 'pending', size: '1.2MB', progress: 80 },
  { id: 2, type: '结算账单', status: 'pending', size: '450KB', progress: 0 },
  { id: 3, type: '订单管理', status: 'done', size: '5.6MB', progress: 100 },
].map(file => ({
  ...file,
  name: generateFileName(file.type)
})))

const handleDownload = (file) => console.log(`下载: ${file.name}`)
const handleDelete = (file) => console.log(`删除: ${file.name}`)

// 复制文件名
const handleCopyFileName = async (file) => {
  try {
    await navigator.clipboard.writeText(file.name)
    console.log(`已复制: ${file.name}`)
    // 可以在这里添加一个简单的视觉反馈
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 跳转到历史记录
const goToHistory = () => {
  navigateToHistory(props.selectedItem.shop)
}

// 挂载时更新面包屑
onMounted(() => {
  setDetailTitle(props.selectedItem.shop)
})

// 卸载时恢复
onUnmounted(() => {
  setDetailTitle(null)
})
</script>

<template>
  <div class="detail-wrapper p-6 space-y-6">
    <!-- 历史记录按钮显示在面包屑右侧 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div 
        class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        @click="goToHistory"
      >
        <Clock class="h-4 w-4" />
        <span>历史记录</span>
      </div>
    </Teleport>

    <!-- 栅格布局 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：文件列表 (2/3) -->
      <div class="lg:col-span-2">
        <Card>
          <CardHeader>
            <div class="flex justify-between items-start">
              <div>
                <CardTitle>账单文件列表</CardTitle>
                <CardDescription>需上传 3 个文件</CardDescription>
              </div>
              <Badge variant="secondary">Total: {{ fileDetailData.length }}</Badge>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="f in fileDetailData"
              :key="f.id"
              class="flex gap-4 p-4 rounded-lg border bg-card hover:border-primary/50 transition"
            >
              <!-- 图标 -->
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="f.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'"
              >
                <File :size="24" />
              </div>

              <!-- 信息主体 -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <div class="font-semibold text-sm break-all">{{ f.name }}</div>
                    <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{{ f.type }}</span>
                      <span class="w-1 h-1 bg-muted-foreground/40 rounded-full"></span>
                      <span>{{ f.size }}</span>
                    </div>
                  </div>
                  
                  <!-- 按钮组 -->
                  <div class="flex gap-1">
                    <Button
                      v-if="f.status === 'done'"
                      variant="ghost"
                      size="icon"
                      @click="handleDownload(f)"
                    >
                      <Download :size="16" />
                    </Button>
                    <Button
                      v-else
                      variant="ghost"
                      size="icon"
                      class="text-indigo-600"
                    >
                      <Upload :size="16" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="handleCopyFileName(f)"
                    >
                      <Copy :size="16" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-destructive"
                      @click="handleDelete(f)"
                    >
                      <Trash2 :size="16" />
                    </Button>
                  </div>
                </div>

                <!-- 进度条 -->
                <div class="mt-2">
                  <div v-if="f.status === 'done'" class="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 :size="16" />
                    已上传完成
                  </div>
                  <div v-else class="flex items-center gap-3">
                    <Progress :model-value="f.progress" class="flex-1" />
                    <span class="text-xs font-semibold text-indigo-600 w-10 text-right">{{ f.progress }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 右侧：任务信息 (1/3) -->
      <div class="space-y-4">
        <!-- 任务信息卡片 -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="font-bold text-lg mb-2">{{ selectedItem.shop }}</h3>
                <div class="flex gap-2">
                  <Badge :variant="selectedItem.status === 'pending' ? 'default' : 'secondary'">
                    {{ selectedItem.statusText }}
                  </Badge>
                  <Badge variant="outline">{{ selectedItem.platform }}</Badge>
                </div>
              </div>
              <div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Package :size="20" />
              </div>
            </div>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-muted-foreground flex items-center gap-2">
                  <User :size="16" /> 客户名称
                </span>
                <span class="text-sm font-medium">{{ selectedItem.client }}</span>
              </div>
              <Separator />
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar :size="16" /> 账期
                </span>
                <Badge variant="secondary" class="font-mono">{{ selectedItem.period }}</Badge>
              </div>
              <template v-if="selectedItem.status === 'pending'">
                <Separator />
                <div class="flex justify-between items-center py-2">
                  <span class="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle :size="16" /> 剩余时间
                  </span>
                  <Badge variant="destructive" class="font-bold">{{ selectedItem.deadlineText }}</Badge>
                </div>
              </template>
            </div>
          </CardContent>
        </Card>
        
        <!-- 快速上传区 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">快速上传</CardTitle>
            <CardDescription>.xlsx, .csv (Max 10MB)</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="border-2 border-dashed border-primary/30 bg-primary/5 rounded-lg h-36 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition">
              <div class="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mb-3">
                <Upload :size="24" />
              </div>
              <span class="text-sm font-medium text-primary">点击或拖拽上传</span>
            </div>
            
            <Button class="w-full" size="lg">
              提交所有文件
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-wrapper {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
