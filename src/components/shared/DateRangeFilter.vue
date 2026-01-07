<script setup>
import { ref, computed, watch } from 'vue'
import { CalendarDays, Check } from 'lucide-vue-next'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      start: new CalendarDate(2025, 1, 1),
      end: new CalendarDate(2025, 12, 31)
    })
  }
})

const emit = defineEmits(['update:modelValue', 'apply'])

// 日期格式化
const df = new DateFormatter('zh-CN', { dateStyle: 'short' })

// 控制 Popover 显示
const showDatePicker = ref(false)

// 临时选择的日期范围（未确认前）
const tempDateRange = ref({
  start: props.modelValue.start,
  end: props.modelValue.end
})

// 当前选中的快捷筛选
const activeQuickFilter = ref('all')

// 快捷筛选选项
const quickFilters = [
  { label: '全部', value: 'all' },
  { label: '最近一月', value: '1m' },
  { label: '最近三月', value: '3m' },
  { label: '最近一年', value: '1y' },
]

// 获取快捷筛选的日期范围
const getQuickFilterRange = (value) => {
  const now = today(getLocalTimeZone())
  
  switch (value) {
    case '1m':
      return {
        start: now.subtract({ months: 1 }),
        end: now
      }
    case '3m':
      return {
        start: now.subtract({ months: 3 }),
        end: now
      }
    case '1y':
      return {
        start: now.subtract({ years: 1 }),
        end: now
      }
    case 'all':
    default:
      return {
        start: new CalendarDate(2025, 1, 1),
        end: new CalendarDate(2025, 12, 31)
      }
  }
}

// 快捷筛选点击
const handleQuickFilter = (value) => {
  activeQuickFilter.value = value
  tempDateRange.value = getQuickFilterRange(value)
}

// 同步 props 到临时值
watch(() => props.modelValue, (newVal) => {
  tempDateRange.value = { ...newVal }
}, { deep: true, immediate: true })

// 当日历选择变化时，清除快捷筛选状态
watch(tempDateRange, () => {
  // 检查是否匹配某个快捷筛选
  const matchingFilter = quickFilters.find(f => {
    if (f.value === 'all') return false
    const range = getQuickFilterRange(f.value)
    return tempDateRange.value.start?.compare(range.start) === 0 &&
           tempDateRange.value.end?.compare(range.end) === 0
  })
  
  if (!matchingFilter) {
    activeQuickFilter.value = ''
  }
}, { deep: true })

// 确认应用
const handleApply = () => {
  emit('update:modelValue', { ...tempDateRange.value })
  emit('apply', { ...tempDateRange.value })
  showDatePicker.value = false
}

// 显示的日期文本
const displayText = computed(() => {
  if (!props.modelValue.start || !props.modelValue.end) return '选择日期范围'
  
  const startDate = props.modelValue.start.toDate(getLocalTimeZone())
  const endDate = props.modelValue.end.toDate(getLocalTimeZone())
  
  return `${df.format(startDate)} - ${df.format(endDate)}`
})
</script>

<template>
  <div class="flex items-center gap-2">
    <Popover v-model:open="showDatePicker">
      <PopoverTrigger as-child>
        <Button 
          variant="outline" 
          size="sm" 
          class="h-8 gap-2 px-3 bg-muted/50 hover:bg-muted border-0 rounded-full"
        >
          <CalendarDays class="h-4 w-4 text-primary" />
          <span class="text-sm font-medium">{{ displayText }}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <div class="flex flex-col">
          <!-- 快捷筛选区 -->
          <div class="flex items-center gap-1 p-3 border-b bg-muted/30">
            <span class="text-xs text-muted-foreground mr-2">快捷选择:</span>
            <div class="flex gap-1">
              <Badge 
                v-for="filter in quickFilters" 
                :key="filter.value"
                :variant="activeQuickFilter === filter.value ? 'default' : 'outline'"
                class="cursor-pointer text-xs px-2 py-0.5 transition-all hover:bg-primary/10"
                :class="activeQuickFilter === filter.value ? 'bg-primary text-primary-foreground' : ''"
                @click="handleQuickFilter(filter.value)"
              >
                {{ filter.label }}
              </Badge>
            </div>
          </div>
          
          <!-- 日历选择区 -->
          <RangeCalendar 
            v-model="tempDateRange" 
            :number-of-months="2"
            class="rounded-none border-0"
          />
          
          <!-- 确认按钮区 -->
          <div class="flex items-center justify-between p-3 border-t bg-muted/30">
            <div class="text-xs text-muted-foreground">
              <template v-if="tempDateRange.start && tempDateRange.end">
                已选: {{ df.format(tempDateRange.start.toDate(getLocalTimeZone())) }} - 
                {{ df.format(tempDateRange.end.toDate(getLocalTimeZone())) }}
              </template>
              <template v-else>
                请选择日期范围
              </template>
            </div>
            <Button size="sm" class="h-7 gap-1" @click="handleApply">
              <Check class="h-3.5 w-3.5" />
              确认
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>
