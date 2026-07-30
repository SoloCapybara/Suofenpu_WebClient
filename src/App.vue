<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {
  Bowl,
  Box,
  Coin,
  Goods,
  House,
  Picture,
  Setting,
  Tickets,
  UserFilled,
} from '@element-plus/icons-vue'
import {
  createDish,
  createDishCategory,
  deleteDish,
  createImageFolder,
  deleteDishCategory,
  deleteImageAsset,
  listImageAssets,
  listDishCategories,
  listDishes,
  listOrders,
  updateDish,
  updateDishCategory,
  uploadImageAsset,
  updateOrderStatus,
  logoutAdmin,
  getCurrentAdmin,
} from './api'
import { clearAdminSession, getAdminToken, getStoredAdmin, updateStoredAdmin } from './auth'
import type { GalleryResponse, Dish, DishCategory, DishCategoryPayload, DishPayload, ImageAsset, Order, OrderStatus } from './types'
import type {
  DishForm,
  NavItem,
  NavKey,
  Section,
  StatCard,
  StatusMeta,
  TopOrderItem,
} from './admin-types'
import AdminLayout from './components/AdminLayout.vue'
import { AppMessage } from './components/AppMessage'
import DishEditorDialog from './components/DishEditorDialog.vue'
import DashboardView from './views/DashboardView.vue'
import DishesView from './views/DishesView.vue'
import GalleryView from './views/GalleryView.vue'
import NotFoundView from './views/NotFoundView.vue'
import OrdersView from './views/OrdersView.vue'
import SettingsView from './views/SettingsView.vue'
import ProfileView from './views/ProfileView.vue'
import UserManagementView from './views/UserManagementView.vue'
import { runThemeTransition } from './utils/theme-transition'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const ordersLoading = ref(false)
const dishesLoading = ref(false)
const imageAssetsLoading = ref(false)
const storeOpen = ref(true)
const darkMode = ref(localStorage.getItem('admin-theme') !== 'light')
const currentAdmin = ref(getStoredAdmin())

watch(
  darkMode,
  (enabled) => {
    document.documentElement.classList.toggle('dark', enabled)
    document.documentElement.style.colorScheme = enabled ? 'dark' : 'light'
    localStorage.setItem('admin-theme', enabled ? 'dark' : 'light')
  },
  { immediate: true },
)

async function toggleDarkMode() {
  const next = !darkMode.value
  await runThemeTransition(async () => {
    darkMode.value = next
    await nextTick()
  })
}

const orderStatusFilter = ref<OrderStatus | ''>('')
const orders = ref<Order[]>([])
const dishes = ref<Dish[]>([])
const dishCategories = ref<DishCategory[]>([])
const gallery = ref<GalleryResponse>({
  rootDir: '',
  publicPrefix: '/uploads/gallery',
  maxStorageBytes: 5 * 1024 * 1024 * 1024,
  usedStorageBytes: 0,
  remainingStorageBytes: 5 * 1024 * 1024 * 1024,
  maxFileBytes: 20 * 1024 * 1024,
  folders: [],
  images: [],
})
const dishDialogVisible = ref(false)
const dishFormRef = ref<FormInstance>()

const dishForm = reactive<DishForm>({
  name: '',
  description: '',
  shortDescription: '',
  imageUrl: '',
  categoryId: undefined,
  price: 16.8,
  stock: 50,
  available: true,
})

const settings = reactive({
  storeName: '嗦粉铺桂林七星店',
  businessHours: '10:00 - 22:00',
  deliveryRange: '门店 3 公里内',
  notice: '满 38 减 5，预计 25 分钟送达。',
})

const sectionTitles: Record<Section, string> = {
  dashboard: '今日经营',
  orders: '订单管理',
  dishes: '菜品管理',
  gallery: '图库管理',
  settings: '系统设置',
  users: '用户管理',
  profile: '个人中心',
  notFound: '404',
}

const navItems = [
  { key: 'home', section: 'dashboard', path: '/', label: '今日经营', icon: House },
  { key: 'orders', section: 'orders', path: '/orders', label: '订单管理', icon: Tickets },
  { key: 'goods', section: 'dishes', path: '/dishes', label: '商品管理', icon: Goods },
  { key: 'gallery', section: 'gallery', path: '/gallery', label: '图库管理', icon: Picture },
  { key: 'users', section: 'users', path: '/users', label: '用户管理', icon: UserFilled },
  { key: 'settings', section: 'settings', path: '/settings', label: '系统设置', icon: Setting },
] as const satisfies readonly NavItem[]

const activeSection = computed(() => (route.meta.section || 'notFound') as Section)
const activeNav = computed(() => (route.meta.navKey || '') as NavKey | '')

