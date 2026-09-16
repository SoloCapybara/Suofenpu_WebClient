<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CirclePlus, CollectionTag, Refresh, Search } from '@element-plus/icons-vue'
import AppButton from '../components/AppButton.vue'
import DataListTabs from '../components/DataListTabs.vue'
import ListEmptyState from '../components/ListEmptyState.vue'
import PageHeading from '../components/PageHeading.vue'
import type { Dish, DishCategory } from '../types'

const props = defineProps<{
  dishes: Dish[]
  categories: DishCategory[]
  loading: boolean
  soldOutCount: number
}>()

defineEmits<{
  refresh: []
  create: []
  edit: [dish: Dish]
  toggle: [dish: Dish]
  remove: [dish: Dish]
}>()

const route = useRoute()
const router = useRouter()
const searchKeyword = ref('')

watch(
  () => route.query.q,
  (value) => {
    if (route.path === '/dishes') searchKeyword.value = String(value || '')
  },
  { immediate: true },
)
const categoryFilter = ref<number | 'all'>('all')
const statusFilter = ref<'all' | 'selling' | 'offline' | 'soldOut'>('all')

const availableCount = computed(() => props.dishes.filter((dish) => dish.available).length)
const totalStock = computed(() => props.dishes.reduce((sum, dish) => sum + Number(dish.stock || 0), 0))

const hasActiveFilters = computed(() => (
  Boolean(searchKeyword.value.trim())
  || categoryFilter.value !== 'all'
  || statusFilter.value !== 'all'
))

const filteredDishes = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return props.dishes.filter((dish) => {
    const matchesKeyword = !keyword || [dish.name, dish.shortDescription, dish.categoryName]
      .some((value) => value?.toLowerCase().includes(keyword))
    const matchesCategory = categoryFilter.value === 'all' || dish.categoryId === categoryFilter.value
    const matchesStatus = statusFilter.value === 'all'
      || (statusFilter.value === 'selling' && dish.available)
      || (statusFilter.value === 'offline' && !dish.available)
      || (statusFilter.value === 'soldOut' && dish.stock <= 0)
    return matchesKeyword && matchesCategory && matchesStatus
  })
})

const emptyTitle = computed(() => {
  const keyword = searchKeyword.value.trim()
  if (keyword) return `未找到与「${keyword}」匹配的商品`
  if (hasActiveFilters.value) return '暂无符合筛选条件的商品'
  return '暂无商品'
})

const emptyDescription = computed(() => {
  if (searchKeyword.value.trim()) return '试试商品名称、描述或分类关键词'
  if (props.dishes.length === 0) return '点击右上角「新增商品」开始上架第一款商品'
  return '调整筛选条件后再试试'
})

function money(value: number) {
  return `¥${Number(value || 0).toFixed(2)}`
}

function categoryDishCount(categoryId: number) {
  return props.dishes.filter((dish) => dish.categoryId === categoryId).length
}

const categoryTabItems = computed(() => [
  { key: 'all' as const, label: '全部商品', count: props.dishes.length },
  ...props.categories.map((category) => ({
    key: category.id,
    label: category.name,
    count: categoryDishCount(category.id),
  })),
])
</script>

<template>
  <section class="viewport-page module-view dishes-view">
    <PageHeading title="商品管理" description="维护菜单内容，掌握每一款商品的销售状态">
      <template #actions>
        <AppButton :icon="CollectionTag" @click="router.push('/categories')">分类管理</AppButton>
        <AppButton :icon="Refresh" :loading="loading" @click="$emit('refresh')">刷新</AppButton>
        <AppButton type="primary" :icon="CirclePlus" @click="$emit('create')">新增商品</AppButton>
      </template>
    </PageHeading>

    <section class="product-summary dishes-stat-row">
      <div class="summary-lead">
        <span>商品概览</span>
        <div><strong>{{ availableCount }}</strong><small>/ {{ dishes.length }} 款正在售卖</small></div>
      </div>
      <div class="summary-stat"><small>可售库存</small><strong>{{ totalStock }}</strong><span>份</span></div>
      <div class="summary-stat" :class="{ attention: soldOutCount > 0 }"><small>售罄商品</small><strong>{{ soldOutCount }}</strong><span>款</span></div>
      <div class="summary-stat"><small>菜单分类</small><strong>{{ categories.length }}</strong><span>组</span></div>
    </section>

    <section class="product-workbench list-surface">
      <DataListTabs
        v-model="categoryFilter"
        class="product-category-tabs"
        aria-label="商品分类筛选"
        :items="categoryTabItems"
      />
      <el-alert v-if="soldOutCount" type="warning" :closable="false" class="stock-alert" :title="`${soldOutCount} 个商品已售罄，请及时补库存或下架`" />
      <div class="data-list-toolbar product-toolbar">
        <el-input v-model="searchKeyword" class="product-search" clearable placeholder="搜索商品名称、描述或分类" :prefix-icon="Search" />
        <el-select v-model="statusFilter" class="product-filter">
          <el-option label="全部状态" value="all" />
          <el-option label="销售中" value="selling" />
          <el-option label="已下架" value="offline" />
          <el-option label="已售罄" value="soldOut" />
        </el-select>
        <span class="filter-result">找到 {{ filteredDishes.length }} 款</span>
      </div>
      <div class="list-surface__scroll">
        <el-table
          class="admin-data-table product-table"
          :data="filteredDishes"
          v-loading="loading"
          row-key="id"
          height="100%"
        >
          <template #empty>
            <ListEmptyState variant="product" :title="emptyTitle" :description="emptyDescription" />
          </template>
          <el-table-column label="商品" min-width="350">
            <template #default="{ row }">
              <div class="dish-product-cell">
                <div class="dish-thumb">
                  <el-image v-if="row.imageUrl" :src="row.imageUrl" fit="cover" lazy>
                    <template #error>
                      <img class="dish-placeholder-image" src="/images/dish-placeholder.svg" alt="暂无商品展示图" />
                    </template>
                  </el-image>
                  <img v-else class="dish-placeholder-image" src="/images/dish-placeholder.svg" alt="暂无商品展示图" />
                </div>
                <div class="dish-name">
                  <strong>{{ row.name }}</strong>
                  <span>{{ row.shortDescription || '暂无商品简介' }}</span>
                  <small>商品编号 {{ String(row.id).padStart(4, '0') }}</small>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="140">
            <template #default="{ row }"><span class="dish-category-pill">{{ row.categoryName }}</span></template>
          </el-table-column>
          <el-table-column label="售价" width="130">
            <template #default="{ row }"><strong class="dish-price">{{ money(row.price) }}</strong></template>
          </el-table-column>
          <el-table-column label="库存" width="120">
            <template #default="{ row }"><span class="dish-stock" :class="{ empty: row.stock <= 0 }"><b>{{ row.stock }}</b><small>{{ row.stock <= 0 ? '已售罄' : '份可售' }}</small></span></template>
          </el-table-column>
          <el-table-column label="销售状态" width="150">
            <template #default="{ row }">
              <div class="dish-availability">
                <el-switch :model-value="row.available" @change="$emit('toggle', row)" />
                <span>{{ row.available ? '销售中' : '已下架' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="170" align="left">
            <template #default="{ row }">
              <div class="data-list-actions">
                <AppButton link @click="$emit('edit', row)">编辑</AppButton>
                <AppButton link type="danger" @click="$emit('remove', row)">删除</AppButton>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </section>
</template>
