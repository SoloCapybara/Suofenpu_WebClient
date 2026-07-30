<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowDown, Bowl, Moon, Refresh, Search, Shop, Sunny, SwitchButton, UserFilled } from '@element-plus/icons-vue'
import type { NavItem, NavKey } from '../admin-types'
import AppButton from './AppButton.vue'

const props = defineProps<{
  activeNav: NavKey | ''
  navItems: readonly NavItem[]
  storeOpen: boolean
  darkMode: boolean
  adminName: string
  adminRole: string
}>()

defineEmits<{
  selectNav: [key: string]
  refresh: []
  'update:storeOpen': [value: boolean]
  toggleDarkMode: []
  logout: []
  profile: []
}>()

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
        <div class="top-search">
          <el-input placeholder="搜索订单、商品..." :prefix-icon="Search" clearable />
        </div>

        <div class="top-toolbar">
          <div class="top-toolbar-group">
            <span class="theme-toggle-anchor">
              <el-tooltip :content="darkMode ? '切换为浅色模式' : '切换为深色模式'" placement="bottom" :show-after="500">
                <AppButton
                  class="top-toolbar-btn"
                  circle
                  :icon="darkMode ? Sunny : Moon"
                  :aria-label="darkMode ? '切换为浅色模式' : '切换为深色模式'"
                  @click="$emit('toggleDarkMode')"
                />
              </el-tooltip>
            </span>

            <button
              type="button"
              class="store-status-chip"
              :class="{ open: storeOpen }"
              @click="$emit('update:storeOpen', !storeOpen)"
            >
              <span class="store-status-dot"></span>
              <span>{{ storeOpen ? '营业中' : '已打烊' }}</span>
            </button>

            <el-tooltip content="刷新数据" placement="bottom">
              <AppButton class="top-toolbar-btn" circle :icon="Refresh" aria-label="刷新数据" @click="$emit('refresh')" />
            </el-tooltip>
          </div>

          <el-dropdown
            trigger="click"
            placement="bottom-end"
            popper-class="account-dropdown-popper"
            @command="(command: string) => command === 'profile' ? $emit('profile') : command === 'logout' && $emit('logout')"
          >
            <button type="button" class="admin-user-trigger">
              <div class="avatar">{{ adminName.slice(0, 1) }}</div>
              <div class="admin-user-meta">
                <strong>{{ adminName }}</strong>
                <span>{{ adminRole === 'OWNER' ? '超级管理员' : '管理员' }}</span>
              </div>
              <el-icon class="admin-user-arrow"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <div class="account-dropdown-head">
                <div class="account-dropdown-avatar">{{ adminName.slice(0, 1) }}</div>
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
