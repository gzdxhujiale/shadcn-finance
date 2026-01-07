<script setup>
import { ref, computed } from 'vue'
import { 
  Search, 
  ChevronRight, 
  ChevronDown,
  Calculator
} from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// --- 数据常量 ---
const METRICS = [
  { id: 1, category: '收入指标', name: 'GMV', alias: '商品交易总额', formula: '∑(订单金额) - 取消订单金额', unit: '元', source: 'dws_transaction_summary', desc: '统计周期内所有成交订单的总金额，不含取消订单' },
  { id: 2, category: '收入指标', name: '主营业务收入', alias: '销售收入', formula: 'GMV - 退货金额 - 平台补贴', unit: '元', source: 'ads_IncomeStatement', desc: '扣除退货和补贴后的实际销售收入' },
  { id: 3, category: '收入指标', name: '其他业务收入', alias: '非主营收入', formula: '∑(服务费 + 佣金 + 其他)', unit: '元', source: 'ads_IncomeStatement', desc: '除主营业务外的其他收入来源' },
  { id: 4, category: '收入指标', name: '实收现金', alias: '现金收入', formula: '∑(实际收到的现金款项)', unit: '元', source: 'ads_CashFlowStatement', desc: '实际收到的现金款项，包括销售商品、提供劳务收到的现金' },
  { id: 5, category: '收入指标', name: '确认收入', alias: '已确认收入', formula: '∑(符合收入确认条件的订单金额)', unit: '元', source: 'ads_IncomeStatement', desc: '按照会计准则确认的收入，需满足商品控制权转移等条件' },
  { id: 6, category: '成本指标', name: '商品成本', alias: '货品成本', formula: '∑(SKU成本 × 销售数量)', unit: '元', source: 'dwd_goods_costs', desc: '已售商品的采购成本' },
  { id: 7, category: '成本指标', name: '物流成本', alias: '运费', formula: '∑(快递费 + 仓储费 + 包装费)', unit: '元', source: 'dwd_general_expenses', desc: '商品配送相关的所有费用' },
  { id: 8, category: '成本指标', name: '营销成本', alias: '推广费', formula: '∑(广告费 + 佣金 + 活动费)', unit: '元', source: 'dwd_transaction_costs', desc: '用于推广和营销的费用支出' },
  { id: 9, category: '成本指标', name: '可控成本', alias: '直接成本', formula: '∑(人力成本 + 业务费用 + 其他直接支出)', unit: '元', source: 'dwd_ameba_costs', desc: '阿米巴单元可直接控制的成本支出' },
  { id: 10, category: '成本指标', name: '分摊成本', alias: '间接成本', formula: '∑(房租分摊 + 中台服务分摊 + 资金占用费)', unit: '元', source: 'dwd_allocated_costs', desc: '按规则分摊到各阿米巴单元的间接成本' },
  { id: 11, category: '成本指标', name: '交易成本', alias: '平台费用', formula: '∑(平台佣金 + 支付手续费 + 技术服务费)', unit: '元', source: 'dwd_transaction_costs', desc: '与交易相关的平台费用支出' },
  { id: 12, category: '利润指标', name: '毛利润', alias: '毛利', formula: '主营业务收入 - 商品成本', unit: '元', source: '计算指标', desc: '销售收入减去商品成本后的利润' },
  { id: 13, category: '利润指标', name: '毛利率', alias: 'GPM', formula: '毛利润 / 主营业务收入 × 100%', unit: '%', source: '计算指标', desc: '毛利润占销售收入的比例' },
  { id: 14, category: '利润指标', name: '净利润', alias: '纯利', formula: '毛利润 - 期间费用 - 税金', unit: '元', source: 'ads_IncomeStatement', desc: '扣除所有成本费用后的最终利润' },
  { id: 15, category: '利润指标', name: '净利率', alias: 'NPM', formula: '净利润 / 主营业务收入 × 100%', unit: '%', source: '计算指标', desc: '净利润占销售收入的比例' },
  { id: 16, category: '效率指标', name: 'ROI', alias: '投资回报率', formula: '(收入 - 成本) / 成本 × 100%', unit: '%', source: '计算指标', desc: '投入产出比，衡量投资效率' },
  { id: 17, category: '效率指标', name: '客单价', alias: 'AOV', formula: 'GMV / 订单数', unit: '元', source: '计算指标', desc: '平均每笔订单的金额' },
  { id: 18, category: '效率指标', name: '退货率', alias: '退款率', formula: '退货订单数 / 总订单数 × 100%', unit: '%', source: '计算指标', desc: '退货订单占总订单的比例' },
  { id: 19, category: '业务量指标', name: '订单数', alias: '订单量', formula: 'COUNT(订单ID)', unit: '单', source: 'stg_onlines_transactions', desc: '统计周期内的订单总数' },
  { id: 20, category: '业务量指标', name: '发货数', alias: '发货量', formula: 'COUNT(已发货订单)', unit: '单', source: 'dwd_income', desc: '已完成发货的订单数量' },
]

