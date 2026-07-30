<script setup lang="ts">
import { Refresh, Right } from '@element-plus/icons-vue'
import AppButton from '../components/AppButton.vue'
import type { StatCard, StatusMeta, TopOrderItem } from '../admin-types'
import type { Dish, Order, OrderStatus } from '../types'

defineProps<{
  statCards: StatCard[]
  pendingOrders: Order[]
  lowStockDishes: Dish[]
  topOrderItems: TopOrderItem[]
  statusMeta: Record<OrderStatus, StatusMeta>
  storeName: string
  businessHours: string
  notice: string
  storeOpen: boolean
  loading: boolean
}>()

defineEmits<{
  refresh: []
  goOrders: []
  goDishes: []
  advance: [order: Order]
}>()

function money(value: number) {
  return `¥${Number(value || 0).toFixed(2)}`
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function orderItemsText(order: Order) {
  return order.items.map((item) => `${item.dishName} x${item.quantity}`).join('，')
}
</script>

<template>
  <section class="dashboard-view">
    <div class="page-heading">
      <div>
        <h1>今日经营</h1>
        <p>查看本店今日订单、营收和库存情况</p>
      </div>
      <AppButton :icon="Refresh" :loading="loading" @click="$emit('refresh')">刷新数据</AppButton>
    </div>

    <article class="store-summary-card">
      <div class="store-summary-main">
        <div class="store-summary-head">
          <strong>{{ storeName }}</strong>
          <span class="store-status-badge" :class="{ open: storeOpen }">
            <i></i>{{ storeOpen ? '营业中' : '已打烊' }}
          </span>
        </div>
        <span class="store-summary-hours">{{ businessHours }}</span>
        <p>{{ notice || '暂无公告' }}</p>
      </div>
    </article>

    <div class="stat-grid stat-grid-4">
      <article v-for="card in statCards" :key="card.label" class="stat-card stat-card-simple">
        <div class="stat-top">
          <div :class="['stat-icon', card.color]">
            <component :is="card.icon" />
          </div>
          <div>
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}<em>{{ card.unit }}</em></strong>
          </div>
        </div>
      </article>
    </div>

    <div class="dashboard-main-grid">
      <el-card class="dashboard-panel dashboard-orders-card">
        <template #header>
          <div class="panel-title compact">
            <strong>待处理订单 ({{ pendingOrders.length }})</strong>
            <AppButton link type="primary" :icon="Right" @click="$emit('goOrders')">全部订单</AppButton>
          </div>
        </template>
        <el-table :data="pendingOrders" size="small" max-height="360" empty-text="暂无待处理订单">
          <el-table-column prop="orderNo" label="订单号" min-width="168" />
          <el-table-column label="商品" min-width="180">
            <template #default="{ row }">{{ orderItemsText(row) }}</template>
          </el-table-column>
          <el-table-column label="金额" width="96">
            <template #default="{ row }">{{ money(row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="92">
            <template #default="{ row }: { row: Order }">
              <el-tag size="small" :type="statusMeta[row.status].type">{{ statusMeta[row.status].label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="下单时间" width="118">
            <template #default="{ row }: { row: Order }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="108" fixed="right">
            <template #default="{ row }: { row: Order }">
              <AppButton
                v-if="statusMeta[row.status].action"
                size="small"
                type="primary"
                @click="$emit('advance', row)"
              >
                {{ statusMeta[row.status].action }}
              </AppButton>
              <span v-else class="muted-text">-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="dashboard-secondary-grid">
        <el-card class="dashboard-panel dashboard-stock-card">
          <template #header>
            <div class="panel-title compact">
              <strong>库存预警 ({{ lowStockDishes.length }})</strong>
              <AppButton link type="primary" :icon="Right" @click="$emit('goDishes')">商品管理</AppButton>
            </div>
          </template>
          <el-table :data="lowStockDishes" size="small" max-height="240" empty-text="库存充足">
            <el-table-column prop="name" label="商品" min-width="120" />
            <el-table-column prop="stock" label="剩余库存" width="92" />
            <el-table-column label="状态" width="88">
              <template #default="{ row }">
                <el-tag size="small" :type="row.stock === 0 ? 'danger' : 'warning'">
                  {{ row.stock === 0 ? '已售罄' : '偏低' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="dashboard-panel dashboard-ranking-card">
          <template #header><strong>今日热销</strong></template>
          <div v-if="topOrderItems.length" class="ranking-list">
            <div v-for="(item, index) in topOrderItems" :key="item.name" class="ranking-item">
              <span class="ranking-index">{{ index + 1 }}</span>
              <div class="ranking-body">
                <strong>{{ item.name }}</strong>
                <span>已售 {{ item.count }} 份</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="今日暂无销量" :image-size="72" />
        </el-card>
      </div>
    </div>
  </section>
</template>
