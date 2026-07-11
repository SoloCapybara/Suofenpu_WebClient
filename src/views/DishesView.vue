<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ArrowRight, CirclePlus, CollectionTag, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Dish, DishCategory, DishCategoryPayload } from '../types'

const props = defineProps<{
  dishes: Dish[]
  categories: DishCategory[]
  loading: boolean
  soldOutCount: number
}>()

const emit = defineEmits<{
  refresh: []
  create: []
  edit: [dish: Dish]
  toggle: [dish: Dish]
  remove: [dish: Dish]
  createCategory: [payload: Required<DishCategoryPayload>]
  updateCategory: [id: number, payload: DishCategoryPayload]
  deleteCategory: [category: DishCategory]
}>()

const categoryDialogVisible = ref(false)
const categoryIconPickerVisible = ref(false)
const selectedIconLibrary = ref('lucide')
const editingCategoryId = ref<number>()
const searchKeyword = ref('')
const categoryFilter = ref<number | 'all'>('all')
const statusFilter = ref<'all' | 'selling' | 'offline' | 'soldOut'>('all')
const categoryPanelOpen = ref<string[]>(['categories'])
const categoryForm = reactive({
  code: '',
  name: '',
  iconUrl: '',
  sortOrder: 0,
  enabled: true,
})

const iconLibraries = [
  {
    key: 'lucide',
    name: 'Lucide',
    source: 'Lucide Icons',
    icons: [
      ['bowl', '餐碗'], ['carrot', '配菜'], ['cup', '饮品'], ['gift', '套餐'],
      ['sparkle', '特色'], ['thumbs-up', '推荐'], ['store', '门店'], ['coins', '优惠'],
      ['crown', '会员'], ['ticket', '券'], ['cart', '购物车'], ['house', '主页'],
      ['headphones', '客服'], ['message-circle', '消息'], ['map-pin', '位置'], ['log-out', '退出'],
      ['order', '订单'], ['user', '用户'], ['user-active', '用户高亮'], ['menu', '菜单'],
      ['smartphone', '手机'], ['search', '搜索'], ['x', '关闭'], ['wechat', '微信'],
    ],
  },
  {
    key: 'material',
    name: 'Material Symbols',
    source: 'Google Material Symbols',
    icons: [
      ['restaurant', '餐厅'], ['ramen-dining', '面食'], ['local-cafe', '咖啡'], ['local-drink', '饮料'],
      ['bakery-dining', '烘焙'], ['icecream', '冰品'], ['lunch-dining', '午餐'], ['fastfood', '快餐'],
      ['set-meal', '套餐'], ['takeout-dining', '外带'], ['local-pizza', '披萨'], ['cookie', '点心'],
      ['dinner-dining', '晚餐'], ['brunch-dining', '早午餐'], ['local-bar', '酒吧'], ['wine-bar', '红酒'],
      ['local-dining', '用餐'], ['kitchen', '厨房'], ['soup-kitchen', '汤品'], ['emoji-food-beverage', '餐饮'],
      ['grocery', '杂货'], ['shopping-basket', '购物篮'], ['favorite', '收藏'], ['star', '星标'],
    ],
  },
]

const currentIconLibrary = computed(() => iconLibraries.find((library) => library.key === selectedIconLibrary.value) || iconLibraries[0])

function iconUrl(libraryKey: string, iconName: string) {
  if (libraryKey === 'lucide') return `/icons/lucide/${iconName}.svg`
  return `https://api.iconify.design/material-symbols:${iconName}.svg?color=%235f6b7a`
}

