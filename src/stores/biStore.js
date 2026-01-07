import { defineStore } from 'pinia'
import { ref, computed, reactive, shallowRef } from 'vue'

export const useBiStore = defineStore('bi', () => {
    // State
    const rawData = ref([])
    const dimensions = shallowRef([])
    const measures = shallowRef([])

    // --- 日期聚合工具函数 ---
    const aggregateDate = (dateStr, aggType) => {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return dateStr

        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const q = Math.ceil((date.getMonth() + 1) / 3)

        switch (aggType) {
            case 'day': return dateStr
            case 'month': return `${y}-${m}`
            case 'quarter': return `${y}-Q${q}`
            case 'year': return `${y}`
            default: return dateStr
        }
    }

    // Config state
    const state = reactive({
        cols: [],
        rows: [],
        filters: {},
        chartType: 'table',
        colorPalette: 'default'
    })

    const chartTypes = ref([
        { label: '柱状图', value: 'bar' },
        { label: '折线图', value: 'line' },
        { label: '面积图', value: 'area' },
        { label: '明细表', value: 'table' },
    ])

    const dateAggOptions = ref([
        { value: 'day', label: '日' },
        { value: 'month', label: '月' },
        { value: 'quarter', label: '季度' },
        { value: 'year', label: '年' }
    ])

    // Computed
    const activeFilters = computed(() => {
        return new Set(Object.keys(state.filters))
    })

    const expandedFilters = ref(new Set())

    // Actions
    function initializeDataSource(data, dims, meas) {
        rawData.value = data
        dimensions.value = dims
        measures.value = meas
    }

    function initFilter(key, field, data) {
        if (state.filters[key]) return

        const fieldType = field ? field.fieldType : 'dim'

        if (fieldType === 'measure') {
            // 度量字段：创建数值范围筛选
            const values = data.map(row => row[key]).filter(v => v !== null && v !== undefined && !isNaN(v))
            const min = Math.min(...values)
            const max = Math.max(...values)

            state.filters[key] = {
                fieldType: 'measure',
                operator: 'all',
                value: null,
                minValue: null,
                maxValue: null,
                rangeMin: min,
                rangeMax: max
            }
        } else {
            // 维度字段：创建多选筛选
            let uniqueValues = []

            // 特殊处理：如果是日期字段且有聚合，使用聚合后的值
            if (field && field.key === '日期' && field.dateAgg) {
                uniqueValues = [...new Set(data.map(row => aggregateDate(row[key], field.dateAgg)))].filter(v => v !== null && v !== undefined)
            } else {
                uniqueValues = [...new Set(data.map(item => item[key]))].filter(v => v !== null && v !== undefined)
            }

            state.filters[key] = {
                fieldType: 'dim',
                selected: [...uniqueValues],
                options: uniqueValues.sort(),
                dateAgg: field?.dateAgg,
                rangeMin: 0, rangeMax: 0
            }
        }
    }

    function removeFilter(key) {
        delete state.filters[key]
    }

    function toggleFilterDropdown(key, visible) {
        if (visible) expandedFilters.value.add(key)
        else expandedFilters.value.delete(key)
    }

    function updateMeasureFilter(key, operator, value, min, max) {
        if (state.filters[key] && state.filters[key].fieldType === 'measure') {
            state.filters[key].operator = operator
            state.filters[key].value = value
            state.filters[key].minValue = min
            state.filters[key].maxValue = max
        }
    }

    function toggleSelectAll(key) {
        const filter = state.filters[key]
        if (filter && filter.fieldType === 'dim') {
            if (filter.selected.length === filter.options.length) {
                filter.selected = []
            } else {
                filter.selected = [...filter.options]
            }
        }
    }

    function toggleOption(key, option) {
        const filter = state.filters[key]
        if (filter && filter.fieldType === 'dim') {
            const index = filter.selected.indexOf(option)
            if (index > -1) {
                filter.selected.splice(index, 1)
            } else {
                filter.selected.push(option)
            }
        }
    }

    function updateDateAggregation(key, newAgg, data) {
        if (state.filters[key] && state.filters[key].fieldType === 'dim') {
            const uniqueValues = [...new Set(data.map(row => {
                return aggregateDate(row[key], newAgg)
            }))].filter(v => v !== null && v !== undefined)

            state.filters[key].options = uniqueValues.sort()
            state.filters[key].selected = [...uniqueValues] // 重新全选
            state.filters[key].dateAgg = newAgg
        }
    }

    function aggregateData(aq, dims, metrics) {
        if (!aq || rawData.value.length === 0) {
            return { keys: [], groups: {} }
        }

        // 1. 筛选数据
        let filteredData = rawData.value.filter(row => {
            for (const [key, filter] of Object.entries(state.filters)) {
                if (filter.fieldType === 'measure') {
                    const value = parseFloat(row[key])
                    if (isNaN(value)) continue

                    switch (filter.operator) {
                        case 'gt':
                            if (filter.value !== null && value <= filter.value) return false
                            break
                        case 'lt':
                            if (filter.value !== null && value >= filter.value) return false
                            break
                        case 'eq':
                            if (filter.value !== null && value !== filter.value) return false
                            break
                        case 'between':
                            if (filter.minValue !== null && value < filter.minValue) return false
                            if (filter.maxValue !== null && value > filter.maxValue) return false
                            break
                    }
                } else {
                    // 维度筛选逻辑
                    if (!filter.selected || filter.selected.length === 0) {
                        return false
                    }

                    let valueToCheck = row[key]
                    if (filter.dateAgg && key === '日期') {
                        valueToCheck = aggregateDate(row[key], filter.dateAgg)
                    }

                    if (!filter.selected.includes(valueToCheck)) {
                        return false
                    }
                }
            }
            return true
        })

        // 2. 创建 Arquero 表
        let table = aq.from(filteredData)

        // 3. 派生字段（日期聚合）- 使用 aq.escape 避免列名解析问题
        dims.forEach(d => {
            if (d.key === '日期' && d.dateAgg) {
                const aggKey = `${d.key}_agg`
                table = table.derive({
                    [aggKey]: aq.escape(row => aggregateDate(row[d.key], d.dateAgg))
                })
            }
        })

        // 4. 定义分组键
        const groupFields = dims.map(d => {
            if (d.key === '日期' && d.dateAgg) {
                return `${d.key}_agg`
            }
            return d.key
        })

        // 5. 定义聚合操作
        const rollupSpec = {}
        metrics.forEach(m => {
            rollupSpec[m.key] = aq.op.sum(m.key)
        })

        // 6. 执行分组与聚合
        if (groupFields.length > 0) {
            table = table.groupby(groupFields).rollup(rollupSpec)
        } else {
            table = table.rollup(rollupSpec)
        }

        // 7. 转换输出格式
        const result = table.objects()
        const groups = {}

        result.forEach(row => {
            const rowKey = dims.map(d => {
                const fieldName = (d.key === '日期' && d.dateAgg) ? `${d.key}_agg` : d.key
                return row[fieldName]
            }).join(' / ') || '总计'

            groups[rowKey] = {
                meta: {},
                values: {},
                count: 1
            }

            dims.forEach(d => {
                const fieldName = (d.key === '日期' && d.dateAgg) ? `${d.key}_agg` : d.key
                groups[rowKey].meta[d.key] = row[fieldName]
            })

            metrics.forEach(m => {
                groups[rowKey].values[m.key] = row[m.key] || 0
            })
        })

        const sortedKeys = Object.keys(groups).sort()
        return { keys: sortedKeys, groups }
    }

    function exportToCSV(aggregatedData, dims, metrics) {
        const csvContent = "\ufeff" + dims.map(d => d.key).join(",") + "," + metrics.map(m => m.key).join(",") + "\n"
            + aggregatedData.keys.map(k => {
                const g = aggregatedData.groups[k]
                return dims.map(d => g.meta[d.key]).join(",") + "," + metrics.map(m => g.values[m.key]).join(",")
            }).join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `bi_export_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return {
        state,
        activeFilters,
        expandedFilters,
        rawData,
        dimensions,
        measures,
        chartTypes,
        dateAggOptions,
        initializeDataSource,
        initFilter,
        removeFilter,
        toggleFilterDropdown,
        updateMeasureFilter,
        toggleSelectAll,
        toggleOption,
        updateDateAggregation,
        aggregateDate,
        aggregateData,
        exportToCSV
    }
})
