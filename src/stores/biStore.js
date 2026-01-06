import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useBiStore = defineStore('bi', () => {
    // State
    const rawData = ref([])
    const dimensions = ref([])
    const measures = ref([])

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

    const chartTypes = [
        { label: '表格', value: 'table' },
        { label: '柱状图', value: 'bar' },
        { label: '折线图', value: 'line' },
        { label: '面积图', value: 'area' },
    ]

    const dateAggOptions = [
        { label: '年', value: 'year' },
        { label: '季度', value: 'quarter' },
        { label: '月', value: 'month' },
        { label: '日', value: 'day' }
    ]

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

        if (field.fieldType === 'dim' || field.fieldType === 'string' || field.fieldType === 'date') {
            let uniqueValues = []
            // 特殊处理：如果是日期字段且有聚合，使用聚合后的值
            if (field.key === '日期' && field.dateAgg) {
                uniqueValues = [...new Set(data.map(row => aggregateDate(row[key], field.dateAgg)))].sort()
            } else {
                uniqueValues = [...new Set(data.map(item => item[key]))].sort()
            }

            state.filters[key] = {
                fieldType: 'dim',
                selected: [...uniqueValues],
                options: uniqueValues,
                dateAgg: field.dateAgg,
                rangeMin: 0, rangeMax: 0
            }
        } else {
            const values = data.map(d => d[key])
            const min = Math.min(...values)
            const max = Math.max(...values)
            state.filters[key] = {
                fieldType: 'measure',
                operator: 'all',
                value: 0,
                minValue: min,
                maxValue: max,
                rangeMin: min,
                rangeMax: max
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
        if (state.filters[key]) {
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
            }))].sort()

            state.filters[key].options = uniqueValues
            state.filters[key].selected = [...uniqueValues] // 重新全选
            state.filters[key].dateAgg = newAgg
        }
    }

    function aggregateData(aq, dims, metrics) {
        if (!aq || !rawData.value.length) return { keys: [], groups: {} }

        // 1. Filter
        let data = rawData.value.filter(row => {
            for (const key of Object.keys(state.filters)) {
                const f = state.filters[key]
                let val = row[key] // Check raw value first

                if (f.fieldType === 'dim') {
                    // 如果是日期且有聚合，需要先聚合再对比
                    if (f.dateAgg && key === '日期') {
                        val = aggregateDate(val, f.dateAgg)
                    }
                    if (!f.selected.includes(val)) return false
                } else {
                    // Measure filter logic...
                    if (f.operator === 'gt' && !(val > f.value)) return false
                    if (f.operator === 'lt' && !(val < f.value)) return false
                    if (f.operator === 'eq' && !(val == f.value)) return false
                    if (f.operator === 'between' && !(val >= f.minValue && val <= f.maxValue)) return false
                }
            }
            return true
        })

        // 2. Pre-process for date aggregation
        const groupKeys = []
        dims.forEach(d => {
            if (d.key === '日期' && d.dateAgg) {
                groupKeys.push(`${d.key}_${d.dateAgg}`)
            } else {
                groupKeys.push(d.key)
            }
        })

        const mappedData = data.map(row => {
            const newRow = { ...row }
            dims.forEach(d => {
                if (d.key === '日期' && d.dateAgg) {
                    newRow[`${d.key}_${d.dateAgg}`] = aggregateDate(row[d.key], d.dateAgg)
                }
            })
            return newRow
        })

        let table = aq.from(mappedData)

        // 3. Group
        if (groupKeys.length > 0) {
            table = table.groupby(groupKeys)
        }

        // 4. Rollup
        const rollupObj = {}
        metrics.forEach(m => rollupObj[m.key] = aq.op.sum(m.key))
        table = table.rollup(rollupObj)

        // 5. Output format
        const rows = table.objects()
        const groups = {}
        const keys = []

        rows.forEach(row => {
            const meta = {}
            const values = {}

            const keyParts = groupKeys.map(k => {
                return row[k]
            })
            const keyStr = keyParts.join(' / ') || '总计'
            if (!keys.includes(keyStr)) keys.push(keyStr)

            dims.forEach(d => {
                if (d.key === '日期' && d.dateAgg) {
                    meta[d.key] = row[`${d.key}_${d.dateAgg}`]
                } else {
                    meta[d.key] = row[d.key]
                }
            })

            metrics.forEach(m => values[m.key] = row[m.key])
            groups[keyStr] = { meta, values }
        })

        // Sort keys
        keys.sort()
        return { keys, groups }
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
        aggregateData,
        exportToCSV
    }
})
