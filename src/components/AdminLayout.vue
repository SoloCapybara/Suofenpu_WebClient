<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowDown, Bowl, Shop, SwitchButton, UserFilled } from '@element-plus/icons-vue'
import type { NavItem, NavKey } from '../admin-types'
import AdminAvatar from './AdminAvatar.vue'
import GlobalSearchSpotlight from './GlobalSearchSpotlight.vue'
import RefreshToolbarButton from './RefreshToolbarButton.vue'
import StoreStatusToggle from './StoreStatusToggle.vue'
import ThemeToggle from './ThemeToggle.vue'

const props = defineProps<{
  activeNav: NavKey | ''
  navItems: readonly NavItem[]
  storeOpen: boolean
  darkMode: boolean
  adminName: string
  adminAvatarUrl?: string | null
  adminRole: string
  globalSearch: string
  refreshing?: boolean
}>()

const emit = defineEmits<{
  selectNav: [key: string]
  refresh: []
  'update:storeOpen': [value: boolean]
  'update:globalSearch': [value: string]
  globalSearch: []
  clearGlobalSearch: []
  toggleDarkMode: []
  logout: []
  profile: []
}>()

function submitGlobalSearch() {
  emit('globalSearch')
}

const accountMenuOpen = ref(false)

function onAccountMenuVisibleChange(visible: boolean) {
  accountMenuOpen.value = visible
}

const menuWrapRef = ref<HTMLElement | null>(null)
const indicatorTop = ref(0)
const indicatorHeight = ref(46)
const indicatorReady = ref(false)

const indicatorStyle = computed(() => ({
  transform: `translate3d(0, ${indicatorTop.value}px, 0)`,
  height: `${indicatorHeight.value}px`,
  opacity: indicatorReady.value ? 1 : 0,
}))

function updateIndicator() {
  const wrap = menuWrapRef.value
  if (!wrap) return

  const active = wrap.querySelector('.el-menu-item.is-active') as HTMLElement | null
  if (!active) {
    indicatorReady.value = false
    return
  }

  const wrapRect = wrap.getBoundingClientRect()
  const itemRect = active.getBoundingClientRect()
  indicatorTop.value = Math.round(itemRect.top - wrapRect.top + wrap.scrollTop)
  indicatorHeight.value = Math.round(itemRect.height)
  indicatorReady.value = true
}

watch(
  () => props.activeNav,
  async () => {
    await nextTick()
    updateIndicator()
  },
)

onMounted(() => {
  nextTick(updateIndicator)
  window.addEventListener('resize', updateIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIndicator)
})
</script>

<template>
  <el-container class="admin-shell">
    <el-aside width="236px" class="sidebar">
      <div class="brand">
        <div class="brand-mark">
          <Bowl />
        </div>
        <strong>粉店经营后台</strong>
      </div>

      <div ref="menuWrapRef" class="side-menu-wrap">
        <div class="side-menu-indicator" :style="indicatorStyle" aria-hidden="true"></div>
        <el-menu :default-active="activeNav" class="side-menu" @select="$emit('selectNav', $event)">
          <el-menu-item v-for="item in navItems" :key="item.key" :index="item.key">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="version-card">
        <div class="version-art"><Shop /></div>
        <strong>版本 1.0.0</strong>
        <span>数据实时更新中</span>
      </div>
    </el-aside>

    <el-container class="main-panel">
      <el-header class="topbar">
        <GlobalSearchSpotlight
          :model-value="globalSearch"
          @update:model-value="emit('update:globalSearch', $event)"
          @search="submitGlobalSearch"
          @clear="emit('clearGlobalSearch')"
        />

        <div class="top-toolbar">
          <el-tooltip :content="darkMode ? '切换为浅色模式' : '切换为深色模式'" placement="bottom" :show-after="500">
            <ThemeToggle :dark-mode="darkMode" @toggle="$emit('toggleDarkMode')" />
          </el-tooltip>

          <StoreStatusToggle
            :model-value="storeOpen"
            @update:model-value="emit('update:storeOpen', $event)"
          />

          <el-tooltip content="刷新数据" placement="bottom">
            <RefreshToolbarButton :loading="refreshing" @refresh="emit('refresh')" />
          </el-tooltip>

          <el-dropdown
            trigger="click"
            placement="bottom-end"
            :show-arrow="false"
            popper-class="account-dropdown-popper"
            @visible-change="onAccountMenuVisibleChange"
            @command="(command: string) => command === 'profile' ? $emit('profile') : command === 'logout' && $emit('logout')"
          >
            <button
              type="button"
              class="admin-user-trigger"
              :class="{ 'admin-user-trigger--open': accountMenuOpen }"
              :aria-expanded="accountMenuOpen"
            >
              <AdminAvatar :display-name="adminName" :avatar-url="adminAvatarUrl" :size="34" variant="topbar" />
              <div class="admin-user-meta">
                <strong>{{ adminName }}</strong>
                <span>{{ adminRole === 'OWNER' ? '超级管理员' : '管理员' }}</span>
              </div>
              <el-icon class="admin-user-arrow"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <div class="account-dropdown-head">
                <AdminAvatar :display-name="adminName" :avatar-url="adminAvatarUrl" :size="40" variant="dropdown" />
                <div><strong>{{ adminName }}</strong><span>{{ adminRole === 'OWNER' ? '超级管理员' : '管理员' }}</span></div>
              </div>
              <el-dropdown-menu class="account-dropdown-menu">
                <el-dropdown-item command="profile" :icon="UserFilled">
                  <span><strong>个人中心</strong><small>资料与账号安全</small></span>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout" :icon="SwitchButton">
                  <span><strong>退出登录</strong><small>安全退出当前账号</small></span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="content">
        <div :key="activeNav || 'empty'" class="content-enter">
          <slot />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>
