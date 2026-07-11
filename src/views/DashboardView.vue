<script setup lang="ts">
import { Calendar, CirclePlus, Download, Search, TrendCharts } from '@element-plus/icons-vue'
import type { OrderStatus } from '../types'
import type { AnomalyCard, StatCard, StatusMeta, StoreRow, TopOrderItem } from '../admin-types'

defineProps<{
  statCards: StatCard[]
  storeRows: StoreRow[]
  topOrderItems: TopOrderItem[]
  anomalyCards: AnomalyCard[]
  todayRevenue: number
  orderStatusFilter: OrderStatus | ''
  statusMeta: Record<OrderStatus, StatusMeta>
}>()

defineEmits<{
  createDish: []
  refreshOrders: []
  'update:orderStatusFilter': [value: OrderStatus | '']
}>()

function money(value: number) {
  return `¥${Number(value || 0).toFixed(2)}`
}
</script>

<template>
  <section class="dashboard-view">
    <div class="page-heading">
      <div>
        <h1>首页总览</h1>
        <p>统一查看门店营业表现、客流、订单、坪效与经营对比</p>
      </div>
      <el-button type="primary" :icon="CirclePlus" @click="$emit('createDish')">新增门店</el-button>
    </div>

    <div class="stat-grid">
      <article v-for="card in statCards" :key="card.label" class="stat-card">
        <div class="stat-top">
          <div :class="['stat-icon', card.color]">
            <component :is="card.icon" />
          </div>
          <div>
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}<em>{{ card.unit }}</em></strong>
            <small>较昨日 ↑ {{ card.delta }}</small>
          </div>
        </div>
        <svg viewBox="0 0 228 74" class="sparkline" preserveAspectRatio="none">
          <polyline :points="card.trend" />
        </svg>
      </article>
    </div>

    <div class="filter-bar">
      <el-date-picker
        class="filter-date"
        type="daterange"
        start-placeholder="2024-05-15"
        end-placeholder="2024-05-15"
        :prefix-icon="Calendar"
      />
      <el-select class="filter-region" placeholder="全部区域" model-value="">
        <el-option label="全部区域" value="" />
        <el-option label="鹿寨县" value="luzhai" />
      </el-select>
      <el-select class="filter-store-type" placeholder="全部门店类型" model-value="">
        <el-option label="全部门店类型" value="" />
        <el-option label="直营店" value="直营店" />
        <el-option label="加盟店" value="加盟店" />
      </el-select>
      <el-select
        class="filter-status"
        :model-value="orderStatusFilter"
        placeholder="全部状态"
        clearable
        @update:model-value="$emit('update:orderStatusFilter', $event as OrderStatus | '')"
        @change="$emit('refreshOrders')"
      >
        <el-option v-for="(meta, status) in statusMeta" :key="status" :label="meta.label" :value="status" />
      </el-select>
      <el-input class="filter-search" placeholder="搜索门店名称 / 编号 / 店长" :prefix-icon="Search" />
      <el-button class="filter-export" :icon="Download">导出数据</el-button>
      <el-button class="filter-create" type="primary" :icon="CirclePlus" @click="$emit('createDish')">新增门店</el-button>
    </div>

    <div class="dashboard-grid">
      <el-card class="overview-card">
        <template #header>
          <div class="panel-title">
            <div>
              <strong>门店经营概览</strong>
              <div class="tabs-line">
                <span class="active">全部门店 ({{ storeRows.length }})</span>
                <span>直营门店 ({{ storeRows.filter((row) => row.type === '直营店').length }})</span>
                <span>加盟门店 ({{ storeRows.filter((row) => row.type === '加盟店').length }})</span>
                <span>营业中 ({{ storeRows.filter((row) => row.available).length }})</span>
              </div>
            </div>
          </div>
        </template>
        <el-table :data="storeRows" size="small" height="328" class="dense-table">
          <el-table-column prop="code" label="门店编号" width="92" />
          <el-table-column prop="name" label="门店名称" min-width="130" />
          <el-table-column prop="area" label="区域" width="86" />
          <el-table-column prop="type" label="门店类型" width="94" />
          <el-table-column label="今日营业额" width="120">
            <template #default="{ row }">{{ money(row.revenue) }}</template>
          </el-table-column>
          <el-table-column prop="orders" label="今日订单" width="94" />
          <el-table-column prop="visitors" label="客流量" width="86" />
          <el-table-column label="客单价" width="94">
            <template #default="{ row }">{{ money(row.avg) }}</template>
          </el-table-column>
          <el-table-column label="坪效" width="86">
            <template #default="{ row }">¥{{ row.efficiency }}</template>
          </el-table-column>
          <el-table-column label="状态" width="84">
            <template #default="{ row }">
              <el-tag size="small" :type="row.available ? 'success' : 'info'">{{ row.available ? '营业中' : '已下架' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="right-column">
        <el-card class="chart-card">
          <template #header><strong>门店营业额占比</strong></template>
          <div class="donut-wrap">
            <div class="donut"><span>今日营业额<br /><b>{{ money(todayRevenue) }}</b></span></div>
            <div class="legend-list">
              <div v-for="(row, index) in storeRows.slice(0, 6)" :key="row.code">
                <i :class="`legend-${index}`"></i>
                <span>{{ row.name }}</span>
                <b>{{ Math.max(8, 24 - index * 3).toFixed(1) }}%</b>
              </div>
            </div>
          </div>
        </el-card>
        <el-card class="chart-card">
          <template #header>
            <div class="panel-title compact">
              <strong>近7日门店营业趋势</strong>
              <el-select model-value="7" size="small" style="width: 92px">
                <el-option label="近7日" value="7" />
              </el-select>
            </div>
          </template>
          <div class="bar-chart">
            <div v-for="height in [66, 48, 78, 58, 94, 64, 70]" :key="height" class="bar-item">
              <i :style="{ height: `${height}%` }"></i>
            </div>
            <svg viewBox="0 0 420 140" preserveAspectRatio="none">
              <polyline points="8,88 70,60 132,78 194,44 256,36 318,58 410,48" />
            </svg>
          </div>
        </el-card>
      </div>
    </div>

    <div class="bottom-grid">
      <el-card>
        <template #header><strong>各门店营业额对比（今日）</strong></template>
        <div class="horizontal-bars">
          <div v-for="row in storeRows.slice(0, 6)" :key="row.code" class="hbar">
            <span>{{ row.name }}</span>
            <i :style="{ width: `${Math.min(96, row.revenue / 90)}%` }"></i>
            <b>{{ money(row.revenue) }}</b>
          </div>
        </div>
      </el-card>
      <el-card>
        <template #header>
          <div class="panel-title compact">
            <strong>分时段客流趋势（今日）</strong>
            <el-select model-value="visitors" size="small" style="width: 96px">
              <el-option label="客流量" value="visitors" />
            </el-select>
          </div>
        </template>
        <div class="line-chart">
          <svg viewBox="0 0 520 180" preserveAspectRatio="none">
            <polyline points="8,160 64,128 120,72 176,28 232,54 288,122 344,126 400,84 456,112 512,156" />
            <circle cx="176" cy="28" r="6" />
          </svg>
        </div>
      </el-card>
      <el-card>
        <template #header><strong>门店经营洞察</strong></template>
        <div class="insight-list">
          <div v-for="item in topOrderItems.slice(0, 4)" :key="item.name" class="insight-item">
            <div class="insight-icon"><TrendCharts /></div>
            <div>
              <strong>{{ item.name }}销量领先</strong>
              <span>今日已售 {{ item.count }} 份，建议保证库存</span>
            </div>
            <svg viewBox="0 0 120 40"><polyline points="0,32 18,24 36,26 54,16 72,20 90,10 120,14" /></svg>
          </div>
        </div>
      </el-card>
    </div>

    <div class="anomaly-grid">
      <article v-for="card in anomalyCards" :key="card.label" class="anomaly-card">
        <div :class="['anomaly-icon', card.color]"><component :is="card.icon" /></div>
        <div>
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <small>较昨日 ↑ 1</small>
        </div>
        <svg viewBox="0 0 180 76" preserveAspectRatio="none">
          <polyline :points="card.line" />
        </svg>
      </article>
    </div>
  </section>
</template>
