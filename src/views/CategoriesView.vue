<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { CirclePlus, CollectionTag, Refresh } from '@element-plus/icons-vue'
import { AppMessage } from '../components/AppMessage'
import AppButton from '../components/AppButton.vue'
import ListEmptyState from '../components/ListEmptyState.vue'
import PageHeading from '../components/PageHeading.vue'
import type { Dish, DishCategory, DishCategoryPayload } from '../types'

const props = defineProps<{
  categories: DishCategory[]
  dishes: Dish[]
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
  createCategory: [payload: Required<DishCategoryPayload>]
  updateCategory: [id: number, payload: DishCategoryPayload]
  deleteCategory: [category: DishCategory]
}>()

const categoryDialogVisible = ref(false)
const categoryIconPickerVisible = ref(false)
const selectedIconLibrary = ref('lucide')
const editingCategoryId = ref<number>()
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
const enabledCount = computed(() => props.categories.filter((category) => category.enabled).length)

function iconUrl(libraryKey: string, iconName: string) {
  if (libraryKey === 'lucide') return `/icons/lucide/${iconName}.svg`
  return `https://api.iconify.design/material-symbols:${iconName}.svg?color=%235f6b7a`
}

function displayIconUrl(iconUrlValue: string) {
  return iconUrlValue?.replace(/^\/assets\/icons\//, '/icons/') || ''
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
    AppMessage.warning('请选择分类图标')
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
  <section class="viewport-page module-view categories-view">
    <PageHeading title="分类管理" description="整理菜单分类、图标与展示顺序">
      <template #actions>
        <AppButton :icon="Refresh" :loading="loading" @click="$emit('refresh')">刷新</AppButton>
        <AppButton type="primary" :icon="CirclePlus" @click="openCreateCategory">新增分类</AppButton>
      </template>
    </PageHeading>

    <section class="user-stat-row categories-stat-row">
      <div>
        <span class="user-stat-icon amber"><CollectionTag /></span>
        <p>全部分类<strong>{{ categories.length }}</strong><small>菜单分组总数</small></p>
      </div>
      <div>
        <span class="user-stat-icon green"><CollectionTag /></span>
        <p>启用中<strong>{{ enabledCount }}</strong><small>小程序可见分类</small></p>
      </div>
      <div>
        <span class="user-stat-icon blue"><CollectionTag /></span>
        <p>关联商品<strong>{{ dishes.length }}</strong><small>已挂载到分类的商品</small></p>
      </div>
    </section>

    <section class="list-surface">
      <div class="list-surface__scroll">
        <el-table
          class="admin-data-table category-table"
          :data="categories"
          v-loading="loading"
          row-key="id"
          height="100%"
        >
          <template #empty>
            <ListEmptyState
              variant="category"
              title="暂无分类"
              description="点击右上角「新增分类」创建第一个菜单分类"
            />
          </template>
          <el-table-column label="排序" width="90">
            <template #default="{ row }"><span class="sort-badge">{{ row.sortOrder }}</span></template>
          </el-table-column>
          <el-table-column label="图标" width="100">
            <template #default="{ row }">
              <div class="category-icon-cell">
                <el-image v-if="row.iconUrl" :src="displayIconUrl(row.iconUrl)" fit="contain">
                  <template #error><span>不可用</span></template>
                </el-image>
                <span v-else>未配置</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="分类名称" min-width="160">
            <template #default="{ row }"><strong class="category-name">{{ row.name }}</strong></template>
          </el-table-column>
          <el-table-column label="分类编码" min-width="150">
            <template #default="{ row }"><code class="category-code">{{ row.code }}</code></template>
          </el-table-column>
          <el-table-column label="商品数" width="100">
            <template #default="{ row }">{{ categoryDishCount(row.id) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300" fixed="right" align="left" header-align="left">
            <template #default="{ row }">
              <div class="data-list-actions">
                <AppButton link @click="openEditCategory(row)">编辑</AppButton>
                <AppButton link :type="row.enabled ? 'warning' : 'success'" @click="$emit('updateCategory', row.id, { enabled: !row.enabled })">
                  {{ row.enabled ? '停用' : '启用' }}
                </AppButton>
                <AppButton link type="danger" @click="$emit('deleteCategory', row)">删除</AppButton>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
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
              <el-image v-if="categoryForm.iconUrl" :src="displayIconUrl(categoryForm.iconUrl)" fit="contain">
                <template #error><span>图标不可用</span></template>
              </el-image>
              <span v-else>未选择</span>
            </div>
            <AppButton type="primary" plain @click="categoryIconPickerVisible = true">选择图标</AppButton>
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
        <AppButton @click="categoryDialogVisible = false">取消</AppButton>
        <AppButton type="primary" @click="submitCategory">保存</AppButton>
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
