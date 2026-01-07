<script setup>
import { reactive } from 'vue'
import { 
  Bell,
  Save,
  Mail,
  MessageSquare,
  AlertTriangle,
  TestTube2
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// --- 状态管理 ---
const settings = reactive({
  // 预算预警
  budgetWarningEnabled: true,
  budgetThreshold80: true,
  budgetThreshold90: true,
  budgetThreshold100: true,
  // 数据异常预警
  dataAnomalyEnabled: true,
  returnRateWarning: true,
  profitDropWarning: true,
  // 邮件通知
  emailEnabled: true,
  emailRecipients: 'finance@company.com, manager@company.com',
  emailFrequency: 'realtime',
  // 企微通知
  wechatEnabled: true,
  wechatWebhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx-xxx-xxx',
  wechatMentionAll: false,
})

const handleSave = () => {
  alert('设置已保存！')
}

const handleTest = (type) => {
  alert(`${type === 'email' ? '邮件' : '企微'}测试通知已发送！`)
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
    <!-- Teleport 保存按钮到面包屑区域 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div 
        class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        @click="handleSave"
      >
        <Save class="h-4 w-4" />
        <span>保存设置</span>
      </div>
    </Teleport>
    <!-- Main Content -->
    <div class="flex-1 overflow-auto p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        
        <!-- 1. 预算超支预警 -->
        <Card>
          <CardHeader class="flex flex-row items-center gap-4 space-y-0">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle class="h-5 w-5 text-amber-600" />
            </div>
            <div class="flex-1">
              <CardTitle class="text-base">预算超支预警</CardTitle>
              <CardDescription>当预算执行达到阈值时发送预警</CardDescription>
            </div>
            <Switch v-model:checked="settings.budgetWarningEnabled" />
          </CardHeader>
          <CardContent 
            class="space-y-4"
            :class="{ 'opacity-50 pointer-events-none': !settings.budgetWarningEnabled }"
          >
            <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div class="font-medium">预算执行率 ≥ 80%</div>
                <div class="text-xs text-muted-foreground mt-1">提前预警，提醒关注</div>
              </div>
              <Switch v-model:checked="settings.budgetThreshold80" />
            </div>
            
            <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div class="font-medium">预算执行率 ≥ 90%</div>
                <div class="text-xs text-muted-foreground mt-1">警告级别，需要控制支出</div>
              </div>
              <Switch v-model:checked="settings.budgetThreshold90" />
            </div>
            
            <div class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900">
              <div>
                <div class="font-medium text-red-700 dark:text-red-400">预算执行率 ≥ 100%</div>
                <div class="text-xs text-red-500 dark:text-red-500 mt-1">超支预警，立即处理</div>
              </div>
              <Switch v-model:checked="settings.budgetThreshold100" />
            </div>
          </CardContent>
        </Card>

        <!-- 2. 数据异常预警 -->
        <Card>
          <CardHeader class="flex flex-row items-center gap-4 space-y-0">
            <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle class="h-5 w-5 text-red-600" />
            </div>
            <div class="flex-1">
              <CardTitle class="text-base">数据异常预警</CardTitle>
              <CardDescription>监控关键指标异常波动</CardDescription>
            </div>
            <Switch v-model:checked="settings.dataAnomalyEnabled" />
          </CardHeader>
          <CardContent 
            class="space-y-4"
            :class="{ 'opacity-50 pointer-events-none': !settings.dataAnomalyEnabled }"
          >
            <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div class="font-medium">退货率异常</div>
                <div class="text-xs text-muted-foreground mt-1">退货率环比上升超过 20%</div>
              </div>
              <Switch v-model:checked="settings.returnRateWarning" />
            </div>
            
            <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div class="font-medium">利润下降预警</div>
                <div class="text-xs text-muted-foreground mt-1">利润率环比下降超过 15%</div>
              </div>
              <Switch v-model:checked="settings.profitDropWarning" />
            </div>
          </CardContent>
        </Card>

        <!-- 3. 邮件通知 -->
        <Card>
          <CardHeader class="flex flex-row items-center gap-4 space-y-0">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Mail class="h-5 w-5 text-blue-600" />
            </div>
            <div class="flex-1">
              <CardTitle class="text-base">邮件通知</CardTitle>
              <CardDescription>通过邮件发送预警通知</CardDescription>
            </div>
            <Switch v-model:checked="settings.emailEnabled" />
          </CardHeader>
          <CardContent 
            class="space-y-4"
            :class="{ 'opacity-50 pointer-events-none': !settings.emailEnabled }"
          >
            <div class="space-y-2">
              <label class="text-sm font-medium">收件人邮箱</label>
              <textarea 
                v-model="settings.emailRecipients" 
                rows="2"
                placeholder="多个邮箱用逗号分隔"
                class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">发送频率</label>
              <Select v-model="settings.emailFrequency">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">实时发送</SelectItem>
                  <SelectItem value="hourly">每小时汇总</SelectItem>
                  <SelectItem value="daily">每日汇总</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" class="w-full" @click="handleTest('email')">
              <TestTube2 class="mr-2 h-4 w-4" /> 发送测试邮件
            </Button>
          </CardContent>
        </Card>

        <!-- 4. 企微通知 -->
        <Card>
          <CardHeader class="flex flex-row items-center gap-4 space-y-0">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <MessageSquare class="h-5 w-5 text-green-600" />
            </div>
            <div class="flex-1">
              <CardTitle class="text-base">企业微信通知</CardTitle>
              <CardDescription>通过企微机器人发送预警</CardDescription>
            </div>
            <Switch v-model:checked="settings.wechatEnabled" />
          </CardHeader>
          <CardContent 
            class="space-y-4"
            :class="{ 'opacity-50 pointer-events-none': !settings.wechatEnabled }"
          >
            <div class="space-y-2">
              <label class="text-sm font-medium">Webhook 地址</label>
              <Input 
                v-model="settings.wechatWebhook"
                placeholder="企微机器人 Webhook URL"
                class="font-mono text-xs"
              />
            </div>

            <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div class="font-medium">@所有人</div>
                <div class="text-xs text-muted-foreground mt-1">紧急预警时 @所有人</div>
              </div>
              <Switch v-model:checked="settings.wechatMentionAll" />
            </div>

            <Button variant="outline" class="w-full text-green-600 border-green-200 hover:bg-green-50" @click="handleTest('wechat')">
              <TestTube2 class="mr-2 h-4 w-4" /> 发送测试消息
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  </div>
</template>