const statusMeta: Record<OrderStatus, StatusMeta> = {
  PENDING_PAYMENT: { label: '待支付', type: 'info' },
  PAID: { label: '待接单', type: 'warning', next: 'ACCEPTED', action: '接单' },
  ACCEPTED: { label: '已接单', type: 'warning', next: 'PREPARING', action: '开始制作' },
  PREPARING: { label: '制作中', type: '', next: 'DELIVERING', action: '出餐配送' },
  DELIVERING: { label: '配送中', type: '', next: 'COMPLETED', action: '完成' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' },
  REFUNDED: { label: '已退款', type: 'info' },
}

const dishRules: FormRules<DishForm> = {
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入菜品详情', trigger: 'blur' }],
  shortDescription: [{ required: true, message: '请输入短描述', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请选择商品图片', trigger: 'change' }],
  categoryId: [{ required: true, type: 'number', message: '请选择商品分类', trigger: 'change' }],
  price: [{ required: true, type: 'number', min: 0.01, message: '价格必须大于0', trigger: 'blur' }],
  stock: [{ required: true, type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }],
}

const todayRevenue = computed(() =>
  orders.value
    .filter((order) => order.status !== 'CANCELLED' && order.status !== 'REFUNDED')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
)
const lowStockDishes = computed(() => dishes.value.filter((dish) => dish.stock <= 10))
const soldOutDishes = computed(() => dishes.value.filter((dish) => dish.stock === 0))
const topOrderItems = computed<TopOrderItem[]>(() => {
  const countMap = new Map<string, number>()
  orders.value.forEach((order) => {
    order.items.forEach((item) => {
      countMap.set(item.dishName, (countMap.get(item.dishName) || 0) + item.quantity)
    })
  })
  return [...countMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
})
const todayOrderCount = computed(() => orders.value.length)
const pendingOrderStatuses = ['PAID', 'ACCEPTED', 'PREPARING', 'DELIVERING'] as const
const pendingOrders = computed(() =>
  orders.value.filter((order) => pendingOrderStatuses.includes(order.status as (typeof pendingOrderStatuses)[number])),
)
const pendingOrderCount = computed(() => pendingOrders.value.length)

const statCards = computed<StatCard[]>(() => [
  {
    label: '今日营业额',
    value: money(todayRevenue.value),
    unit: '',
    icon: Coin,
    color: 'green',
  },
  {
    label: '今日订单',
    value: String(todayOrderCount.value),
    unit: '单',
    icon: Tickets,
    color: 'purple',
  },
  {
    label: '待处理订单',
    value: String(pendingOrderCount.value),
    unit: '单',
    icon: Bowl,
    color: 'orange',
  },
  {
    label: '库存预警',
    value: String(lowStockDishes.value.length),
    unit: '项',
    icon: Box,
    color: 'blue',
  },
])

function money(value: number) {
  return `¥${Number(value || 0).toFixed(2)}`
}

async function refreshOrders() {
  ordersLoading.value = true
  try {
    orders.value = await listOrders(orderStatusFilter.value)
  } catch (error) {
    AppMessage.error((error as Error).message)
  } finally {
    ordersLoading.value = false
  }
}

async function refreshDishes() {
  dishesLoading.value = true
  try {
    const [categories, dishList] = await Promise.all([listDishCategories(), listDishes()])
    dishCategories.value = categories
    dishes.value = dishList
  } catch (error) {
    AppMessage.error((error as Error).message)
  } finally {
    dishesLoading.value = false
  }
}

async function refreshImageAssets() {
  imageAssetsLoading.value = true
  try {
    gallery.value = await listImageAssets()
  } catch (error) {
    AppMessage.error((error as Error).message)
  } finally {
    imageAssetsLoading.value = false
  }
}

async function refreshAll() {
  loading.value = true
  try {
    await Promise.all([refreshOrders(), refreshDishes(), refreshImageAssets()])
  } finally {
    loading.value = false
  }
}

async function advanceOrder(order: Order) {
  const next = statusMeta[order.status].next
  if (!next) return
  try {
    const updated = await updateOrderStatus(order.orderNo, next)
    replaceOrder(updated)
    AppMessage.success(`订单 ${order.orderNo} 已更新为${statusMeta[next].label}`)
  } catch (error) {
    AppMessage.error((error as Error).message)
  }
}

async function cancelOrder(order: Order) {
  try {
    await ElMessageBox.confirm(`确认取消订单 ${order.orderNo}？`, '取消订单', {
      type: 'warning',
      confirmButtonText: '取消订单',
      cancelButtonText: '再想想',
    })
    const updated = await updateOrderStatus(order.orderNo, 'CANCELLED')
    replaceOrder(updated)
    AppMessage.success('订单已取消')
  } catch (error) {
    if (error instanceof Error) AppMessage.error(error.message)
  }
}

function replaceOrder(updated: Order) {
  const index = orders.value.findIndex((order) => order.orderNo === updated.orderNo)
  if (index >= 0) orders.value.splice(index, 1, updated)
}

function openCreateDish() {
  const defaultCategory = dishCategories.value.find((category) => category.enabled) || dishCategories.value[0]
  Object.assign(dishForm, {
    id: undefined,
    name: '',
    description: '',
    shortDescription: '',
    imageUrl: '',
    categoryId: defaultCategory?.id,
    price: 16.8,
    stock: 50,
    available: true,
  })
  dishDialogVisible.value = true
}

function openEditDish(dish: Dish) {
  Object.assign(dishForm, {
    id: dish.id,
    name: dish.name,
    description: dish.description,
    shortDescription: dish.shortDescription,
    imageUrl: dish.imageUrl,
    categoryId: dish.categoryId,
    price: Number(dish.price),
    stock: dish.stock,
    available: dish.available,
  })
  dishDialogVisible.value = true
}

async function submitDish() {
  if (!dishFormRef.value) return
  const valid = await dishFormRef.value.validate().catch(() => false)
  if (!valid) return

  const payload: Required<DishPayload> = {
    name: dishForm.name,
    description: dishForm.description,
    shortDescription: dishForm.shortDescription,
    imageUrl: dishForm.imageUrl,
    categoryId: Number(dishForm.categoryId),
    price: Number(dishForm.price),
    stock: Number(dishForm.stock),
    available: dishForm.available,
  }

  try {
    if (dishForm.id) {
      const updated = await updateDish(dishForm.id, payload)
      replaceDish(updated)
      AppMessage.success('菜品已更新')
    } else {
      const created = await createDish(payload)
      dishes.value.unshift(created)
      AppMessage.success('菜品已新增')
    }
    dishDialogVisible.value = false
  } catch (error) {
    AppMessage.error((error as Error).message)
  }
}

async function toggleDish(dish: Dish) {
  try {
    const updated = await updateDish(dish.id, { available: !dish.available })
    replaceDish(updated)
    AppMessage.success(`${dish.name}${updated.available ? '已上架' : '已下架'}`)
  } catch (error) {
    AppMessage.error((error as Error).message)
  }
}

async function removeDish(dish: Dish) {
  try {
    await ElMessageBox.confirm(`确认删除商品「${dish.name}」？删除后不可恢复，历史订单不会受影响。`, '删除商品', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteDish(dish.id)
    dishes.value = dishes.value.filter((item) => item.id !== dish.id)
    AppMessage.success('商品已删除')
  } catch (error) {
    if (error instanceof Error) AppMessage.error(error.message)
  }
}

async function createCategory(payload: Required<DishCategoryPayload>) {
  try {
    await createDishCategory(payload)
    await refreshDishes()
    AppMessage.success('分类已新增')
  } catch (error) {
    AppMessage.error((error as Error).message)
  }
}

async function updateCategory(id: number, payload: DishCategoryPayload) {
  try {
    await updateDishCategory(id, payload)
    await refreshDishes()
    AppMessage.success('分类已更新')
  } catch (error) {
    AppMessage.error((error as Error).message)
  }
}

async function removeCategory(category: DishCategory) {
  try {
    await ElMessageBox.confirm(`确认删除分类「${category.name}」？已有商品引用的分类不能删除。`, '删除分类', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteDishCategory(category.id)
    await refreshDishes()
    AppMessage.success('分类已删除')
  } catch (error) {
    if (error instanceof Error) AppMessage.error(error.message)
  }
}

async function createGalleryFolder(path: string) {
  try {
    await createImageFolder(path)
    await refreshImageAssets()
    AppMessage.success('图库目录已创建')
  } catch (error) {
    AppMessage.error((error as Error).message)
  }
}

async function uploadGalleryImage(folder: string, file: File) {
  try {
    await uploadImageAsset(folder, file)
    await refreshImageAssets()
    AppMessage.success('图片已上传')
  } catch (error) {
    AppMessage.error((error as Error).message)
  }
}

async function removeGalleryImage(imageAsset: ImageAsset) {
  try {
    await ElMessageBox.confirm(`确认删除图库图片「${imageAsset.name}」？商品里已保存的图片地址不会自动清空。`, '删除图库图片', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteImageAsset(imageAsset.id)
    await refreshImageAssets()
    AppMessage.success('图库图片已删除')
  } catch (error) {
    if (error instanceof Error) AppMessage.error(error.message)
  }
}

async function removeGalleryImages(imageAssets: ImageAsset[]) {
  if (!imageAssets.length) return
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${imageAssets.length} 张图库图片？商品里已保存的图片地址不会自动清空。`, '批量删除图库图片', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await Promise.all(imageAssets.map((imageAsset) => deleteImageAsset(imageAsset.id)))
    await refreshImageAssets()
    AppMessage.success('图库图片已批量删除')
  } catch (error) {
    if (error instanceof Error) AppMessage.error(error.message)
  }
}

function replaceDish(updated: Dish) {
  const index = dishes.value.findIndex((dish) => dish.id === updated.id)
  if (index >= 0) dishes.value.splice(index, 1, updated)
}

function saveSettings() {
  AppMessage.success('门店设置已保存到当前页面状态')
}

function selectNav(key: string) {
  const item = navItems.find((nav) => nav.key === key)
  if (!item) return
  router.push(item.path)
}

async function handleLogout() {
  try {
    await logoutAdmin()
  } catch {
    // The local session must still be cleared if the server session already expired.
  }
  clearAdminSession()
  await router.replace('/login')
  AppMessage.success('已安全退出')
}

function syncAdminSession() {
  currentAdmin.value = getStoredAdmin()
  if (currentAdmin.value && route.meta.public) refreshAll()
}

async function refreshCurrentAdmin() {
  if (!getAdminToken()) return
  try {
    const profile = await getCurrentAdmin()
    currentAdmin.value = profile
    updateStoredAdmin(profile)
  } catch {
    // The HTTP interceptor handles expired sessions and redirects to login.
  }
}

onMounted(() => {
  window.addEventListener('admin-auth-changed', syncAdminSession)
  if (getAdminToken() && !route.meta.public) {
    refreshCurrentAdmin()
    refreshAll()
  }
})

onBeforeUnmount(() => window.removeEventListener('admin-auth-changed', syncAdminSession))
</script>

<template>
  <el-config-provider :locale="zhCn">
  <router-view v-if="route.meta.public" />
  <template v-else>
  <AdminLayout
    v-loading="loading"
    v-model:store-open="storeOpen"
    :dark-mode="darkMode"
    :active-nav="activeNav"
    :nav-items="navItems"
    :admin-name="currentAdmin?.displayName || '管理员'"
    :admin-role="currentAdmin?.role || 'OWNER'"
    @select-nav="selectNav"
    @toggle-dark-mode="toggleDarkMode"
    @refresh="refreshAll"
    @logout="handleLogout"
    @profile="router.push('/profile')"
  >
    <DashboardView
      v-if="activeSection === 'dashboard'"
      :stat-cards="statCards"
      :pending-orders="pendingOrders"
      :low-stock-dishes="lowStockDishes"
      :top-order-items="topOrderItems"
      :status-meta="statusMeta"
      :store-name="settings.storeName"
      :business-hours="settings.businessHours"
      :notice="settings.notice"
      :store-open="storeOpen"
      :loading="loading"
      @refresh="refreshAll"
      @go-orders="router.push('/orders')"
      @go-dishes="router.push('/dishes')"
      @advance="advanceOrder"
    />

    <OrdersView
      v-else-if="activeSection === 'orders'"
      v-model:order-status-filter="orderStatusFilter"
      :orders="orders"
      :loading="ordersLoading"
      :status-meta="statusMeta"
      @refresh="refreshOrders"
      @advance="advanceOrder"
      @cancel="cancelOrder"
    />

    <DishesView
      v-else-if="activeSection === 'dishes'"
      :dishes="dishes"
      :categories="dishCategories"
      :loading="dishesLoading"
      :sold-out-count="soldOutDishes.length"
      @refresh="refreshDishes"
      @create="openCreateDish"
      @edit="openEditDish"
      @toggle="toggleDish"
      @remove="removeDish"
      @create-category="createCategory"
      @update-category="updateCategory"
      @delete-category="removeCategory"
    />

    <SettingsView
      v-else-if="activeSection === 'settings'"
      :title="sectionTitles[activeSection]"
      :settings="settings"
      @save="saveSettings"
    />

    <ProfileView
      v-else-if="activeSection === 'profile'"
      :profile="currentAdmin"
      @updated="currentAdmin = $event"
    />

    <UserManagementView
      v-else-if="activeSection === 'users'"
      :current-admin="currentAdmin"
    />

    <GalleryView
    v-else-if="activeSection === 'gallery'"
      :gallery="gallery"
      :loading="imageAssetsLoading"
      @refresh="refreshImageAssets"
      @create-folder="createGalleryFolder"
      @upload="uploadGalleryImage"
      @delete="removeGalleryImage"
      @delete-many="removeGalleryImages"
    />

    <NotFoundView v-else />
  </AdminLayout>

  <DishEditorDialog
    v-model:visible="dishDialogVisible"
    v-model:form-ref="dishFormRef"
    :dish-form="dishForm"
    :rules="dishRules"
    :categories="dishCategories"
    :image-assets="gallery.images"
    @submit="submitDish"
  />
  </template>
  </el-config-provider>
</template>