// --- 状态 ---
const searchText = ref('')
const expandedCategory = ref('收入指标')
const selectedMetric = ref(null)

const categories = computed(() => [...new Set(METRICS.map(m => m.category))])

const filteredMetrics = computed(() => {
  return METRICS.filter(m => 
    !searchText.value || 
    m.name.includes(searchText.value) || 
    m.alias.includes(searchText.value) || 
    m.desc.includes(searchText.value)
  )
})

const toggleCategory = (cat) => {
  expandedCategory.value = expandedCategory.value === cat ? '' : cat
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-6">
    <!-- 指标口径视图 -->
    <div class="h-full grid grid-cols-12 gap-6">
      <!-- 左侧导航 -->
      <div class="col-span-3 bg-white dark:bg-slate-950 rounded-lg border shadow-sm flex flex-col">
        <div class="p-4 border-b">
          <div class="relative">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              v-model="searchText"
              type="search" 
              placeholder="搜索指标..." 
              class="pl-9"
            />
          </div>
        </div>
        <ScrollArea class="flex-1 p-4">
          <div class="space-y-2">
            <div v-for="cat in categories" :key="cat">
              <button 
                @click="toggleCategory(cat)" 
                class="w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all"
                :class="expandedCategory === cat ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'"
              >
                <span>{{ cat }}</span>
                <component :is="expandedCategory === cat ? ChevronDown : ChevronRight" class="h-4 w-4" />
              </button>
              <div v-if="expandedCategory === cat" class="ml-4 mt-1 space-y-1">
                <button 
                  v-for="m in filteredMetrics.filter(m => m.category === cat)" 
                  :key="m.id" 
                  @click="selectedMetric = m"
                  class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                  :class="selectedMetric?.id === m.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'"
                >
                  {{ m.name }}
                </button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <!-- 右侧详情 -->
      <div class="col-span-9 bg-white dark:bg-slate-950 rounded-lg border shadow-sm">
        <div v-if="selectedMetric" class="p-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calculator class="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 class="text-2xl font-bold">{{ selectedMetric.name }}</h3>
              <p class="text-muted-foreground">{{ selectedMetric.alias }}</p>
            </div>
            <Badge variant="outline" class="ml-auto">{{ selectedMetric.category }}</Badge>
          </div>
          <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="p-4 bg-muted/50 rounded-xl">
              <div class="text-xs text-muted-foreground mb-1">计算公式</div>
              <div class="font-mono text-primary font-medium">{{ selectedMetric.formula }}</div>
            </div>
            <div class="p-4 bg-muted/50 rounded-xl">
              <div class="text-xs text-muted-foreground mb-1">单位</div>
              <div class="font-medium">{{ selectedMetric.unit }}</div>
            </div>
          </div>
          <div class="p-4 bg-muted/50 rounded-xl mb-6">
            <div class="text-xs text-muted-foreground mb-1">数据来源</div>
            <div class="font-mono text-sm">{{ selectedMetric.source }}</div>
          </div>
          <div>
            <div class="text-sm font-medium mb-2">指标说明</div>
            <p class="text-muted-foreground leading-relaxed">{{ selectedMetric.desc }}</p>
          </div>
        </div>
        <div v-else class="h-full flex items-center justify-center text-muted-foreground p-20">
          <div class="text-center">
            <Calculator class="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>请从左侧选择一个指标查看详情</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