function displayIconUrl(iconUrlValue: string) {
  return iconUrlValue?.replace(/^\/assets\/icons\//, '/icons/') || ''
}

const availableCount = computed(() => props.dishes.filter((dish) => dish.available).length)
const totalStock = computed(() => props.dishes.reduce((sum, dish) => sum + Number(dish.stock || 0), 0))
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

function money(value: number) {
  return `¥${Number(value || 0).toFixed(2)}`
}

function categoryDishCount(categoryId: number) {
  return props.dishes.filter((dish) => dish.categoryId === categoryId).length
}

function openCreateCategory() {
  editingCategoryId.value = undefined
  Object.assign(categoryForm, {
    code: '',
    name: '',
    iconUrl: '',
    sortOrder: props.categories.length + 1,
    enabled: true,
  })
  categoryDialogVisible.value = true
}

function openEditCategory(category: DishCategory) {
  editingCategoryId.value = category.id
  Object.assign(categoryForm, {
    code: category.code,
    name: category.name,
    iconUrl: category.iconUrl,
    sortOrder: category.sortOrder,
    enabled: category.enabled,
  })
  categoryDialogVisible.value = true
}

function submitCategory() {
  const payload = {
    code: categoryForm.code.trim(),
    name: categoryForm.name.trim(),
    iconUrl: categoryForm.iconUrl.trim(),
    sortOrder: Number(categoryForm.sortOrder),
    enabled: categoryForm.enabled,
  }
  if (!payload.code || !payload.name) return
  if (!payload.iconUrl) {
    ElMessage.warning('请选择分类图标')
    return
  }
  if (editingCategoryId.value) {
    emit('updateCategory', editingCategoryId.value, payload)
  } else {
    emit('createCategory', payload)
  }
  categoryDialogVisible.value = false
}

function selectCategoryIcon(libraryKey: string, iconName: string) {
  categoryForm.iconUrl = iconUrl(libraryKey, iconName)
  categoryIconPickerVisible.value = false
}
</script>

<template>
  <section class="module-view dishes-view">
    <header class="dishes-heading">
      <div class="dishes-heading-copy">
        <h1>商品管理</h1>
        <p>维护菜单内容，掌握每一款商品的销售状态</p>
      </div>
    </header>

    <section class="product-summary">
      <div class="summary-lead">
        <span>商品概览</span>
        <div><strong>{{ availableCount }}</strong><small>/ {{ dishes.length }} 款正在售卖</small></div>
      </div>
      <div class="summary-stat"><small>可售库存</small><strong>{{ totalStock }}</strong><span>份</span></div>
      <div class="summary-stat" :class="{ attention: soldOutCount > 0 }"><small>售罄商品</small><strong>{{ soldOutCount }}</strong><span>款</span></div>
      <div class="summary-stat"><small>菜单分类</small><strong>{{ categories.length }}</strong><span>组</span></div>
    </section>

    <el-collapse v-model="categoryPanelOpen" class="category-collapse">
      <el-collapse-item name="categories">
        <template #title>
          <div class="category-collapse-title">
            <span class="dishes-title-icon amber"><el-icon><CollectionTag /></el-icon></span>
            <span><strong>分类管理</strong><small>共 {{ categories.length }} 个分类</small></span>
          </div>
        </template>
        <div class="category-content">
          <div class="category-actions">
            <span>整理菜单分类及展示顺序</span>
            <div class="panel-actions">
              <el-button :icon="Refresh" circle :loading="loading" title="刷新分类" @click="$emit('refresh')" />
              <el-button type="primary" :icon="CirclePlus" @click="openCreateCategory">新增分类</el-button>
            </div>
          </div>
          <el-table class="dishes-table category-table" :data="categories" row-key="id" empty-text="暂无分类">
            <el-table-column label="排序" width="90"><template #default="{ row }"><span class="sort-badge">{{ row.sortOrder }}</span></template></el-table-column>
            <el-table-column label="图标" width="100">
              <template #default="{ row }">
                <div class="category-icon-cell">
                  <el-image v-if="row.iconUrl" :src="displayIconUrl(row.iconUrl)" fit="contain"><template #error><span>不可用</span></template></el-image>
                  <span v-else>未配置</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="分类名称" min-width="160"><template #default="{ row }"><strong class="category-name">{{ row.name }}</strong></template></el-table-column>
            <el-table-column label="分类编码" min-width="150"><template #default="{ row }"><code class="category-code">{{ row.code }}</code></template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="300" fixed="right" align="center">
              <template #default="{ row }"><div class="dish-row-actions"><el-button @click="openEditCategory(row)">编辑</el-button><el-button :type="row.enabled ? 'warning' : 'success'" plain @click="$emit('updateCategory', row.id, { enabled: !row.enabled })">{{ row.enabled ? '停用' : '启用' }}</el-button><el-button type="danger" plain @click="$emit('deleteCategory', row)">删除</el-button></div></template>
            </el-table-column>
          </el-table>
        </div>
      </el-collapse-item>
    </el-collapse>

    <section class="product-workbench">
      <header class="product-workbench-head">
        <div>
          <h2>商品库</h2>
        </div>
        <div class="panel-actions">
          <el-button class="quiet-icon-button" :icon="Refresh" circle :loading="loading" title="刷新商品" @click="$emit('refresh')" />
          <el-button type="primary" :icon="CirclePlus" @click="$emit('create')">新增商品</el-button>
        </div>
      </header>
      <nav class="product-category-tabs" aria-label="商品分类筛选">
        <button type="button" :class="{ active: categoryFilter === 'all' }" @click="categoryFilter = 'all'">
          全部商品 <span>{{ dishes.length }}</span>
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          :class="{ active: categoryFilter === category.id }"
          @click="categoryFilter = category.id"
        >
          {{ category.name }} <span>{{ categoryDishCount(category.id) }}</span>
        </button>
      </nav>
      <el-alert v-if="soldOutCount" type="warning" :closable="false" class="stock-alert" :title="`${soldOutCount} 个商品已售罄，请及时补库存或下架`" />
      <div class="product-toolbar">
        <el-input v-model="searchKeyword" class="product-search" clearable placeholder="搜索商品名称、描述或分类" :prefix-icon="Search" />
        <el-select v-model="statusFilter" class="product-filter">
          <el-option label="全部状态" value="all" />
          <el-option label="销售中" value="selling" />
          <el-option label="已下架" value="offline" />
          <el-option label="已售罄" value="soldOut" />
        </el-select>
        <span class="filter-result">找到 {{ filteredDishes.length }} 款</span>
      </div>
      <el-table class="dishes-table product-table" :data="filteredDishes" v-loading="loading" row-key="id" empty-text="暂无匹配商品">
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
            <div class="dish-row-actions dish-row-actions-compact">
              <el-button class="dish-edit-link" link @click="$emit('edit', row)">编辑 <el-icon><ArrowRight /></el-icon></el-button>
              <el-button class="dish-delete-link" type="danger" link @click="$emit('remove', row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="categoryDialogVisible" :title="editingCategoryId ? '编辑分类' : '新增分类'" width="460px">
      <el-form :model="categoryForm" label-width="84px">
        <el-form-item label="分类名称" required>
          <el-input v-model="categoryForm.name" placeholder="例如：螺蛳粉" />
        </el-form-item>
        <el-form-item label="分类编码" required>
          <el-input v-model="categoryForm.code" placeholder="例如：noodles" />
        </el-form-item>
        <el-form-item label="分类图标" required>
          <div class="category-icon-selector">
            <div class="category-icon-preview">
              <el-image v-if="categoryForm.iconUrl" :src="displayIconUrl(categoryForm.iconUrl)" fit="contain"><template #error><span>图标不可用</span></template></el-image>
              <span v-else>未选择</span>
            </div>
            <el-button type="primary" plain @click="categoryIconPickerVisible = true">选择图标</el-button>
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="categoryForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCategory">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryIconPickerVisible" title="选择分类图标" width="760px" append-to-body>
      <div class="icon-library-tabs">
        <button
          v-for="library in iconLibraries"
          :key="library.key"
          type="button"
          :class="{ active: selectedIconLibrary === library.key }"
          @click="selectedIconLibrary = library.key"
        >
          <strong>{{ library.name }}</strong><small>{{ library.source }}</small>
        </button>
      </div>
      <div class="category-icon-grid">
        <button
          v-for="icon in currentIconLibrary.icons"
          :key="icon[0]"
          type="button"
          class="category-icon-option"
          :class="{ active: categoryForm.iconUrl === iconUrl(currentIconLibrary.key, icon[0]) }"
          @click="selectCategoryIcon(currentIconLibrary.key, icon[0])"
        >
          <el-image class="category-icon-option-image" :src="iconUrl(currentIconLibrary.key, icon[0])" fit="contain" />
          <strong>{{ icon[1] }}</strong>
          <span>{{ icon[0] }}</span>
        </button>
      </div>
    </el-dialog>
  </section>
</template>
