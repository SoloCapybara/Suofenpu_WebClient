<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import type { Order, OrderStatus } from '../types'
import type { StatusMeta } from '../admin-types'
import AppButton from '../components/AppButton.vue'
import ListEmptyState from '../components/ListEmptyState.vue'
import PageHeading from '../components/PageHeading.vue'
import { orderMatchesKeyword } from '../utils/global-search'

const props = defineProps<{
  orders: Order[]
  loading: boolean
  orderStatusFilter: OrderStatus | ''
  statusMeta: Record<OrderStatus, StatusMeta>
}>()

const route = useRoute()
const searchKeyword = computed(() => String(route.query.q || '').trim())
const displayedOrders = computed(() => {
  if (!searchKeyword.value) return props.orders
  return props.orders.filter((order) => orderMatchesKeyword(order, searchKeyword.value))
})
const emptyTitle = computed(() => (
  searchKeyword.value ? `未找到与「${searchKeyword.value}」匹配的订单` : '暂无订单'
))
const emptyDescription = computed(() => (
  searchKeyword.value ? '试试订单号、手机号或商品名称' : '有新订单时会显示在这里'
))

defineEmits<{
  refresh: []
  advance: [order: Order]
  cancel: [order: Order]
  'update:orderStatusFilter': [value: OrderStatus | '']
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
  <section class="viewport-page module-view orders-view">
    <PageHeading title="订单管理" description="查看和处理顾客订单，推进接单、制作与配送">
      <template #actions>
        <el-select
          :model-value="orderStatusFilter"
          placeholder="全部状态"
          clearable
          style="width: 160px"
          @update:model-value="$emit('update:orderStatusFilter', $event as OrderStatus | '')"
          @change="$emit('refresh')"
        >
          <el-option v-for="(meta, status) in statusMeta" :key="status" :label="meta.label" :value="status" />
        </el-select>
        <AppButton :icon="Refresh" :loading="loading" @click="$emit('refresh')">刷新订单</AppButton>
      </template>
    </PageHeading>

    <div class="list-surface">
      <div class="list-surface__scroll">
        <el-table class="admin-data-table" :data="displayedOrders" v-loading="loading" row-key="orderNo" height="100%">
          <template #empty>
            <ListEmptyState variant="order" :title="emptyTitle" :description="emptyDescription" />
          </template>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="order-detail">
              <p><strong>收货信息：</strong>{{ row.address }} / {{ row.phone }} / {{ row.deliveryTime }}</p>
              <p><strong>备注：</strong>{{ row.orderRemark || '无' }}</p>
              <el-table :data="row.items" size="small">
                <el-table-column prop="dishName" label="商品" />
                <el-table-column label="规格">
                  <template #default="{ row: item }">{{ item.spec }} · {{ item.spice }} · {{ item.tableware }}</template>
                </el-table-column>
                <el-table-column prop="quantity" label="数量" width="80" />
                <el-table-column label="小计" width="100">
                  <template #default="{ row: item }">{{ money(item.lineTotal) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="190" />
        <el-table-column label="顾客" min-width="150">
          <template #default="{ row }">{{ row.customerName || '微信用户' }} / {{ row.phone }}</template>
        </el-table-column>
        <el-table-column label="商品" min-width="240">
          <template #default="{ row }">{{ orderItemsText(row) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110">
          <template #default="{ row }">{{ money(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusMeta[row.status as OrderStatus].type">
              {{ statusMeta[row.status as OrderStatus].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="130">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="left" header-align="left">
          <template #default="{ row }">
            <div class="data-list-actions">
              <AppButton v-if="statusMeta[row.status as OrderStatus].next" link type="primary" @click="$emit('advance', row)">
                {{ statusMeta[row.status as OrderStatus].action }}
              </AppButton>
              <AppButton v-if="!['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(row.status)" link type="danger" @click="$emit('cancel', row)">
                取消
              </AppButton>
            </div>
          </template>
        </el-table-column>
        </el-table>
      </div>
    </div>
  </section>
</template>
